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
import logging
import boto3
import requests
from functools import wraps

# Enable boto3 debug logging for retry attempts (optional, can be disabled in production)
# Set to INFO to see retry attempts, DEBUG for full details
# For RequestHeaderSectionTooLarge debugging, enable urllib3 debug to see actual HTTP headers:
# import http.client as http_client
# http_client.HTTPConnection.debuglevel = 1
# boto3.set_stream_logger('boto3.resources', logging.DEBUG)
# boto3.set_stream_logger('botocore', logging.DEBUG)
from botocore.exceptions import (
    BotoCoreError,
    ClientError,
    EndpointConnectionError,
    ConnectionClosedError,
    ReadTimeoutError,
    ConnectTimeoutError
)
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

# Setup logger for storage module
logger = logging.getLogger(__name__)


def truthy(s):
   return str(s).lower()[0] in ['t', '1']


# TODO: do we still need OrdinaryCallingFormat for dots in the bucket name?
#_conn = boto.connect_s3(
#        settings.AWS_ACCESS_KEY_ID,
#        settings.AWS_SECRET_ACCESS_KEY, calling_format=OrdinaryCallingFormat())
endpoint = os.environ.get('AWS_ENDPOINT_URL')
logger.warning(f'[STORAGE] AWS endpoint: {endpoint}')
ssl_verify = truthy(os.environ.get('AWS_SSL_VERIFY', 't'))

# Configure retries for transient errors (connection resets, timeouts, etc.)
# Standard retry mode retries on connection errors, throttling, and server errors
# Max attempts = 1 initial + 4 retries = 5 total attempts
retry_config = boto3.session.Config(
    signature_version='s3v4',
    retries={
        'mode': 'standard',  # Uses exponential backoff with jitter
        'max_attempts': 5    # Total of 5 attempts (1 initial + 4 retries)
    },
    connect_timeout=10,      # Connection timeout in seconds
    read_timeout=60          # Read timeout in seconds
)

