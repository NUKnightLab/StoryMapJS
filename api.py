from flask import Flask, request, session, redirect, url_for, \
    render_template, jsonify, abort
from collections import defaultdict
import os
import sys
import importlib
import traceback
import time
import datetime
import re
import json
from functools import wraps
import urllib
from urlparse import urlparse


# Import settings module
if __name__ == "__main__":
    if not os.environ.get('FLASK_SETTINGS_MODULE', ''):
        os.environ['FLASK_SETTINGS_MODULE'] = 'core.settings.loc'

settings_module = os.environ.get('FLASK_SETTINGS_MODULE')

try:
    importlib.import_module(settings_module)
except ImportError, e:
    raise ImportError("Could not import settings '%s' (Is it on sys.path?): %s" % (settings_module, e))

import hashlib
import requests
import slugify
import bson
from oauth2client.client import OAuth2WebServerFlow
from storymap import storage, google
from storymap.connection import _user

app = Flask(__name__)
app.config.from_envvar('FLASK_CONFIG_MODULE')

settings = sys.modules[settings_module]

_GOOGLE_OAUTH_SCOPES = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/userinfo.profile'
];
   
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
# request/session
#

def _request_get(*keys):
    """Get request data and return values"""
    if request.method == 'POST':
        obj = request.form
    else:
        obj = request.args
    values = []
    for k in keys:
        v = obj.get(k)
        values.append(v)
    if len(values) > 1:
        return values
    return values[0]
    
def _request_get_required(*keys):
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
    if len(values) > 1:
        return values
    return values[0]

def _session_get(*keys):
    """Verify existence of session data and return value"""
    values = []
    for k in keys:
        v = session.get(key)
        if not v:
            raise Exception('Expected "%s" in session' % key)
        values.append(v)
    if len(values) > 1:
        return values
    return values[0]
        
def _session_pop(*keys):
    """Remove list of keys from session"""
    for k in keys:
        if k in session:
            session.pop(k)

#
# auth
# https://developers.google.com/drive/web/quickstart/quickstart-python
#
   
@app.route("/google/auth/start/", methods=['GET', 'POST'])
def google_auth_start():
    """Initiate google authorization"""
    flow = OAuth2WebServerFlow(
        settings.GOOGLE_CLIENT_ID,
        settings.GOOGLE_CLIENT_SECRET,
        _GOOGLE_OAUTH_SCOPES,
        redirect_uri='http://'+request.host+url_for('google_auth_verify')
    )
    authorize_url = flow.step1_get_authorize_url()
    return redirect(authorize_url)

@app.route("/google/auth/verify/", methods=['GET', 'POST'])
def google_auth_verify():
    """Finalize google authorization"""
    try:        
        if 'error' in request.args:
            raise Exception(_format_err(
                'Error getting authorization', request.args.get('error')))
            
        code = _request_get_required('code')
        
        flow = OAuth2WebServerFlow(
            settings.GOOGLE_CLIENT_ID,
            settings.GOOGLE_CLIENT_SECRET,
            _GOOGLE_OAUTH_SCOPES,
            redirect_uri='http://'+request.host+url_for('google_auth_verify')
        )
        credentials = flow.step2_exchange(code)
        # ^ this is an oauth2client.client.OAuth2Credentials object
        
        # Get user info
        userinfo = google.get_userinfo(
            google.get_userinfo_service(credentials))           
        if not userinfo:
            raise Exception('Could not get Google user info') 
       
        info = {
            'id': userinfo.get('id'),
            'name': userinfo.get('name'),
            'credentials': credentials.to_json()
        }
        if not info['id']:
            raise Exception('Could not get Google user ID')
            
        # Upsert user record
        uid = _get_uid('google:'+info['id'])

        user = _user.find_one({'uid': uid})
        if user:            
            user['google'] = info
        else:
            user = {
                'uid': uid,
                'migrated': 0,
                'storymaps': {},
                'google': info
            }
        user['uname'] = info['name']                  
        _user.save(user)
         
        # Update session
        session['uid'] = uid
                 
        return redirect(url_for('select'))         
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})          


#
# Misc
#

