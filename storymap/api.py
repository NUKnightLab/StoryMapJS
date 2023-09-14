from __future__ import division
from flask import Flask, request, session, redirect, url_for, \
    render_template, jsonify, abort, send_file, after_this_request
from flask import g
from werkzeug.exceptions import Forbidden
from collections import defaultdict
import copy
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
import mimetypes
import tempfile
from urllib.parse import urlparse, urljoin, quote, urlencode
from flask_cors import cross_origin
from zipfile import ZipFile

from .tasks import storymap_cleanup


# Import settings module
if __name__ == "__main__":
    if not os.environ.get('FLASK_SETTINGS_MODULE', ''):
        os.environ['FLASK_SETTINGS_MODULE'] = 'storymap.core.settings.loc'

settings_module = os.environ.get('FLASK_SETTINGS_MODULE')

try:
    importlib.import_module(settings_module)
except ImportError as e:
    raise ImportError("Could not import settings '%s' (Is it on sys.path?): %s" % (settings_module, e))

import hashlib
import requests
import slugify
from oauth2client.client import OAuth2WebServerFlow
from .connection import get_user, save_user, create_user, find_users, pg_conn
from . import googleauth
from . import storage


def db():
    if 'db' not in g:
        g.db = pg_conn()
    return g.db


def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_app(app):
    app.teardown_appcontext(close_db)


def create_app():
    app = Flask(__name__)
    init_app(app)
    return app


app = create_app()
app.config.from_envvar('FLASK_SETTINGS_FILE')
settings = sys.modules[settings_module]
# LOCAL_STORAGE_MODE is no longer supported. Use localstack instead.
app.config['LOCAL_STORAGE_MODE'] = settings.LOCAL_STORAGE_MODE
app.config['TEST_MODE'] = settings.TEST_MODE
examples_json = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'examples.json')
faq_json = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'faq.json')

_GOOGLE_OAUTH_SCOPES = [
#    'https://www.googleapis.com/auth/drive.readonly', # we may need to restore this if there are legacy accounts unmigrated
    'https://www.googleapis.com/auth/userinfo.profile'
];


'''
@app.before_request
def https_redirect():
    """Generally, in deployment, https redirect will be handled by the proxy
    rather than here by the application. This is a mere convenience to forward
    to https in development. Still, this should work in theory for deployment
    if no proxy redirect is being used.
    """
    if not request.is_secure:
        url = request.url.replace("http://", "https://", 1)
        code = 302 if os.environ.get('FLASK_ENV') == 'development' else 301
        return redirect(url, code=code)
'''


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


@app.context_processor
def inject_index_data():
    examples = json.load(open(examples_json))
    # note this appears elsewhere and should probably be done once
    # but I'm feeling lazy right now
    static_url = settings.STATIC_URL or app.static_url_path 
    for e in examples:
        for key in ["link","thumbnail","source_logo"]:
            if not e[key].startswith('http'):
                e[key] = urljoin(static_url,e[key])

    return dict(examples=examples,faqs=json.load(open(faq_json)))

class APIEncoder(json.JSONEncoder):
    def default(self, obj):
        """Format obj as json."""
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
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
    return hashlib.md5(user_string.encode('utf-8')).hexdigest()

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

def _build_oauth_redirect(request,path):
    host = request.host
    url = 'https://{}{}'.format(host, path) # must always use https even for local
    app.logger.info("_build_oauth_redirect url: {}".format(url))
    return url


