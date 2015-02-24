from flask import Flask, request, session, redirect, url_for, render_template, \
    jsonify, make_response, flash
import os
import sys
import importlib

# Import settings module
if __name__ == "__main__":
    if not os.environ.get('FLASK_SETTINGS_MODULE', ''):
        os.environ['FLASK_SETTINGS_MODULE'] = 'core.settings.loc'

settings_module = os.environ.get('FLASK_SETTINGS_MODULE')

try:
    importlib.import_module(settings_module)
except ImportError, e:
    raise ImportError("Could not import settings '%s' (Is it on sys.path?): %s" % (settings_module, e))

import re
import json
import traceback
import time
import datetime
import urllib
import urlparse
import hashlib
import tempfile
import subprocess
import requests
import slugify
import bson
from storymap import storage
from storymap.connection import _user


app = Flask(__name__)
app.config.from_envvar('FLASK_CONFIG_MODULE')

settings = sys.modules[settings_module]


@app.context_processor
def inject_urls():
    """
    Inject urls into the templates. 
    Template variable will always have a trailing slash.
    """
    static_url = settings.STATIC_URL or app.static_url_path
    if not static_url.endswith('/'):
        static_url += '/'
        
    storage_url = settings.AWS_STORAGE_BUCKET_URL
    if not storage_url.endswith('/'):
        storage_url += '/'
    storage_url += settings.AWS_STORAGE_BUCKET_KEY
    if not storage_url.endswith('/'):
        storage_url += '/'
    
    cdn_url = settings.CDN_URL
    if not cdn_url.endswith('/'):
        cdn_url += '/'
        
    return dict(
        STATIC_URL=static_url, static_url=static_url, 
        STORAGE_URL=storage_url, storage_url=storage_url, 
        CDN_URL=cdn_url, cdn_url=cdn_url)  

class APIEncoder(json.JSONEncoder):
    def default(self, obj):
        """Format obj as json."""
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        if isinstance(obj, bson.objectid.ObjectId):
            return str(obj)
        return json.JSONEncoder.default(self, obj)

def _str2bool(s):
    """Convert string to boolean."""
    return s.lower() in ("true", "t", "yes", "y", "1")

def _request_wants_json():
    """Determine response type."""
    best = request.accept_mimetypes \
        .best_match(['application/json', 'text/html'])
    return best == 'application/json' and \
        request.accept_mimetypes[best] > \
        request.accept_mimetypes['text/html']

def _jsonify(*args, **kwargs):
    """Convert to JSON"""
    return app.response_class(json.dumps(dict(*args, **kwargs), cls=APIEncoder),
        mimetype='application/json')

def _format_err(err_type, err_msg):
    return  "%s: %s" % (err_type, err_msg)

def _get_uid(user_string):
    """Generate a unique identifer for user string"""
    return hashlib.md5(user_string).hexdigest()

def _utc_now():
    return datetime.datetime.utcnow().isoformat()+'Z'

#
# Request
#

def _request_get(key):
    """Verify existence of request data and return value"""
    if request.method == 'POST':
        value = request.form.get(key)
    else:
        value = request.args.get(key)
    if not value:
        raise Exception('Expected "%s" parameter' % key)
    return value

def _request_get_list(*keys):
    """Verify existence of request data and return values"""
    if request.method == 'POST':
        obj = request.form
    else:
        obj = request.args
    values = []
    for k in keys:
        v = obj.get(k)
        if not v:
            raise Exception('Expected "%s" parameter' % k)
        values.append(v)
    return values

#
# Session
#

def _session_get(key):
    """Verify existence of session data and return value"""
    value = session.get(key)
    if not value:
        raise Exception('Expected "%s" in session' % key)
    return value
        
def _session_get_list(*keys):
    """Verify existence of session data and return values"""
    values = []
    for k in keys:
        if not k in session:
            raise Exception('Expected "%s" in session' % k)
        values.append(session.get(k))
    return values

def _session_pop(*keys):
    """Remove list of keys from session"""
    for k in keys:
        if k in session:
            session.pop(k)

#
# Auth
#    