def _user_get():
    """Enforce authenticated user"""
    uid = session.get('uid')
    if not uid:
        return redirect(url_for('select'))
    user = _user.find_one({'uid': uid})
    if not user:
        session.pop('uid')
        return redirect(url_for('select'))
    return user
    
def require_user(f):
    """
    Decorator to enforce authenticated user
    Adds user to request and kwargs
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = _user_get()
        request.user = user
        kwargs['user'] = user
        return f(*args, **kwargs)
    return decorated_function
 
def require_user_id(template=None):
    """
    Decorator to enfore storymap access for authenticated user
    Adds user to request and kwargs, adds id to kwargs
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = _user_get()
        
            id = _request_get_required('id')
            if id not in user['storymaps']:
                error = 'You do not have permission to access to this StoryMap'                
                if template:
                    del user['_id'] # for serialization
                    return render_template('edit.html', user=user, error=error)
                else:
                    return jsonify({'error': error})
    
            request.user = user
            kwargs['user'] = user
            kwargs['id'] = id
            return f(*args, **kwargs)
        return decorated_function
    return decorator
               
def _make_storymap_id(user, title):
    """Get unique storymap id from slugified title"""
    id_set = set(user['storymaps'].keys())
    
    # Add keys from S3 (in case of db issues)
    user_key_prefix = storage.key_prefix(user['uid'])
    regex = re.compile(r'^%s([^/]+).*' % user_key_prefix)
    
    name_list, more = storage.list_key_names(user_key_prefix, 999, '')
    for name in name_list:
        m = regex.match(name)
        if m:
            id_set.add(m.group(1))    
        
    id_base = slugify.slugify(title)
    id = id_base        
    n = 0
    while id in id_set:
        n += 1
        id = '%s-%d' % (id_base, n)    
    return id

def _parse_url(url):
    """Parse url into (scheme, netloc, path, filename)"""
    r = urlparse(url)
    parts = r.path.split('/')
    return {
        'scheme': r.scheme or 'http', 
        'netloc': r.netloc, 
        'path': '/'.join(parts[:-1]), 
        'file': parts[-1]
    }
    
def _write_embed(embed_key_name, json_key_name, meta):
    """Write embed page"""    
    # NOTE: facebook needs the protocol on embed_url for og tag
    image_url = meta.get('image_url', settings.STATIC_URL+'img/logos/logo_storymap.png')
    parts = _parse_url(image_url)
    parts['path'] = urllib.quote(parts['path'])
    image_url = '%(scheme)s://%(netloc)s%(path)s/%(file)s' % parts
        
    content = render_template('_embed.html',
        embed_url='http:'+urllib.quote(settings.AWS_STORAGE_BUCKET_URL+embed_key_name),
        json_url=urllib.quote(settings.AWS_STORAGE_BUCKET_URL+json_key_name),
        title=meta.get('title', ''),
        description=meta.get('description', ''),
        image_url=image_url
    )            
    storage.save_from_data(embed_key_name, 'text/html', content)

def _write_embed_draft(key_prefix, meta):
    """Write embed page for draft storymap """
    _write_embed(key_prefix+'draft.html', key_prefix+'draft.json', meta)
    
def _write_embed_published(key_prefix, meta):
    """Write embed for published storymap"""
    _write_embed(key_prefix+'index.html', key_prefix+'published.json', meta)

#
# API views
# (called from the select page)
#
       
@app.route('/storymap/update/meta/', methods=['GET', 'POST'])
@require_user_id()
def storymap_update_meta(user, id):
    """Update storymap meta value"""
    try:
        key, value = _request_get_required('key', 'value')
        
        user['storymaps'][id][key] = value
        _user.save(user)
 
        key_prefix = storage.key_prefix(user['uid'], id)
       
        if key in ['title', 'description', 'image_url']:
            _write_embed_draft(key_prefix, user['storymaps'][id])
            
            if user['storymaps'][id].get('published_on'):
                _write_embed_published(key_prefix, user['storymaps'][id])
     
        return jsonify(user['storymaps'][id])
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})
                
