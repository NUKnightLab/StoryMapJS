"""Integration testing requiring access to S3

Be sure to set the following env vars:

AWS_SECRET_ACCESS_KEY
AWS_ACCESS_KEY_ID
AWS_TEST_BUCKET (defaults to test.knilab.com)

Note: we are in the process to transitioning to boto3 in order support localstack based testing and development. To use with localstack, be sure also to set:

AWS_ENDPOINT_URL="http://localhost:4572"
"""
import importlib
import json
import os
import sys
import unittest
import boto
import botocore
import boto3

if __name__ == "__main__":
    if not os.environ.get('FLASK_SETTINGS_MODULE', ''):
        os.environ['FLASK_SETTINGS_MODULE'] = 'core.settings.loc'

settings_module = os.environ.get('FLASK_SETTINGS_MODULE')
try:
    importlib.import_module(settings_module)
except ImportError, e:
    raise ImportError("Could not import settings '%s' (Is it on sys.path?): %s" % (settings_module, e))

settings = sys.modules[os.environ['FLASK_SETTINGS_MODULE']]
settings.TEST_MODE = False
settings.AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_TEST_BUCKET', 'test.knilab.com')

try:
    from storymap.storage import all_keys, save_from_data
except boto.exception.S3ResponseError:
    raise Exception("""

boto2 response error loading module storymap.storage. Check your environment variables

During transition from boto2 to boto3, real connections to S3 are required to test the legacy code. Be sure AWS_SECRET_ACCESS_KEY and AWS_ACCESS_KEY_ID are set
""")


class StorageTestCase(unittest.TestCase):

    def test_list_keys(self):
        keys = all_keys()
        # TODO: this is not yet testing anything

    def test_save_from_data(self):
        file_name = 'test1.json'
        key_name = '%s/%s' % (settings.AWS_STORAGE_BUCKET_KEY, file_name)
        content_type = 'application/json'
        content = json.dumps({ 'test_key': 'test_value' })
        save_from_data(key_name, content_type, content)
        endpoint = settings.AWS_ENDPOINT_URL
        if endpoint:
            s3 = boto3.resource('s3', endpoint_url=endpoint)
        else:
            s3 = boto3.resource('s3')
        obj = s3.Object(settings.AWS_STORAGE_BUCKET_NAME, key_name)
        try:
            self.assertEqual('test_value',
                json.loads(obj.get()['Body'].read())['test_key'])
        except botocore.exceptions.ConnectionError:
            self.fail("""
boto3 connection error in test. Check your environment variables

Be sure AWS_ENDPOINT_URL points to a valid localized endpoint. If connecting to S3, be sure AWS_ENDPOINT_URL is blank or not set and that AWS_SECRET_ACCESS_KEY and AWS_ACCESS_KEY_ID are set
""")
        except Exception as e:
            if 'NoSuchBucket' in e.message:
                self.fail("""
Could not connect. No such bucket: %s
AWS endpoint: %s

NOTE: StoryMap and these tests do not create the storage bucket. For testing, your endpoint should have a bucket named according to your AWS_TEST_BUCKET environment variable. With localstack, this bucket can be created with the following command:

aws --endpoint-url=http://localhost:4572 s3 mb s3://%s
""" % (obj.bucket_name, endpoint, settings.AWS_TEST_BUCKET))
            elif 'NoSuchKey' in e.message:
                self.fail("""
No such key error

The `save_from_data` function currently only saves to remote S3. To get this test passing, we will need to migrate to boto3 usage that allows for local storage (via localstack) or remote (to s3)
""")
            else:
                raise


def suite():
    tests = ['test_list_keys', 'test_save_from_data']
    return unittest.TestSuite(map(StorageTestCase, tests))

if __name__=='__main__':
    unittest.main()