@app.route("/google/auth/", methods=['GET', 'POST'])
def google_auth():
    try:        
        id, name = _request_get_list('id', 'name')
        uid = _get_uid('google:'+id)
        
        # Upsert user record
        user = _user.find_one({'uid': uid})
        if user:            
            user['google'] = {
                'id': id,
                'name': name
            }
        else:
            user = {
                'uid': uid,
                'migrated': 0,
                'storymaps': {},
                'google': {
                    'id': id,
                    'name': name
                }
            }
        _user.save(user)
        user['uname'] = name                  
        
        # Update session
        session['uid'] = uid
            
        return _jsonify({'error': '', 'user': user})          
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})          

def _get_user():
    """
    Get user record for session['uid']
    """
    uid = session.get('uid')
    if not uid:
        raise Exception('Expected "uid" in session')       
    user = _user.find_one({'uid': uid})
    if not user:
        raise Exception('Could not find user record for "%s"' % uid)
    return user

def _get_user_verify(id):
    """
    Get user record and verify access to storymap with id
    """
    user = _get_user()
    if id not in user['storymaps']:
        raise Exception('You do not have permission to access to this StoryMap')
    return user           

def _make_storymap_id(user, title):
    """
    Get unique storymap id from slugified title
    """
    id_base = slugify.slugify(title, only_ascii=True)
    id = id_base        
    n = 0
    while id in user['storymaps']:
        n += 1
        id = '%s-%d' % (id_base, n)    
    return id

def _write_embed(embed_key_name, title, json_key_name, image_url=''):
    """
    Write embed page
    """    
    # TODO: THIS IS JUST THE DEFAULT IMAGE URL
    image_url = image_url or settings.STATIC_URL+'img/logos/logo_storymap.png'

    # NOTE: facebook needs the protocol on embed_url for og tag
    content = render_template('_embed.html',
        title=title,
        embed_url='http'+settings.AWS_STORAGE_BUCKET_URL+embed_key_name,
        image_url=image_url,
        json_url=settings.AWS_STORAGE_BUCKET_URL+json_key_name
    )            
    storage.save_from_data(embed_key_name, 'text/html', content)

def _write_embed_draft(key_prefix, title, image_url=''):
    """
    Write embed page for draft storymap
    """
    _write_embed(key_prefix+'draft.html', 
        title, key_prefix+'draft.json', image_url)
    
def _write_embed_published(key_prefix, title, image_url=''):
    """
    Write embed for published storymap
    """
    _write_embed(key_prefix+'index.html', 
        title, key_prefix+'published.json', image_url)

#
# API views
# These are called from the select page
#
               
@app.route('/storymap/rename/', methods=['GET', 'POST'])
def storymap_rename():
    """
    Rename a storymap
    """
    try:
        id, title = _request_get_list('id', 'title')
        user = _get_user_verify(id)
        key_prefix = storage.key_prefix(user['uid'], id)
        
        user['storymaps'][id]['title'] = title
        _user.save(user)
    
        _write_embed_draft(key_prefix, title)
                        
        if 'published_on' in user['storymaps'][id] \
        and user['storymaps'][id]['published_on']:
            _write_embed_published(key_prefix, title)
                    
        return jsonify({'error': ''})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

@app.route('/storymap/copy/', methods=['GET', 'POST'])
def storymap_copy():
    """
    Copy storymap
    @id = storymap to copy
    @name = name of new copy
    """
    try:
        id, title = _request_get_list('id', 'title')
        user = _get_user_verify(id)
        dst_id = _make_storymap_id(user, title)
              
        src_key_prefix = storage.key_prefix(user['uid'], id)
        dst_key_prefix = storage.key_prefix(user['uid'], dst_id)

        src_re = re.compile(r'%s' % src_key_prefix)
        has_published = False
        
        src_key_list, more = storage.list_keys(src_key_prefix, 999, '') 
        for src_key in src_key_list:
            file_name = src_key.name.split(src_key_prefix)[-1]
            dst_key_name = "%s%s" % (dst_key_prefix, file_name)
            
            if file_name.endswith('.json'):
                json_string = src_key.get_contents_as_string()
                storage.save_json(dst_key_name, 
                    src_re.sub(dst_key_prefix, json_string))
                
                if file_name == 'published.json':
                    has_published = True
            else:
                storage.copy_key(src_key.name, dst_key_name)
    
        # Update meta
        dt = _utc_now()
        user['storymaps'][dst_id] = {         
            'id': dst_id,
            'title': title,
            'draft_on': dt,
            'published_on': (has_published and dt) or ''
        }
        _user.save(user)
        
        # Rewrite embed pages
        _write_embed_draft(dst_key_prefix, title)        
        if has_published:
            _write_embed_published(dst_key_prefix, title)
                    
        return jsonify(user['storymaps'][dst_id])
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

