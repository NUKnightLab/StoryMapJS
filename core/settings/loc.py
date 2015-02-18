"""
Local settings and globals.
"""
import sys
import os
from .base import *

# Import secrets
secrets_path = os.path.normpath(os.path.join(PROJECT_ROOT, '../secrets/storymap/loc'))
sys.path.append(secrets_path)

from secrets import *

# Set Flask configuration
os.environ['FLASK_CONFIG_MODULE'] = os.path.join(secrets_path, 'flask_config.py')
    
STATIC_URL = '/static/'

CDN_URL = 'http://cdn.knightlab.com/libs/storymap/dev/'
#CDN_URL = '/compiled/'

DATABASES = {
    'default': {
        'ENGINE': 'mongo',
        'NAME': 'storymap',
        'HOST': '127.0.0.1',
        'PORT': 27017,
    }
}

# User storage bucket name on S3
AWS_STORAGE_BUCKET_NAME = 'uploads.knilab.com'

# User storage bucket url on S3
AWS_STORAGE_BUCKET_URL = '//s3.amazonaws.com/uploads.knilab.com/'