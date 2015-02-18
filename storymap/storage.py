"""
S3-based storage backend

Object Keys
http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html
"""
import os
import sys
import time
import json
from boto.s3.connection import S3Connection
from boto.s3.key import Key
from boto.exception import S3ResponseError
import requests

# Get settings module
settings = sys.modules[os.environ['FLASK_SETTINGS_MODULE']]

_conn = S3Connection(settings.AWS_ACCESS_KEY_ID, settings.AWS_SECRET_ACCESS_KEY)    
_bucket = _conn.get_bucket(settings.AWS_STORAGE_BUCKET_NAME)

def key_id():
    """
    Get id for key
    """
    return repr(time.time())
    
#def image_key_name(uid, ext):
#    """
#    Return new image key name
#    @uid = user id
#    @ext = file extension (e.g. 'jpg')
#    """
#    return 'pitcha/%s/_images/%s.%s' % (uid, key_id(), ext)     

#def pitcha_key_prefix(uid, id):
#    """
#    Return pitcha key prefix
#    @uid = user id
#    #id = pitcha id
#    """
#    return 'pitcha/%s/_pitchas/%s' % (uid, id)

#def pitcha_key_name(uid, id=''):
#    """
#    Return pitcha key name
#    @uid = user id
#    @id = existing pitcha id, or empty to create a new one
#    """
#    id = id or key_id()
#    return 'pitcha/%s/_pitchas/%s.json' % (uid, id)
         
def list_keys(key_prefix, n, marker=''):
    """
    List keys that start with key_prefix (<> key_prefix itself)
    @n = number of items to return
    @marker = name of last item 
    """
    key_list = []
    i = 0
    
    for i, item in enumerate(_bucket.list(prefix=key_prefix, marker=marker)):
        if i == n:
            break
        if item.name == key_prefix:           
            continue
        key_list.append(item)
    return key_list, (i == n)

def list_key_names(key_prefix, n, marker=''):
    """
    List key names that start with key_prefix (<> key_prefix itself)
    @n = number of items to return
    @marker = name of last item 
    """
    name_list = []
    i = 0
    
    for i, item in enumerate(_bucket.list(prefix=key_prefix, marker=marker)):
        if i == n:
            break
        if item.name == key_prefix:           
            continue
        name_list.append(item.name)
    return name_list, (i == n)

def save_from_data(key_name, content_type, content):
    """
    Save content with content-type to key_name
    """
    key = _bucket.get_key(key_name)
    if not key:
        key = _bucket.new_key(key_name)
        key.content_type = content_type
    key.set_contents_from_string(content, policy='public-read')
        
def save_from_url(key_name, url):
    """
    Save file at url to key_name
    """
    r = requests.get(url)
    save_from_data(key_name, r.headers['content-type'], r.content) 

def load_json(key_name):
    """
    Get contents of key as json
    """
    key = Key(_bucket, key_name)
    contents = key.get_contents_as_string()
    return json.loads(contents)

def save_json(key_name, data):
    """
    Save data to key_name as json
    """
    if type(data) == type(''):
        content = data
    else:
        content = json.dumps(data)
    save_from_data(key_name, 'application/json', content)
        
def delete(key_name):
    """
    Delete key
    """
    _bucket.delete_key(key_name)
     

    