@app.route('/storymap/delete/')
def storymap_delete():
    """
    Delete storymap from S3
    """
    try:
        id = _request_get('id')
        user = _get_user_verify(id)
        
        key_name = storage.key_name(user['uid'], id)        
        key_list, marker = storage.list_keys(key_name, 50)        
        for key in key_list:
            storage.delete(key.name);
            
        del user['storymaps'][id]
        _user.save(user)
     
        return jsonify({'error': ''})    
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})    
    
@app.route('/storymap/create/', methods=['POST'])
def storymap_create():
    """
    Create a storymap in S3
    """
    try:
        user = _get_user()  
        title, data = _request_get_list('title', 'd')
                         
        id = _make_storymap_id(user, title)
        key_prefix = storage.key_prefix(user['uid'], id)
        
        content = json.loads(data)           
        storage.save_json(key_prefix+'draft.json', content)     
        
        user['storymaps'][id] = {
            'id': id,
            'title': title,
            'draft_on': _utc_now(),
            'published_on': ''
        }
        _user.save(user)
        
        _write_embed_draft(key_prefix, title)
                                           
        return jsonify({'error': '', 'id': id})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

@app.route('/storymap/migrate/done/', methods=['GET'])
def storymap_migrate_done():
    """
    Flag user as migrated
    """
    try:
        user = _get_user()
        user['migrated'] = 1
        _user.save(user)
        
        return jsonify({'error': ''})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

@app.route('/storymap/migrate/', methods=['POST'])
def storymap_migrate():
    """
    Migrate a storymap
    @title = storymap title
    @url = storymap base url
    @draft_on = ...
    @published_on = ...
    @file_list = json encoded list of file names
    """
    try:
        user = _get_user()  
        title, src_url, draft_on, published_on, file_list_json = \
            _request_get_list(
                'title', 'url', 'draft_on', 'published_on', 'file_list')
        file_list = json.loads(file_list_json)

        dst_id = _make_storymap_id(user, title)
        dst_key_prefix = storage.key_prefix(user['uid'], dst_id)        
        dst_url = settings.AWS_STORAGE_BUCKET_URL+dst_key_prefix
        dst_img_url = dst_url+'_images/'
       
        re_img = re.compile(r'.*\.(png|gif|jpg|jpeg)$', re.I)
        re_src = re.compile(r'%s' % src_url)
        
        for file_name in file_list:
            file_url = "%s%s" % (src_url, file_name)
            
            if file_name.endswith('.json'):
                key_name = storage.key_name(user['uid'], dst_id, file_name)
                r = requests.get(file_url)                
                storage.save_json(key_name, re_src.sub(dst_img_url, r.text))
            elif re_img.match(file_name):
                key_name = storage.key_name(user['uid'], dst_id, '_images', file_name)
                storage.save_from_url(key_name, file_url)
            else:
                continue # skip
                      
        user['storymaps'][dst_id] = {         
            'id': dst_id,
            'title': title,
            'draft_on': draft_on,
            'published_on': published_on
        }
        _user.save(user)
        
        _write_embed_draft(dst_key_prefix, title)
        if published_on:
            _write_embed_published(dst_key_prefix, title)
        
        return jsonify(user['storymaps'][dst_id])
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

#
# API views
# These are called from the edit page
#
        
@app.route('/storymap/')
def storymap_get():
    """
    Get storymap from S3        
    """
    try:
        id = _request_get('id')
        user = _get_user_verify(id)
                
        key_name = storage.key_name(user['uid'], id, 'draft.json')
        data = storage.load_json(key_name)    
                    
        return jsonify({'meta': user['storymaps'][id], 'data': data})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})   
         
@app.route('/storymap/save/', methods=['POST'])
def storymap_save():
    """
    Save draft storymap to S3
    """
    try:
        id, data = _request_get_list('id', 'd')
        user = _get_user_verify(id)
        
        key_name = storage.key_name(user['uid'], id, 'draft.json')
        content = json.loads(data)          
        storage.save_json(key_name, content)    
        
        user['storymaps'][id]['draft_on'] = _utc_now()
        _user.save(user)
            
        return jsonify({'error': '', 'meta': user['storymaps'][id]})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