_conn = boto3.client('s3',
        verify=ssl_verify,
        endpoint_url=endpoint,
        config=retry_config,
        aws_session_token=None,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
session = boto3.session.Session(
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
s3 = session.resource('s3', verify=ssl_verify, endpoint_url=endpoint,
    aws_session_token=None, config=retry_config)
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
                logger.warning(f"[ERROR INJECTION] Forcing {op_desc} error '{error_type}' on {function_name}()")

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
        except ClientError as e:
            # Log ALL ClientErrors with full context for debugging intermittent issues
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            logger.error(f"[STORAGE_ERROR] ClientError: {error_code} in {f.__name__}()")
            logger.error(f"[STORAGE_ERROR] Key: {args[0][:200] if args and isinstance(args[0], str) else 'N/A'}... (len={len(args[0]) if args and isinstance(args[0], str) else 'N/A'})")
            if len(args) > 1:
                content_size = len(args[1]) if isinstance(args[1], (str, bytes)) else 'N/A'
                logger.error(f"[STORAGE_ERROR] Content size: {content_size}")
            logger.error(f"[STORAGE_ERROR] Error response: {e.response}")
            logger.error(traceback.format_exc())

            # Special handling for key-related size errors
            if error_code == 'KeyTooLongError':
                # Log diagnostic information
                logger.error(f"[STORAGE] KeyTooLongError - Function: {f.__name__}")
                logger.error(f"[STORAGE] KeyTooLongError - Args count: {len(args)}, Kwargs: {list(kwargs.keys())}")
                if args and isinstance(args[0], str):
                    key = args[0]
                    logger.error(f"[STORAGE] KeyTooLongError - Key length: {len(str(key))} bytes (max 1024)")
                    logger.error(f"[STORAGE] KeyTooLongError - Key: {str(key)[:200]}...")
                raise StorageException(
                    "The StoryMap identifier is too long for storage.|This is usually caused by corrupted data. Please contact KnightLab support with the StoryMap ID.",
                    f"KeyTooLongError in {f.__name__}(): Key length {len(str(args[0])) if args else 'unknown'} bytes. {str(e)}"
                )

            if error_code == 'RequestHeaderSectionTooLarge':
                # Log comprehensive diagnostic information to debug intermittent errors
                logger.error(f"[STORAGE] ===== RequestHeaderSectionTooLarge DEBUG =====")
                logger.error(f"[STORAGE] Function: {f.__name__}")
                logger.error(f"[STORAGE] Args count: {len(args)}, Kwargs keys: {list(kwargs.keys())}")

                # Log key information
                if args and isinstance(args[0], str):
                    key = args[0]
                    key_bytes = len(str(key).encode('utf-8'))
                    logger.error(f"[STORAGE] Key length: {key_bytes} bytes (UTF-8)")
                    logger.error(f"[STORAGE] Key (first 300 chars): {str(key)[:300]}")
                    # Parse key to show components
                    key_parts = str(key).split('/')
                    logger.error(f"[STORAGE] Key components: {len(key_parts)} parts")
                    for i, part in enumerate(key_parts):
                        logger.error(f"[STORAGE]   Part {i}: '{part}' ({len(part)} chars)")

                # Log content size if available
                if len(args) > 1:
                    content = args[1] if f.__name__ == 'save_bytes_from_data' else kwargs.get('data', args[1] if len(args) > 1 else None)
                    if content:
                        content_size = len(content) if isinstance(content, (str, bytes)) else 'unknown'
                        logger.error(f"[STORAGE] Content size: {content_size} bytes")

                # Log boto3 client configuration
                logger.error(f"[STORAGE] Boto3 endpoint: {endpoint}")
                logger.error(f"[STORAGE] Signature version: s3v4")
                logger.error(f"[STORAGE] ===== END DEBUG =====")

                raise StorageException(
                    "The StoryMap data exceeds size limits for storage.|Please try reducing the amount of content, especially in text fields. If the problem persists, please contact KnightLab support.",
                    f"RequestHeaderSectionTooLarge in {f.__name__}(): Key length {len(str(args[0]).encode('utf-8')) if args and isinstance(args[0], str) else 'unknown'} bytes. {str(e)}"
                )

            raise StorageException(
                "There was a problem connecting to the document storage service.|Please wait a few moments and try again. If the problem persists, please contact KnightLab support.",
                f"Connection error: {str(e)}"
            )
        except (ConnectionClosedError, ReadTimeoutError, ConnectTimeoutError) as e:
            # Connection/timeout errors - these are likely transient
            logger.error(traceback.format_exc())
            logger.error(f"[STORAGE] Connection/Timeout error in {f.__name__}(): {type(e).__name__}")
            raise StorageException(
                "The connection to the document storage service was interrupted.|Please wait a few moments and try again. If the problem persists, please contact KnightLab support.",
                f"Connection interrupted: {type(e).__name__}: {str(e)}"
            )
        except EndpointConnectionError as e:
            # Endpoint connection failures
            logger.error(traceback.format_exc())
            logger.error(f"[STORAGE] EndpointConnectionError in {f.__name__}()")
            raise StorageException(
                "There was a problem connecting to the document storage service.|Please wait a few moments and try again. If the problem persists, please contact KnightLab support.",
                f"Connection error: {str(e)}"
            )
        except BotoCoreError as e:
            # Other botocore errors
            logger.error(traceback.format_exc())
            logger.error(f"[STORAGE] BotoCoreError in {f.__name__}(): {type(e).__name__}")
            raise StorageException(
                "An error occurred while accessing the document storage service.|Please wait a few moments and try again. If the problem persists, please contact KnightLab support.",
                f"Storage error: {type(e).__name__}: {str(e)}"
            )
        except Exception as e:
            logger.error(traceback.format_exc())
            logger.error(f"[STORAGE] Unexpected exception in {f.__name__}(): {type(e).__name__}")
            # Check if it's an exception with message and body attributes
            if hasattr(e, 'message') and hasattr(e, 'body'):
                raise StorageException(
                    "An error occurred while accessing the document storage service.|Please wait a few moments and try again. If the problem persists, please contact KnightLab support.",
                    f"Error: {e.message}\nBody: {e.body}"
                )
            else:
                raise StorageException(
                    "An unexpected error occurred while accessing the document storage service.|Please wait a few moments and try again. If the problem persists, please contact KnightLab support.",
                    f"Unexpected error: {type(e).__name__}: {str(e)}"
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
    # Log all save attempts to correlate failures/successes
    content_size = len(content) if isinstance(content, (str, bytes)) else 'unknown'
    logger.warning(f"[SAVE_ATTEMPT] save_bytes_from_data: key={key_name[:100]}... key_len={len(key_name)} content_size={content_size} type={content_type}")

    _conn.put_object(
        ACL='public-read',
        Body=content,
        Bucket=_bucket.name,
        CacheControl=f'max-age={CACHE_CONTROL_MAX_AGE}',
        ContentType=content_type,
        Key=key_name
    )
    logger.warning(f"[SAVE_SUCCESS] save_bytes_from_data: key={key_name[:100]}...")


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
    # Log all save attempts to correlate failures/successes
    logger.warning(f"[SAVE_ATTEMPT] save_json: key={key_name[:100]}... key_len={len(key_name)}")

    if type(data) in [type(''), type(u'')]:
        content = data
    else:
        content = json.dumps(data)

    content_size = len(content.encode('utf-8'))
    logger.warning(f"[SAVE_ATTEMPT] save_json: content_size={content_size} bytes")

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
    logger.warning(f"[SAVE_SUCCESS] save_json: key={key_name[:100]}...")


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
