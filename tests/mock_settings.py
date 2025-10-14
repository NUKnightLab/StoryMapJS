"""Mock settings module for unit tests."""
TEST_MODE = True

# Flask/static assets
STATIC_URL = 'https://static.example.com/'
CDN_URL = 'https://cdn.example.com/'

# Storage configuration
AWS_STORAGE_BUCKET_NAME = 'storymap-test-bucket'
AWS_STORAGE_BUCKET_URL = 'https://storage.example.com/'
AWS_STORAGE_BUCKET_KEY = 'storymaps'
AWS_ACCESS_KEY_ID = 'mock-access-key'
AWS_SECRET_ACCESS_KEY = 'mock-secret-key'
AWS_ENDPOINT_URL = None

# OAuth placeholders
GOOGLE_CLIENT_ID = 'mock-client-id'
GOOGLE_CLIENT_SECRET = 'mock-client-secret'

# Misc application settings
ADMINS = ['admin@example.com']
STORYMAPJS_DIRECTORY = '/tmp/storymapjs'
FLASK_SETTINGS_MODULE = 'tests.mock_settings'
STORYMAP_JS_FILE = 'storymap-min.js'
