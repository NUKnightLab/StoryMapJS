"""Integration testing requiring access to S3

These tests require the Docker Compose stack to be running with LocalStack.

Run: docker compose up

The tests connect to LocalStack at http://localhost:4566 (the exposed port from Docker).
"""
import importlib
import json
import os
import sys
import pytest
import botocore
import boto3

# Override AWS_ENDPOINT_URL for tests running on host machine
# (Docker uses localstack:4566, but from host we need localhost:4566)
if 'localstack:4566' in os.environ.get('AWS_ENDPOINT_URL', ''):
    os.environ['AWS_ENDPOINT_URL'] = 'http://localhost:4566'
elif not os.environ.get('AWS_ENDPOINT_URL'):
    os.environ['AWS_ENDPOINT_URL'] = 'http://localhost:4566'

# Set up settings module
if not os.environ.get('FLASK_SETTINGS_MODULE', ''):
    os.environ['FLASK_SETTINGS_MODULE'] = 'storymap.core.settings'

settings_module = os.environ.get('FLASK_SETTINGS_MODULE')
try:
    importlib.import_module(settings_module)
except ImportError as e:
    raise ImportError(f"Could not import settings '{settings_module}' (Is it on sys.path?): {e}")

settings = sys.modules[os.environ['FLASK_SETTINGS_MODULE']]
settings.TEST_MODE = False
# Use the actual bucket from settings (uploads.knilab.com) instead of a test bucket
# The bucket should be created by running scripts/makebuckets.sh
if not os.environ.get('AWS_TEST_BUCKET'):
    # Use the existing bucket from .env settings
    pass
else:
    settings.AWS_STORAGE_BUCKET_NAME = os.environ['AWS_TEST_BUCKET']

# Import storage module AFTER setting environment
from storymap.storage import all_keys, save_from_data


@pytest.mark.integration
def test_list_keys():
    """Test listing all S3 keys."""
    keys = all_keys()
    # TODO: this is not yet testing anything - add assertions
    assert keys is not None


@pytest.mark.integration
def test_save_from_data():
    """Test saving data to S3 and retrieving it."""
    file_name = 'test1.json'
    key_name = f'{settings.AWS_STORAGE_BUCKET_KEY}/{file_name}'
    content_type = 'application/json'
    content = json.dumps({'test_key': 'test_value'})

    # Save the data
    save_from_data(key_name, content_type, content)

    # Retrieve and verify
    # Use localhost instead of Docker hostname for tests running on host
    endpoint = settings.AWS_ENDPOINT_URL
    if endpoint and 'localstack:4566' in endpoint:
        endpoint = 'http://localhost:4566'

    if endpoint:
        s3 = boto3.resource('s3', endpoint_url=endpoint)
    else:
        s3 = boto3.resource('s3')

    obj = s3.Object(settings.AWS_STORAGE_BUCKET_NAME, key_name)

    try:
        retrieved_data = json.loads(obj.get()['Body'].read())
        assert retrieved_data['test_key'] == 'test_value'
    except botocore.exceptions.ConnectionError:
        pytest.fail("""
boto3 connection error in test. Check your environment variables

Be sure AWS_ENDPOINT_URL points to a valid localized endpoint. If connecting to S3, be sure AWS_ENDPOINT_URL is blank or not set and that AWS_SECRET_ACCESS_KEY and AWS_ACCESS_KEY_ID are set
""")
    except Exception as e:
        error_msg = str(e)
        if 'NoSuchBucket' in error_msg:
            pytest.fail(f"""
Could not connect. No such bucket: {obj.bucket_name}
AWS endpoint: {endpoint}

NOTE: StoryMap and these tests do not create the storage bucket. For testing, your endpoint should have a bucket named according to your AWS_TEST_BUCKET environment variable. With localstack, this bucket can be created with the following command:

aws --endpoint-url=http://localhost:4566 s3 mb s3://{settings.AWS_TEST_BUCKET}
""")
        elif 'NoSuchKey' in error_msg:
            pytest.fail("""
No such key error

The `save_from_data` function currently only saves to remote S3. To get this test passing, we will need to migrate to boto3 usage that allows for local storage (via localstack) or remote (to s3)
""")
        else:
            raise
