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

    cdn_url = settings.CDN_URL
    if not cdn_url.endswith('/'):
        cdn_url += '/'
        
    return dict(STATIC_URL=static_url, static_url=static_url, 
        storage_url=storage_url, cdn_url=cdn_url)  

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

def _get_user():
    """Get user record for session['uid']"""
    uid = session.get('uid')
    if not uid:
        raise Exception('Expected "uid" in session')       
    user = _user.find_one({'uid': uid})
    if not user:
        raise Exception('Could not find user record for "%s"' % uid)
    return user

def _utc_now():
    return datetime.datetime.utcnow().isoformat()+'Z'

#
# Request
#

def _request_get(key):
    if request.method == 'POST':
        value = request.form.get(key)
    else:
        value = request.args.get(key)
    if not value:
        raise Exception('Expected "%s" parameter' % key)
    return value

def _request_get_list(*keys):
    """Verify existence of request data and return values"""
    
    print request.method
    print request.form
    
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
# Utility
#

def _list_storymaps(uid):
    """
    List user storymaps
    """
    key_name = "storymap/%s/" % uid  
    json_re = re.compile('%s(.+)/draft.json' % key_name)

    print 'LISTING STORYMAPS', key_name
    

    key_name_list, more = storage.list_key_names(key_name, 999)
    pitcha_list = []
    
    # Look for json files
    for key_name in key_name_list:
        print key_name
        m = json_re.match(key_name)
        if m:
            print 'STORYMAP', m.group(1)
        continue
        
        m = json_re.match(key_name)
        if m:
            pitcha_id = m.group(1)
            
            # Check for thumbnail
            thumb_name = storage.pitcha_thumb_name(uid, pitcha_id)
            if thumb_name in key_name_list:
                pitcha_list.append({
                    'id': pitcha_id, 
                    'thumb': settings.AWS_STORAGE_BUCKET_URL+thumb_name
                })
            else:
                pitcha_list.append({
                    'id': pitcha_id
                })


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
    
        _list_storymaps(uid)
        
        return _jsonify({'error': '', 'user': user})          
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})          
           

#
# API views
#

   
@app.route('/image/list/', methods=['GET', 'POST'])
def image_list():
    """
    List next 20 user images in S3
    @marker = marker for pagination (if applicable)
    """
    try:
        uid = _session_get('uid')
        
        marker = request.form.get('marker') or ''
        
        key_name = "pitcha/%s/_images/" % uid     
        key_list, more = storage.list_keys(key_name, 20, marker)  
        image_list = []
        
        for key in key_list:
            image_list.append(
                {'url': settings.AWS_STORAGE_BUCKET_URL+key.name})
        
        if more:
            marker = key_list[-1].name
        else:
            marker = ''
            
        return jsonify({'image_list': image_list, 'marker': marker})    
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})
        
@app.route('/image/delete/', methods=['GET', 'POST'])
def image_delete():
    """
    Delete image from S3
    @url = url of the image
    """
    try:
        uid = _session_get('uid')
        url = request.form.get('url')
        if not url:
            raise Exception('Expected "url" parameter')
        
        m = re.match('.*%s(pitcha/%s/_images/.+)' \
            % (settings.AWS_STORAGE_BUCKET_URL, uid), url)
        if not m:
            raise Exception('Invalid image url')
        
        key_name = m.group(1)
        storage.delete(key_name);       
        return jsonify({'error': ''})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

@app.route('/image/save/', methods=['GET', 'POST'])
def image_save():
    """
    Save image to S3
    @ext = file extension
    @content = data:URL representing the file's data as base64 encoded string
    """
    try:
        uid = _session_get('uid')
        
        ext = request.form.get('ext')
        content = request.form.get('content')
        if not ext:
            raise Exception('Expected "ext" parameter')
        if not content:
            raise Exception('Expected "content" parameter')
    
        m = re.match('data:(.+);base64,(.+)', content)
        if m:
            content_type = m.group(1)
            content = m.group(2).decode('base64')
        else:
            raise Exception('Expected content as data-url')
                    
        key_name = storage.image_key_name(uid, ext)  
        storage.save_from_data(key_name, content_type, content)
        return jsonify({'url': settings.AWS_STORAGE_BUCKET_URL+key_name})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})
     
@app.route('/image/import/', methods=['GET', 'POST'])
def image_import():
    """
    Import user image to S3
    @url = the url of the image
    """
    try:
        uid = _session_get('uid')

        url = request.form.get('url')
        if not url:
            raise Exception('Expected "url" parameter')
            
        path = urlparse.urlparse(url).path        
        key_name = storage.image_key_name(uid, path.split('.')[-1])  
        storage.save_from_url(key_name, url)                
        return jsonify({'url': settings.AWS_STORAGE_BUCKET_URL+key_name})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})


#
#
#