@app.route("/google/auth/start/", methods=['GET', 'POST'])
def google_auth_start():
    """Initiate google authorization"""
    flow = OAuth2WebServerFlow(
        settings.GOOGLE_CLIENT_ID,
        settings.GOOGLE_CLIENT_SECRET,
        _GOOGLE_OAUTH_SCOPES,
        redirect_uri=_build_oauth_redirect(request, url_for('google_auth_verify'))
    )
    authorize_url = flow.step1_get_authorize_url()
    app.logger.info("google_auth_start url: {}".format(authorize_url))
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
            redirect_uri=_build_oauth_redirect(request, url_for('google_auth_verify'))
        )
        credentials = flow.step2_exchange(code)
        # ^ this is an oauth2client.client.OAuth2Credentials object

        # Get user info
        userinfo = googleauth.get_userinfo(
            googleauth.get_userinfo_service(credentials))
        if not userinfo:
            raise Exception('Could not get Google user info')

        info = {
            'id': userinfo.get('id'),
            'name': userinfo.get('name'),
            'credentials': credentials.to_json()
        }
        if not info['id']:
            raise Exception('Could not get Google user ID')

        uid = _get_uid('google:'+info['id'])
        if 'stg-storymap.knightlab.com' in domains and not uid in admins:
            raise Exception(
                "You are not authorized to access this page. Please send the " \
                "following information to support@knightlab.zendesk.com: " \
                "stg-storymap.knightlab.com unauthorized %s" % uid)

        print('upsert user', uid)

        # Upsert user record
        user = get_user(uid, db=db())
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
        save_user(user, db=db())

        # Update session
        session['uid'] = uid
        url = url_for('select')

        app.logger.info("google_auth_verify url: {}".format(url))
        return redirect(url)
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)})


#
# Misc
#

def get_session_user():
    """Enforce authenticated user"""
    uid = session.get('uid')
    user = get_user(uid, db=db())
    if not user:
        try:
            session.pop('uid')
        except KeyError: pass
        return None
    return user


def check_test_user():
    if settings.TEST_MODE:
        if not get_user('test', db=db()):
            create_user('test', 'Test User', db=db())
        session['uid'] = 'test'

