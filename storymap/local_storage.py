import os
import sys
import time
import traceback
import json
from shutil import copyfile
from functools import wraps
import boto
from moto import mock_s3
from boto.exception import S3ResponseError
from flask import send_from_directory, flash
from werkzeug.utils import secure_filename
from boto.s3.connection import OrdinaryCallingFormat
import requests

settings_module = os.environ.get('FLASK_SETTINGS_MODULE')
settings = sys.modules[settings_module]

_mock = mock_s3()
_mock.start()
_conn = boto.connect_s3()
_bucket = _conn.create_bucket(settings.AWS_STORAGE_BUCKET_NAME)
_mock.stop()

STORYMAPJS_DIRECTORY = os.environ['STORYMAPJS_DIRECTORY']
LOCAL_PATH = 'static/local/'
LOCAL_DIRECTORY = os.path.join(STORYMAPJS_DIRECTORY, LOCAL_PATH)

class key():
    def __init__(self, name, path):
        self.name = name
        self.path = path


class StorageException(Exception):
    """
    Adds 'detail' attribute to contain response body
    """

    def __init__(self, message, detail):
        super(Exception, self).__init__(message)
        self.detail = detail


def _mock_in_test_mode(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if hasattr(settings, 'TEST_MODE') and settings.TEST_MODE:
            _mock.start(reset=False)
            result = f(*args, **kwargs)
            _mock.stop()
            return result
        else:
            return f(*args, **kwargs)
    return decorated_function


def _reraise_s3response(f):
    """Decorator trap and re-raise S3ResponseError as StorageException"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except S3ResponseError, e:
            print traceback.format_exc()
            raise StorageException(e.message, e.body)
    return decorated_function


def key_id():
    """
    Get id for key
    """
    return repr(time.time())


def key_prefix(*args):
    return '%s/%s/' % (LOCAL_PATH, '/'.join(args))


def key_name(*args):
    return os.path.join(LOCAL_PATH, '/'.join(args))

@_reraise_s3response
@_mock_in_test_mode
def list_keys(key_prefix, n, marker=''):
    """
    List keys that start with key_prefix (<> key_prefix itself)
    @n = number of items to return
    @marker = name of last item
    """
    key_list = []
    i = 0

    for file in os.listdir(key_prefix):
        key_list.append(os.path.join(key_prefix, file))
    return key_list, (i == n)

@_mock_in_test_mode
def get_contents_as_string(src_key):
    key = os.path.join(STORYMAPJS_DIRECTORY, src_key)
    contents = open(key, "r")
    return contents.read()


@_mock_in_test_mode
def all_keys():
    keys = set() 
    for (dirpath, dirnames, filenames) in os.walk(LOCAL_DIRECTORY):
        for file in filenames:
            keys.add(os.path.join(dirpath, file))
    return keys 


@_reraise_s3response
@_mock_in_test_mode
def list_key_names(key_prefix, n, marker=''):
    """
    List key names that start with key_prefix (<> key_prefix itself)
    @n = number of items to return
    @marker = name of last item
    """
    name_list = []
    i = 0

    for file in os.listdir(LOCAL_DIRECTORY):
        if file == key_prefix:
            continue
        name_list.append(file)
    return name_list, (i == n)


@_reraise_s3response
@_mock_in_test_mode
def copy_key(src_key_name, dst_key_name):
    """
    Copy from src_key_name to dst_key_name
    """
    copyfile(os.path.join(STORYMAPJS_DIRECTORY, src_key_name),
             os.path.join(STORYMAPJS_DIRECTORY, dst_key_name))

@_reraise_s3response
@_mock_in_test_mode
def save_from_data(key_name, content_type, content):
    """
    Save content with content-type to key_name
    """
    key = os.path.join(STORYMAPJS_DIRECTORY, key_name)
    files = all_keys()
    if key not in files:
        if not os.path.exists(os.path.dirname(key)):
            try:
                os.makedirs(os.path.dirname(key))
            except OSError as exc:  # Guard against race condition
                if exc.errno != errno.EEXIST:
                    raise
        f = open(key, 'w+')
    save = open(key, 'w')
    save.write(content)

@_reraise_s3response
@_mock_in_test_mode
def save_from_url(key_name, url):
    """
    Save file at url to key_name
    """
    key = os.path.join(STORYMAPJS_DIRECTORY, key_name)
    r = requests.get(url)
    save_from_data(key_name, r.headers['content-type'], r.content)


@_reraise_s3response
@_mock_in_test_mode
def load_json(key_name):
    """
    Get contents of key as json
    """
    key = os.path.join(STORYMAPJS_DIRECTORY, key_name)
    contents = open(key, "r")
    return json.loads(contents.read())


@_reraise_s3response
@_mock_in_test_mode
def save_json(key_name, data):
    """
    Save data to key_name as json
    """
    key = os.path.join(STORYMAPJS_DIRECTORY, key_name)
    if type(data) in [type(''), type(u'')]:
        content = data
    else:
        content = json.dumps(data)
    save_from_data(key_name, 'application/json', content)


@_reraise_s3response
@_mock_in_test_mode
def delete(key_name):
    """
    Delete key
    """
    os.remove(os.path.join(STORYMAPJS_DIRECTORY, key_name))