@app.route('/storymap/publish/', methods=['POST'])
def storymap_publish():
    """
    Save published storymap
    """
    try:
        id, data = _request_get_list('id', 'd')
        user = _get_user_verify(id)
        key_prefix = storage.key_prefix(user['uid'], id)

        content = json.loads(data)          
        storage.save_json(key_prefix+'published.json', content)    

        user['storymaps'][id]['published_on'] = _utc_now()
        _user.save(user)
        
        _write_embed_published(key_prefix, user['storymaps'][id]['title'])
           
        return jsonify({'error': '', 'meta': user['storymaps'][id]})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

        
@app.route('/storymap/image/list/', methods=['GET', 'POST'])
def storymap_image_list():
    """
    List storymap images in S3
    """
    try:
        id = _request_get('id')
        user = _get_user_verify(id)
        
        key_prefix = storage.key_prefix(user['uid'], id, '_images')
        key_list, more = storage.list_key_names(key_prefix, 999, '') 
        
        image_list = [n.split('/')[-1] for n in key_list]
        return jsonify({'image_list': image_list})    
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})


@app.route('/storymap/image/save/', methods=['POST'])
def storymap_image_save():
    """
    Save image to S3
    @id = storymap id
    @name = file name
    @content = data:URL representing the file's data as base64 encoded string
    """
    try:
        id, name, content = _request_get_list('id', 'name', 'content')
        user = _get_user_verify(id)
       
        m = re.match('data:(.+);base64,(.+)', content)
        if m:
            content_type = m.group(1)
            content = m.group(2).decode('base64')
        else:
            raise Exception('Expected content as data-url')

        key_name = storage.key_name(user['uid'], id, '_images', name)
        storage.save_from_data(key_name, content_type, content)
        
        return jsonify({'url': settings.AWS_STORAGE_BUCKET_URL+key_name})    
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

                               
#
# Views
#

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/gigapixel/")
def gigapixel():
    return render_template('gigapixel.html')

@app.route("/advanced/")
def advanced():
    return render_template('advanced.html')

@app.route("/examples/<name>/")
def examples(name):
    return render_template('examples/%s.html' % name)

@app.route("/logout/")
def logout():
    _session_pop('uid')    
    return redirect('http://www.google.com/accounts/Logout')
        
@app.route("/select.html/", methods=['GET', 'POST']) # legacy
@app.route("/select/", methods=['GET', 'POST'])
def select():
    try:
        uid = session.get('uid')       
        if not uid:
            return render_template('select.html')
        
        user = _user.find_one({'uid': uid})
        if not user:   
            _session_pop('uid')   
            return render_template('select.html')
        del user['_id']
              
        return render_template('select.html', user=user)  
    except Exception, e:
        traceback.print_exc()
        return render_template('select.html', error=str(e))

@app.route("/edit/", methods=['GET', 'POST'])
def edit():
    try:
        uid = session.get('uid') 
        if not uid:
            return redirect(url_for('select'))

        user = _user.find_one({'uid': uid})
        if not user:   
            _session_pop('uid')   
            return redirect(url_for('select'))
        del user['_id']
      
        if 'google' in user:
            if uid == _get_uid('google:'+user['google']['id']):
                user['uname'] = user['google']['name']
        else:
            pass # wtf
           
        id = _request_get('id')
        if id not in user['storymaps']:
            return redirect(url_for('select'))
        
        return render_template('edit.html', 
            user=user, meta=user['storymaps'][id])
    except Exception, e:
        traceback.print_exc()
        return render_template('edit.html', error=str(e))


#
# FOR DEVELOPMENT
# SERVE URLS FROM DIRECTORIES
#

from flask import send_from_directory

build_dir = os.path.join(settings.PROJECT_ROOT, 'build')
compiled_dir = os.path.join(settings.PROJECT_ROOT, 'compiled')
templates_dir = os.path.join(settings.PROJECT_ROOT, 'compiled/templates')

@app.route('/build/<path:path>')
def catch_build(path):
    return send_from_directory(build_dir, path)    

@app.route('/compiled/<path:path>')
def catch_compiled(path):
    return send_from_directory(compiled_dir, path)    

@app.route('/editor/templates/<path:path>')
def catch_compiled_templates(path):
    return send_from_directory(templates_dir, path)      

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