@app.route('/storymap/copy/', methods=['GET', 'POST'])
@require_user_id()
def storymap_copy(user, id):
    """
    Copy storymap
    @id = storymap to copy
    @title = name of new copy
    """
    try:
        title = _request_get_required('title')
        dst_id = _make_storymap_id(user, title)
              
        src_key_prefix = storage.key_prefix(user['uid'], id)
        dst_key_prefix = storage.key_prefix(user['uid'], dst_id)

        src_re = re.compile(r'%s' % src_key_prefix)
        
        src_key_list, more = storage.list_keys(src_key_prefix, 999, '') 
        for src_key in src_key_list:
            file_name = src_key.name.split(src_key_prefix)[-1]
            dst_key_name = "%s%s" % (dst_key_prefix, file_name)
            
            if file_name.endswith('.json'):
                json_string = src_key.get_contents_as_string()
                storage.save_json(dst_key_name, 
                    src_re.sub(dst_key_prefix, json_string))
            else:
                storage.copy_key(src_key.name, dst_key_name)
    
        # Update meta
        user['storymaps'][dst_id] = {         
            'id': dst_id,
            'title': title,
            'draft_on': user['storymaps'][id]['draft_on'],
            'published_on': user['storymaps'][id]['published_on']
        }
        _user.save(user)
        
        # Write new embed pages
        _write_embed_draft(dst_key_prefix, user['storymaps'][dst_id])        
        if user['storymaps'][dst_id].get('published_on'):
            _write_embed_published(dst_key_prefix, user['storymaps'][dst_id])
                    
        return jsonify(user['storymaps'][dst_id])
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

@app.route('/storymap/delete/')
@require_user_id()
def storymap_delete(user, id):
    """Delete storymap"""
    try:
        key_name = storage.key_name(user['uid'], id)        
        key_list, marker = storage.list_keys(key_name, 50)        
        for key in key_list:
            storage.delete(key.name);
            
        del user['storymaps'][id]
        _user.save(user)
     
        return jsonify({})    
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})    
    
@app.route('/storymap/create/', methods=['POST'])
@require_user
def storymap_create(user):
    """Create a storymap"""
    try:
        title, data = _request_get_required('title', 'd')
                         
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
        
        _write_embed_draft(key_prefix, user['storymaps'][id])
                                           
        return jsonify({'id': id})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

@app.route('/storymap/migrate/done/', methods=['GET'])
@require_user
def storymap_migrate_done(user):
    """Flag user as migrated"""
    try:
        user['migrated'] = 1
        _user.save(user)
        
        return jsonify({})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

@app.route('/storymap/migrate/list/', methods=['GET', 'POST'])
@require_user
def storymap_migrate_list(user):
    """Get list of storymaps that still need to be migrated"""
    try:
        credentials = google.get_credentials(user['google']['credentials'])
        drive_service = google.get_drive_service(credentials)
        
        existing = [d['title'] for (k, d) in user['storymaps'].items()]
      
        temp_list = google.drive_get_migrate_list(drive_service)
        migrate_list = [r for r in temp_list if r['title'] not in existing]
                    
        return jsonify({'migrate_list': migrate_list})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})
    
@app.route('/storymap/migrate/', methods=['POST'])
@require_user
def storymap_migrate(user):
    """
    Migrate a storymap
    @title = storymap title
    @url = storymap base url
    @draft_on = ...
    @published_on = ...
    @file_list = json encoded list of file names
    """
    try:
        title, src_url, draft_on, file_list_json = _request_get_required(
            'title', 'url', 'draft_on', 'file_list')
        published_on = _request_get('published_on')
                    
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
        
        _write_embed_draft(dst_key_prefix, user['storymaps'][dst_id])
        if published_on:
            _write_embed_published(dst_key_prefix, user['storymaps'][dst_id])
        
        return jsonify(user['storymaps'][dst_id])
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

#
# API views
# (called from the edit page)
#
      
@app.route('/storymap/')
@require_user_id()
def storymap_get(user, id):
    """Get storymap"""
    try:
        key_name = storage.key_name(user['uid'], id, 'draft.json')
        data = storage.load_json(key_name)    
                    
        return jsonify({'meta': user['storymaps'][id], 'data': data})
    except storage.StorageException, e:
        traceback.print_exc()
        return jsonify({'error': str(e), 'error_detail': e.detail})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})   
         