@app.route('/storymap/create/', methods=['POST'])
def storymap_create():
    """
    Create a storymap in S3
    """
    try:
        uid = _session_get('uid')
        title, data = _request_get_list('title', 'd')
        
        user = _user.find_one({'uid': uid})
        if not user:   
            raise Exception('Could not find user record')
        
        # Get unique id from slugified name
        id_base = slugify.slugify(title, only_ascii=True)
        id = id_base        
        n = 0
        while id in user['storymaps']:
            n += 1
            id = '%s-$d' % (id_base, n)
              
        # Save storymap to S3
        key_name = 'storymap/%s/%s/draft.json' % (uid, id)
        print 'key_name', key_name
        
        content = json.loads(data)           
        storage.save_json(key_name, content)     
        
        # Save to user storymaps
        user['storymaps'][id] = {
            'id': id,
            'title': title,
            'draft_on': _utc_now(),
            'published_on': ''
        }
        _user.save(user)
                                   
        return jsonify({'error': '', 'id': id})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})
        
@app.route('/storymap/')
def storymap_get():
    """
    Get storymap with <id> from S3        
    """
    try:
        uid = _session_get('uid')
        id = _request_get('id')
        
        user = _user.find_one({'uid': uid})
        if not user:   
            raise Exception('Could not find user record')
        if id not in user['storymaps']:
            raise Exception('You do not have permission to access to this StoryMap')
        
        key_name = 'storymap/%s/%s/draft.json' % (uid, id)
        print 'key_name', key_name
        
        data = storage.load_json(key_name)                
        return jsonify({
            'meta': user['storymaps'][id], 
            'data': data
        })
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})   

@app.route('/storymap/rename/', methods=['GET', 'POST'])
def storymap_rename():
    """
    Rename a storymap
    """
    try:
        uid = _session_get('uid')
        id, title = _request_get_list('id', 'title')

        user = _user.find_one({'uid': uid})
        if not user:   
            raise Exception('Could not find user record')
        if id not in user['storymaps']:
            raise Exception('You do not have permission to access to this StoryMap')
        
        user['storymaps'][id]['title'] = title
        _user.save(user)
    
        return jsonify({'error': ''})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})
                
@app.route('/storymap/save/', methods=['POST'])
def storymap_save():
    """
    Save draft storymap to to S3
    """
    try:
        uid = _session_get('uid')
        id, data = _request_get_list('id', 'd')

        user = _user.find_one({'uid': uid})
        if not user:   
            raise Exception('Could not find user record')
        if id not in user['storymaps']:
            raise Exception('You do not have permission to access to this StoryMap')

        key_name = 'storymap/%s/%s/draft.json' % (uid, id)
        #DEBUG
        print 'key_name', key_name
        
        content = json.loads(data)          
        storage.save_json(key_name, content)    
        
        user['storymaps'][id]['draft_on'] = _utc_now()
        _user.save(user)
                    
        return jsonify({'error': ''})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

@app.route('/storymap/publish/', methods=['POST'])
def storymap_publish():
    """
    Save published storymap to to S3
    """
    try:
        uid = _session_get('uid')
        id, data = _request_get_list('id', 'd')

        user = _user.find_one({'uid': uid})
        if not user:   
            raise Exception('Could not find user record')
        if id not in user['storymaps']:
            raise Exception('You do not have permission to access to this StoryMap')

        key_name = 'storymap/%s/%s/published.json' % (uid, id)
        #DEBUG
        print 'key_name', key_name
        
        content = json.loads(data)          
        storage.save_json(key_name, content)    

        user['storymaps'][id]['published_on'] = _utc_now()
        _user.save(user)
            
        return jsonify({'error': ''})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})
        
@app.route('/storymap/delete/')
def storymap_delete():
    """
    Delete storymap from S3
    """
    try:
        uid = _session_get('uid')
        id = _request_get('id')

        user = _user.find_one({'uid': uid})
        if not user:   
            raise Exception('Could not find user record')
        if id not in user['storymaps']:
            raise Exception('You do not have permission to access to this StoryMap')
        
        key_prefix = 'storymap/%s/%s' % (uid, id)
        print 'key_prefix', key_prefix
        
        key_list, marker = storage.list_keys(key_prefix, 50)        
        for key in key_list:
            print 'storymap_delete', key.name
            storage.delete(key.name);
            
        del user['storymaps'][id]
        _user.save(user)
     
        return jsonify({'error': ''})    
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})
                        
#
# Primary views
#

@app.route("/logout/")
def logout():
    """Logout"""
    _session_pop('uid')    
    return redirect(url_for('index'))
        
@app.route("/")
def index():
    """Main website page"""
    return render_template('index.html')

@app.route("/select/", methods=['GET', 'POST'])
def select():
    """Storymap select"""
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
    """Storymap edit"""  
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
        
        return render_template('edit.html', user=user, 
            storymap_meta=user['storymaps'][id])
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


#
# Doit
#   

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