def require_user(f):
    """
    Decorator to enforce authenticated user
    Adds user to request and kwargs
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_session_user()
        if user is None:
            return redirect(url_for('select'))
        request.user = user
        kwargs['user'] = user
        return f(*args, **kwargs)
    return decorated_function

def require_user_id(template=None):
    """
    Decorator to enfore storymap access for authenticated user
    Adds user to request and kwargs, adds id to kwargs
    """
    # TODO: `id` here refers to the storymap ID and should be named accordingly
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_session_user()
            id = _request_get_required('id')
            if id not in user['storymaps']:
                error = 'You do not have permission to access to this StoryMap'
                if template:
                    message = f"""<p><i class="icon-warning-sign icon-large" style="color: red;"></i>
                    There is no StoryMap with the ID <code>{id}</code> associated with your account.</p>
                    <p>Please <a id="entry_logout" href="{ url_for('logout')}">logout</a> and sign back in
                    with the correct account, or select one of your existing StoryMaps below.</p>"""
                    return render_template('select.html', user=user, error=error, selector_message=message)
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
        'scheme': r.scheme or 'https', # embeds go on S3, which should always be https
        'netloc': r.netloc,
        'path': r.path
    }

def _fix_url_for_opengraph(url):
    parts = _parse_url(url)
    parts['path'] = quote(parts['path'])
    return '%(scheme)s://%(netloc)s%(path)s' % parts


def _write_embed(embed_key_name, json_key_name, meta):
    """Write embed page"""
    image_url = meta.get('image_url', settings.STATIC_URL+'img/logos/logo_storymap.png')

    # NOTE: facebook needs the protocol on embed_url and image_url for og tag
    json_url=settings.AWS_STORAGE_BUCKET_URL+json_key_name
    content = render_template('_embed.html',
        embed_url=_fix_url_for_opengraph(settings.AWS_STORAGE_BUCKET_URL+embed_key_name),
        json_url=json_url,
        title=meta.get('title', ''),
        description=meta.get('description', ''),
        image_url=_fix_url_for_opengraph(image_url),
        storymap_js_file=settings.STORYMAP_JS_FILE
    )
    storage.save_from_data(embed_key_name, 'text/html', content)


def _write_embed_draft(key_prefix, meta):
    """Write embed page for draft storymap """
    _write_embed(key_prefix+'draft.html', key_prefix+'draft.json', meta)


def _write_embed_published(key_prefix, meta):
    """Write embed for published storymap"""
    _write_embed(key_prefix+'index.html', key_prefix+'published.json', meta)


def _import_metadata(user, data):
    """Add a StoryMap to a user based on imported metadata"""
    id = _make_storymap_id(user, data['title'])
    data['id'] = id
    user['storymaps'][id] = data
    save_user(user, db=db())
    return id

#
# API views
# (called from the select page)
#

@app.route('/storymap/update/meta/', methods=['GET', 'POST'])
@require_user
@require_user_id()
def storymap_update_meta(user, id):
    """Update storymap meta value"""
    try:
        key, value = _request_get_required('key', 'value')

        user['storymaps'][id][key] = value
        save_user(user, db=db())

        key_prefix = storage.key_prefix(user['uid'], id)

        if key in ['title', 'description', 'image_url']:
            _write_embed_draft(key_prefix, user['storymaps'][id])

            if user['storymaps'][id].get('published_on'):
                _write_embed_published(key_prefix, user['storymaps'][id])

        return jsonify(user['storymaps'][id])
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)})


@app.route('/storymap/export/')
@require_user_id()
def storymap_export(user, id):
    """
    Download a zip file of the StoryMap's data, for importing or self-hosting
    """
    key_prefix = storage.key_prefix(user['uid'], id)
    key_list, _ = storage.list_keys(key_prefix, 999, '')
    temp_file, temp_path = tempfile.mkstemp()

    @after_this_request
    def cleanup_temp_file(response):
        os.close(temp_file)
        os.remove(temp_path)
        return response

    with ZipFile(temp_path, mode='a') as zip_file:
        zip_file.writestr('metadata.json', json.dumps(user['storymaps'][id]))
        for key in key_list:
            file_name = key.split(key_prefix)[-1]
            zip_file.writestr(file_name, storage.get_contents(key))
    return send_file(temp_path, mimetype="application/zip", as_attachment=True, attachment_filename=('storymap-%s.zip' % id))


def fix_image_urls(jsonstring, key_prefix, image_files):
    data = json.loads(jsonstring)
    slides = []
    for slide in data["storymap"]["slides"]:
        _slide = copy.copy(slide)

        def fixed_path(path):
            _path = path.split("/")[-2:]
            if len(_path) == 2 and _path[0] == "_images" and _path[1] in image_files:
                path = "/".join(_path)
                path = f"{settings.AWS_STORAGE_BUCKET_URL}{key_prefix}{path}"
            return path

        url = slide["media"].get("url")
        if url:
            _slide["media"]["url"] = fixed_path(url)
        icon = slide["location"].get("icon")
        if icon:
            _slide["location"]["icon"] = fixed_path(icon)
        slides.append(_slide)
    data["storymap"]["slides"] = slides
    return json.dumps(data)


@app.route('/storymap/import/', methods=['POST'])
@require_user
def storymap_import(user):
    try:
        if 'archive' in request.files:
            temp_file, temp_path = tempfile.mkstemp()
            request.files['archive'].save(temp_path)

            @after_this_request
            def cleanup_temp_file(response):
                os.close(temp_file)
                os.remove(temp_path)
                return response

            with ZipFile(temp_path, mode='r') as zip_file:
                files = zip_file.namelist()
                if ('metadata.json' not in files) or ('draft.json' not in files) or ('draft.html' not in files):
                    return jsonify({'error': 'This doesn\'t look like a StoryMap exported package.'})
                id = _import_metadata(user, json.loads(zip_file.read('metadata.json')))
                key_prefix = storage.key_prefix(user['uid'], id)
                image_files = []
                for file_name in files:
                    if file_name.startswith("_images/"):
                        image_files.append(file_name.split("/")[-1])
                for file_name in files:
                    if file_name != 'metadata.json' and not file_name.endswith("/"):
                        key_name = "%s%s" % (key_prefix, file_name)
                        f = zip_file.read(file_name)
                        if file_name in ["draft.json", "published.json"]:
                            f = fix_image_urls(f, key_prefix, image_files)
                        storage.save_from_data(key_name, mimetypes.guess_type(file_name)[0], f)
                return jsonify({'id': id})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)})


@app.route('/storymap/copy/', methods=['GET', 'POST'])
@require_user
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
            key_path = src_key.split('/')
            if key_path[-2] == '_images':
                file_name = '_images/%s' % key_path[-1]
            else:
                file_name = key_path[-1]
            src_key_name = '%s%s' % (src_key_prefix, file_name)
            dst_key_name = "%s%s" % (dst_key_prefix, file_name)
            if file_name.endswith('.json'):
                json_string = storage.get_contents_as_string(src_key)
                storage.save_json(dst_key_name,
                    src_re.sub(dst_key_prefix, json_string))
            else:
                storage.copy_key(src_key_name, dst_key_name)
        # Update meta
        user['storymaps'][dst_id] = {
            'id': dst_id,
            'title': title,
            'draft_on': user['storymaps'][id]['draft_on'],
            'published_on': user['storymaps'][id]['published_on']
        }
        save_user(user, db=db())
        # Write new embed pages
        _write_embed_draft(dst_key_prefix, user['storymaps'][dst_id])
        if user['storymaps'][dst_id].get('published_on'):
            _write_embed_published(dst_key_prefix, user['storymaps'][dst_id])
        return jsonify(user['storymaps'][dst_id])
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)})


@app.route('/storymap/delete/')
@require_user
@require_user_id()
def storymap_delete(user, id):
    """Delete storymap"""
    storymap_id = id
    try:
        storymap_cleanup(user["uid"], storymap_id)
        del user['storymaps'][storymap_id]
        save_user(user, db=db())
        return jsonify({})
    except Exception as e:
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
        save_user(user, db=db())
        _write_embed_draft(key_prefix, user['storymaps'][id])
        return jsonify({'id': id})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)})


@app.route('/storymap/migrate/done/', methods=['GET'])
@require_user
def storymap_migrate_done(user):
    """Flag user as migrated"""
    try:
        user['migrated'] = 1
        save_user(user, db=db())
        return jsonify({})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

@app.route('/storymap/migrate/list/', methods=['GET', 'POST'])
@require_user
def storymap_migrate_list(user):
    """Get list of storymaps that still need to be migrated"""
    try:
        if not 'google' in user:
            return jsonify({'migrate_list': []})
        credentials = googleauth.get_credentials(user['google']['credentials'])
        drive_service = googleauth.get_drive_service(credentials)

        existing = [d['title'] for (k, d) in user['storymaps'].items()]

        temp_list = googleauth.drive_get_migrate_list(drive_service)
        migrate_list = [r for r in temp_list if r['title'] not in existing]

        return jsonify({'migrate_list': migrate_list})
    except Exception as e:
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
        save_user(user, db=db())
        _write_embed_draft(dst_key_prefix, user['storymaps'][dst_id])
        if published_on:
            _write_embed_published(dst_key_prefix, user['storymaps'][dst_id])

        return jsonify(user['storymaps'][dst_id])
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

#
# API views
# (called from the edit page)
#

@app.route('/storymap/')
@require_user
@require_user_id()
def storymap_get(user, id):
    """Get storymap"""
    try:
        key_name = storage.key_name(user['uid'], id, 'draft.json')
        data = storage.load_json(key_name)
        return jsonify({'meta': user['storymaps'][id], 'data': data})
    except storage.StorageException as e:
        traceback.print_exc()
        app.logger.error(f"StorageException uid:{user['uid']} id:{id}")
        app.logger.error(e.detail)
        return jsonify({'error': str(e), 'error_detail': e.detail})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

@app.route('/storymap/save/', methods=['POST'])
@require_user
@require_user_id()
def storymap_save(user, id):
    """Save draft storymap"""
    try:
        data = _request_get_required('d')

        key_name = storage.key_name(user['uid'], id, 'draft.json')
        content = json.loads(data)
        storage.save_json(key_name, content)

        user['storymaps'][id]['draft_on'] = _utc_now()
        save_user(user, db=db())
        return jsonify({'meta': user['storymaps'][id]})
    except storage.StorageException as e:
        traceback.print_exc()
        app.logger.error(f"StorageException uid:{user['uid']} id:{id}")
        app.logger.error(e.detail)
        return jsonify({'error': str(e), 'error_detail': e.detail})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

@app.route('/storymap/publish/', methods=['POST'])
@require_user
@require_user_id()
def storymap_publish(user, id):
    """Save published storymap"""
    try:
        data = _request_get_required('d')

        key_prefix = storage.key_prefix(user['uid'], id)
        content = json.loads(data)
        storage.save_json(key_prefix+'published.json', content)

        user['storymaps'][id]['published_on'] = _utc_now()
        save_user(user, db=db())
        _write_embed_published(key_prefix, user['storymaps'][id])

        return jsonify({'meta': user['storymaps'][id]})
    except storage.StorageException as e:
        traceback.print_exc()
        app.logger.error(f"StorageException uid:{user['uid']} id:{id}")
        app.logger.error(e.detail)
        return jsonify({'error': str(e), 'error_detail': e.detail})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

@app.route('/storymap/image/list/', methods=['GET', 'POST'])
@require_user
@require_user_id()
def storymap_image_list(user, id):
    """List storymap images """
    try:
        key_prefix = storage.key_prefix(user['uid'], id, '_images')
        key_list, more = storage.list_key_names(key_prefix, 999, '')

        image_list = [n.split('/')[-1] for n in key_list]
        return jsonify({'image_list': image_list})
    except storage.StorageException as e:
        traceback.print_exc()
        app.logger.error(f"StorageException uid:{user['uid']} id:{id}")
        app.logger.error(e.detail)
        return jsonify({'error': str(e), 'error_detail': e.detail})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

@app.route('/storymap/image/save/', methods=['POST'])
@require_user
@require_user_id()
def storymap_image_save(user, id):
    """
    Save storymap image
    @id = storymap id
    @name = file name
    @content = data:URL representing the file's data as base64 encoded string
    """
    import base64
    import codecs
    from io import BytesIO
    import binascii
    try:
        name, content = _request_get_required('name', 'content')
        print(content[:30])

        m = re.match('data:(.+);base64,(.+)', content)
        if m:
            content_type = m.group(1)
            content = m.group(2)
            content = base64.b64decode(m.group(2))
        else:
            raise Exception('Expected content as data-url')

        key_name = storage.key_name(user['uid'], id, '_images', name)
        storage.save_bytes_from_data(key_name, content_type, content)

        return jsonify({'url': settings.AWS_STORAGE_BUCKET_URL+key_name})
    except storage.StorageException as e:
        traceback.print_exc()
        app.logger.error(f"StorageException uid:{user['uid']} id:{id}")
        app.logger.error(e.detail)
        return jsonify({'error': str(e), 'error_detail': e.detail})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)})


#
# Views
#

@app.route("/")
def index():
    if 'storymap.knightlab.com' in domains:
        production = True
    else:
        production = False
    return render_template('index.html', production=production)

@app.route("/gigapixel/")
def gigapixel():
    return render_template('gigapixel.html')

@app.route("/basemaps/")
def basemaps():
    return render_template('basemaps.html')

@app.route("/advanced/")
def advanced():
    return render_template('advanced.html')

@app.route("/examples/<name>/")
def examples(name):
    return render_template('examples/%s.html' % name)

@app.route("/logout/")
def logout():
    _session_pop('uid')
    return redirect('https://www.google.com/accounts/Logout')

@app.route("/userinfo/")
def userinfo():
    import pprint

    uid = session.get('uid')
    user = None
    migrate_data = None

    if uid:
        user = get_user(uid, db=db())
        if user:
            if not user['migrated']:
                migrate_data = googleauth.drive_get_migration_diagnostics(user)

            if '_id' in user: # mongo only
                del user['_id']
            try:
                del user['google']['credentials']
            except KeyError: pass
            user = pprint.pformat(user, indent=4)
            migrate_data = pprint.pformat(migrate_data, indent=4)


    return render_template('userinfo.html',
        uid=uid, user=user, migrate_data=migrate_data)

@app.route("/select.html/", methods=['GET', 'POST'])
@app.route("/edit.html/", methods=['GET', 'POST'])
def legacy_redirect():
    """Legacy redirect"""
    return redirect(url_for('select')+'?'+request.query_string)


@app.route("/select/", methods=['GET', 'POST'])
def select():
    check_test_user()
    try:
        uid = session.get('uid')
        if not uid:
            return render_template('select.html')
        user = get_user(uid, db=db())
        if not user:
            _session_pop('uid')
            return render_template('select.html')
        if '_id' in user: # mongo only
            del user['_id']
        return render_template('select.html', user=user)
    except Exception as e:
        traceback.print_exc()
        return render_template('select.html', error=str(e))


@app.route("/edit/", methods=['GET', 'POST'])
@require_user
@require_user_id('edit.html')
def edit(user, id):
    try:
        if '_id' in user: # mongo only
            del user['_id'] # for serialization
        # Default Mapbox key is the production key, which is restricted to
        # only work from our domains local developers need to configure an
        # unrestricted MAPBOX_API_KEY in their environment.
        mapbox_api_key = os.environ.get('MAPBOX_API_KEY', 
            'pk.eyJ1IjoibnVrbmlnaHRsYWIiLCJhIjoiY2pzZGxiaTRpMHd0eTQ0cGVscWliaXA2YyJ9.YTxvt_ZegqDqNxtl_gdDYA')
        return render_template('edit.html',
            user=user, meta=user['storymaps'][id],
            mapbox_api_key=mapbox_api_key)
    except Exception as e:
        traceback.print_exc()
        return render_template('edit.html', error=str(e))


@app.route('/admin/')
@require_user
def admin(user):
    if not user['uid'] in settings.ADMINS:
        abort(401)
    return render_template('/admin/index.html')


@app.route('/admin/users/')
@require_user
def admin_users(user):
    if not user['uid'] in settings.ADMINS:
        abort(401)
    args = request.args.copy()
    page = int(args.pop('page', 1))
    rpp = int(request.args.get('rpp', 100))
    skip = (page - 1) * rpp
    files = defaultdict(list)
    users = []
    query = {}
    if args.get('uname'):
        if args.get('unamesearch') == 'is':
            query.update({ 'uname': args['uname'] })
        else:
            query.update({ 'uname__like': args['uname'] })
    if args.get('uid'):
        query.update({ 'uid': args['uid'] })
    migrated = args.get('migrated')
    if migrated == 'migrated':
        query.update({ 'migrated': 1 })
    elif migrated == 'unmigrated':
        query.update({ 'migrated': 0 })
    for k in storage.all_keys():
        uid = k.split('/')[1]
        files[uid].append(k)
    pages = 0
    if query:
        query.update({ 'limit': rpp, 'offset': page-1 })
        users, pages = find_users(db=db(), **query)
    return render_template('admin/users.html', **{
        'users': users,
        'page': page,
        'pages': pages,
        'args': args,
        'querystring': urlencode(list(args.items())),
        'storage_root': settings.AWS_STORAGE_BUCKET_URL
    })


@app.route("/qunit/", methods=['GET'])
def qunit():
    return render_template('qunit.html')


#
# FOR DEVELOPMENT
# SERVE URLS FROM DIRECTORIES
#

from flask import send_file, send_from_directory

build_dir = os.path.join(settings.PROJECT_ROOT, 'build')
compiled_dir = os.path.join(settings.PROJECT_ROOT, 'dist')
templates_dir = os.path.join(settings.PROJECT_ROOT, 'compiled/templates')
domains = os.environ.get('APPLICATION_DOMAINS')
admins = os.environ.get('ADMINS', '').split(' ')

@app.route('/robots.txt')
def robots_txt():
    if 'storymap.knilab.com' in domains:
        return send_file('templates/robots.txt')

@app.route('/build/embed/')
def catch_build_embed():
    return send_from_directory(build_dir, 'embed/index.html')

@app.route('/build/<path:path>')
def catch_build(path):
    return send_from_directory(build_dir, path)

@app.route('/compiled/<path:path>')
@cross_origin()
def catch_compiled(path):
    print(path)
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


IMAGE_PROPS_REGEX = re.compile("IMAGE_PROPERTIES WIDTH='(\d+)' HEIGHT='(\d+)'")

@require_user
@app.route('/zoomify-image-props', methods=['GET'])
def zoomify_image_props():
    url = request.args['url'].strip('/') + '/ImageProperties.xml'
    xml = requests.get(url).text
    m = IMAGE_PROPS_REGEX.search(xml)
    return jsonify({
        'width': m.group(1),
        'height': m.group(2)
    })


if __name__ == '__main__':
    site_dir = os.path.dirname(os.path.abspath(__file__))
    if site_dir not in sys.path:
        sys.path.append(site_dir)
    ssl_context = None
    port = 5000
    app.run(host='0.0.0.0', port=port, debug=True)
    # Experimenting with using Flask's scarcely documented 'adhoc' ssl context
    #app.run(host='0.0.0.0', port=port, debug=True, ssl_context='adhoc')
