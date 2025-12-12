"""
S3-based storage backend

Object Keys
http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html
"""
import mimetypes
import os
import sys
import time
import traceback
import json
import boto3
import requests
from functools import wraps
from botocore.exceptions import ClientError, EndpointConnectionError
#from boto3.exception import S3ResponseError
#from boto3.s3.connection import OrdinaryCallingFormat


S3_LIST_OBJECTS_MAX = 1000 # https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html#S3.Client.list_objects
S3_DELETE_OBJECTS_MAX = 1000 # https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html#S3.Bucket.delete_objects
CACHE_CONTROL_MAX_AGE = 60 * 5


# Get settings module
#settings = sys.modules[os.environ['FLASK_SETTINGS_MODULE']]
import importlib
settings_module = os.environ.get('FLASK_SETTINGS_MODULE')
try:
    importlib.import_module(settings_module)
except ImportError as e:
    raise ImportError("Could not import settings '%s' (Is it on sys.path?): %s" % (settings_module, e))
settings = sys.modules[settings_module]


def truthy(s):
   return str(s).lower()[0] in ['t', '1']


# TODO: do we still need OrdinaryCallingFormat for dots in the bucket name?
#_conn = boto.connect_s3(
#        settings.AWS_ACCESS_KEY_ID,
#        settings.AWS_SECRET_ACCESS_KEY, calling_format=OrdinaryCallingFormat())
endpoint = os.environ.get('AWS_ENDPOINT_URL')
print('AWS endpoint:', endpoint)
ssl_verify = truthy(os.environ.get('AWS_SSL_VERIFY', 't'))
_conn = boto3.client('s3',
        verify=ssl_verify,
        endpoint_url=endpoint,
        config=boto3.session.Config(signature_version='s3v4'),
        aws_session_token=None,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
session = boto3.session.Session(
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
s3 = session.resource('s3', verify=ssl_verify, endpoint_url=endpoint,
    aws_session_token=None, config=boto3.session.Config(signature_version='s3v4'))
_bucket = s3.Bucket(settings.AWS_STORAGE_BUCKET_NAME)


class StorageException(Exception):
    """
    Adds 'detail' attribute to contain response body
    """
    def __init__(self, message, detail):
        super(Exception, self).__init__(message)
        self.detail = detail


def _reraise_s3response(f):
    """Decorator trap and re-raise S3ResponseError as StorageException"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Error injection for testing - controlled by environment variable
        # Format: FORCE_STORAGE_ERROR=error_type[:operation]
        # error_type: 'connection', 'timeout', 'permission', 'notfound', 'corrupt' (required)
        # operation: 'read', 'write', or omit for all operations (optional)
        force_error = os.environ.get('FORCE_STORAGE_ERROR', '').lower()
        if force_error:
            # Parse error type and operation type
            if ':' in force_error:
                error_type, operation_type = force_error.split(':', 1)
            else:
                error_type = force_error
                operation_type = 'all'

            # Categorize functions as read or write operations
            read_operations = ['list_keys', 'list_key_names', 'get_contents',
                             'get_contents_as_string', 'load_json']
            write_operations = ['copy_key', 'save_bytes_from_data', 'save_from_data',
                              'save_from_url', 'save_json', 'delete_key', 'delete_keys']

            function_name = f.__name__
            is_read = function_name in read_operations
            is_write = function_name in write_operations

            # Determine if we should inject the error
            should_inject = False
            if operation_type == 'all':
                should_inject = True
            elif operation_type == 'read' and is_read:
                should_inject = True
            elif operation_type == 'write' and is_write:
                should_inject = True

            if should_inject:
                op_desc = 'read' if is_read else 'write' if is_write else 'unknown'
                print(f"[ERROR INJECTION] Forcing {op_desc} error '{error_type}' on {function_name}()")

                if error_type == 'connection':
                    raise StorageException(
                        "There was a problem connecting to the document storage service.|Please wait a few moments and try again. If the problem persists, please contact KnightLab support.",
                        f"FORCE_STORAGE_ERROR={force_error} - Simulated connection failure on {op_desc} operation"
                    )
                elif error_type == 'timeout':
                    raise StorageException(
                        "The request timed out while accessing the document storage service.|Please wait a few moments and try again. If the problem persists, please contact KnightLab support.",
                        f"FORCE_STORAGE_ERROR={force_error} - Simulated timeout on {op_desc} operation"
                    )
                elif error_type == 'permission':
                    raise StorageException(
                        "Permission denied while accessing the document storage service.|Please wait a few moments and try again. If the problem persists, please contact KnightLab support.",
                        f"FORCE_STORAGE_ERROR={force_error} - Simulated permission error on {op_desc} operation"
                    )
                elif error_type == 'notfound':
                    raise StorageException(
                        "The requested document was not found in storage.|Please wait a few moments and try again. If the problem persists, please contact KnightLab support.",
                        f"FORCE_STORAGE_ERROR={force_error} - Simulated not found error on {op_desc} operation"
                    )
                elif error_type == 'corrupt':
                    raise StorageException(
                        "The document data appears to be corrupted or invalid.|Please wait a few moments and try again. If the problem persists, please contact KnightLab support.",
                        f"FORCE_STORAGE_ERROR={force_error} - Simulated data corruption on {op_desc} operation"
                    )

        try:
            return f(*args, **kwargs)
        #except S3ResponseError as e:
        except (ClientError, EndpointConnectionError) as e:
            print(traceback.format_exc())
            raise StorageException(
                "There was a problem connecting to the document storage service.|Please wait a few moments and try again. If the problem persists, please contact KnightLab support.",
                f"Connection error: {str(e)}"
            )
        except Exception as e: # TODO !!!
            print(traceback.format_exc())
            # Check if it's an exception with message and body attributes
            if hasattr(e, 'message') and hasattr(e, 'body'):
                raise StorageException(
                    "An error occurred while accessing the document storage service.|Please wait a few moments and try again. If the problem persists, please contact KnightLab support.",
                    f"Error: {e.message}\nBody: {e.body}"
                )
            else:
                raise StorageException(
                    "An unexpected error occurred while accessing the document storage service.|Please wait a few moments and try again. If the problem persists, please contact KnightLab support.",
                    f"Error: {str(e)}"
                )
    return decorated_function


def key_id():
    """
    Get id for key
    """
    return repr(time.time())

def key_prefix(*args):
    return '%s/%s/' % (settings.AWS_STORAGE_BUCKET_KEY, '/'.join(args))

def key_name(*args):
    return '%s/%s' % (settings.AWS_STORAGE_BUCKET_KEY, '/'.join(args))


@_reraise_s3response
def list_keys(key_prefix, n, marker=''):
    """
    List keys that start with key_prefix (<> key_prefix itself)
    @n = number of items to return
    @marker = name of last item
    """
    assert n <= S3_LIST_OBJECTS_MAX, f"Cannot list more than {S3_LIST_OBJECTS_MAX} keys."
    key_list = []
    i = 0
    # localstack cannot handle an empty marker
    if marker:
        _contents = _conn.list_objects(Bucket=_bucket.name, Prefix=key_prefix, Marker=marker)
    else:
        _contents = _conn.list_objects(Bucket=_bucket.name, Prefix=key_prefix)
    _key_list = [ key['Key'] for key in _contents.get('Contents', []) ]
    for i, item in enumerate(_key_list):
        if i == n:
            break
        if item == key_prefix:
            continue
        key_list.append(item)
    return key_list, (i == n)

def get_contents(src_key):
    obj = s3.Object(_bucket.name, src_key)
    return obj.get()['Body'].read()

def get_contents_as_string(src_key):
    obj = s3.Object(_bucket.name, src_key)
    return obj.get()['Body'].read().decode('utf-8')

def all_keys():
    _contents = _conn.list_objects(Bucket=_bucket.name, Prefix=settings.AWS_STORAGE_BUCKET_KEY)
    _key_list = [ key['Key'] for key in _contents.get('Contents', []) ]
    for item in _key_list:
        if item == key_prefix:
            continue
        #yield item.key
        yield item


@_reraise_s3response
def list_key_names(key_prefix, n, marker=''):
    """
    List key names that start with key_prefix (<> key_prefix itself)
    @n = number of items to return
    @marker = name of last item
    """
    name_list = []
    i = 0
    # localstack cannot handle an empty marker
    if marker:
        _contents = _conn.list_objects(Bucket=_bucket.name, Prefix=key_prefix, Marker=marker)
    else:
        _contents = _conn.list_objects(Bucket=_bucket.name, Prefix=key_prefix)
    _key_list = [ key['Key'] for key in _contents.get('Contents', []) ]
    for i, item in enumerate(_key_list):
        if i == n:
            break
        if item == key_prefix:
            continue
        name_list.append(item)
    return name_list, (i == n)

@_reraise_s3response
def copy_key(src_key_name, dst_key_name):
    """
    Copy from src_key_name to dst_key_name
    """
    dst_key = _bucket.copy(
        { 'Bucket': _bucket.name, 'Key': src_key_name },
        dst_key_name,
        ExtraArgs={
            'ACL': 'public-read',
            'CacheControl': f'max-age={CACHE_CONTROL_MAX_AGE}'
        }
    )


@_reraise_s3response
def save_bytes_from_data(key_name, content_type, content):
    """
    Save content with content-type to key_name
    """
    _conn.put_object(
        ACL='public-read',
        Body=content,
        Bucket=_bucket.name,
        CacheControl=f'max-age={CACHE_CONTROL_MAX_AGE}',
        ContentType=content_type,
        Key=key_name
    )


@_reraise_s3response
def save_from_data(key_name, content_type, content):
    """
    Save content with content-type to key_name
    """
    if content_type is None:
        content_type, _ = mimetypes.guess_type(key_name)
    if content_type is None:
        content_type = 'application/octet-stream'

    _conn.put_object(
        ACL='public-read',
        Body=content,
        Bucket=_bucket.name,
        CacheControl=f'max-age={CACHE_CONTROL_MAX_AGE}',
        ContentType=content_type,
        Key=key_name
    )


@_reraise_s3response
def save_from_url(key_name, url):
    """
    Save file at url to key_name
    """
    r = requests.get(url)
    save_from_data(key_name, r.headers['content-type'], r.content)


@_reraise_s3response
def load_json(key_name):
    """
    Get contents of key as json
    """
    obj = s3.Object(_bucket.name, key_name)
    return json.loads(obj.get()['Body'].read().decode('utf-8'))


@_reraise_s3response
def save_json(key_name, data):
    """
    Save data to key_name as json
    """
    if type(data) in [type(''), type(u'')]:
        content = data
    else:
        content = json.dumps(data)
    try:
        _check = json.loads(content)
    except json.decoder.JSONDecodeError:
        import inspect
        curframe = inspect.currentframe()
        callframe = inspect.getouterframes(curframe, context=1)
        call_chain = [f.function for f in callframe]
        raise StorageException(
            f"Save failed. Please try again. If the problem persists, please contact "
            f"KnightLab support.",
            f"Call chain: {call_chain}\n\ndata:\n{str(data)}\n\ncontent:\n{str(content)}"
        )
    save_from_data(key_name, 'application/json', content)


@_reraise_s3response
def delete_key(key):
    """
    Delete a single key
    """
    _conn.delete_object(Bucket=_bucket.name, Key=key)


@_reraise_s3response
def delete_keys(keys):
    """
    Delete up to S3_DELETE_OBJECTS_MAX keys
    """
    assert len(keys) <= S3_DELETE_OBJECTS_MAX, f"Cannot delete more than {S3_DELETE_OBJECTS_MAX} keys."
    objects = [ { "Key": key } for key in keys ]
    _bucket.delete_objects(Delete={ "Objects": objects })