@app.route('/storymap/save/', methods=['POST'])
@require_user_id()
def storymap_save(user, id):
    """Save draft storymap"""
    try:
        data = _request_get_required('d')
        
        key_name = storage.key_name(user['uid'], id, 'draft.json')
        content = json.loads(data)          
        storage.save_json(key_name, content)    
        
        user['storymaps'][id]['draft_on'] = _utc_now()
        _user.save(user)
            
        return jsonify({'meta': user['storymaps'][id]})
    except storage.StorageException, e:
        traceback.print_exc()
        return jsonify({'error': str(e), 'error_detail': e.detail})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

@app.route('/storymap/publish/', methods=['POST'])
@require_user_id()
def storymap_publish(user, id):
    """Save published storymap"""
    try:
        data = _request_get_required('d')
        
        key_prefix = storage.key_prefix(user['uid'], id)
        content = json.loads(data)          
        storage.save_json(key_prefix+'published.json', content)    

        user['storymaps'][id]['published_on'] = _utc_now()
        _user.save(user)
        
        _write_embed_published(key_prefix, user['storymaps'][id])
           
        return jsonify({'meta': user['storymaps'][id]})
    except storage.StorageException, e:
        traceback.print_exc()
        return jsonify({'error': str(e), 'error_detail': e.detail})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})
       
@app.route('/storymap/image/list/', methods=['GET', 'POST'])
@require_user_id()
def storymap_image_list(user, id):
    """List storymap images """
    try:
        key_prefix = storage.key_prefix(user['uid'], id, '_images')
        key_list, more = storage.list_key_names(key_prefix, 999, '') 
        
        image_list = [n.split('/')[-1] for n in key_list]
        return jsonify({'image_list': image_list})    
    except storage.StorageException, e:
        traceback.print_exc()
        return jsonify({'error': str(e), 'error_detail': e.detail})
    except Exception, e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

@app.route('/storymap/image/save/', methods=['POST'])
@require_user_id()
def storymap_image_save(user, id):
    """
    Save storymap image
    @id = storymap id
    @name = file name
    @content = data:URL representing the file's data as base64 encoded string
    """
    try:
        name, content = _request_get_required('name', 'content')
       
        m = re.match('data:(.+);base64,(.+)', content)
        if m:
            content_type = m.group(1)
            content = m.group(2).decode('base64')
        else:
            raise Exception('Expected content as data-url')

        key_name = storage.key_name(user['uid'], id, '_images', name)
        storage.save_from_data(key_name, content_type, content)
        
        return jsonify({'url': settings.AWS_STORAGE_BUCKET_URL+key_name})    
    except storage.StorageException, e:
        traceback.print_exc()
        return jsonify({'error': str(e), 'error_detail': e.detail})
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

@app.route("/userinfo/")
def userinfo():
    import pprint
    
    uid = session.get('uid')
    user = None
    
    if uid:
        user = _user.find_one({'uid': uid})
        if user:
            del user['_id']
            user = pprint.pformat(user, indent=4)            
            
    return render_template('userinfo.html',
        uid=uid, user=user)
  
@app.route("/select.html/", methods=['GET', 'POST'])
@app.route("/edit.html/", methods=['GET', 'POST'])
def legacy_redirect():
    """Legacy redirect"""
    return redirect(url_for('select'))
      
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
@require_user_id('edit.html')
def edit(user, id):
    try:        
        del user['_id'] # for serialization
        
        return render_template('edit.html', 
            user=user, meta=user['storymaps'][id])
    except Exception, e:
        traceback.print_exc()
        return render_template('edit.html', error=str(e))


@app.route('/admin/')
@require_user
def admin(user):
    if not user['uid'] in settings.ADMINS:
        abort(401)
    files = defaultdict(list)
    users = []
    for k in storage.all_keys():
        uid = k.split('/')[1]
        files[uid].append(k) 
    for u in _user.find():
        u.update({ 'files': files[u['uid']] })
        users.append(u)
        del files[u['uid']]
    data = {
        'users': users,
        'unmatched files': files
    }
    return _jsonify(data)


@app.route("/qunit/", methods=['GET'])
def qunit():
    return render_template('qunit.html')


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


# redirect old documentation URLs
@app.route('/<path:path>')
def redirect_old_urls(path):
    if path.endswith('.html'):
        return redirect(url_for(path.split('.')[0]))
    abort(404)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

