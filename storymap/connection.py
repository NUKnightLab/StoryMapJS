import sys
import os
import pymongo
import mongomock

# Get settings module
settings = sys.modules[os.environ['FLASK_SETTINGS_MODULE']]

print('db host', settings.DATABASES['default']['HOST'])
print('db port', int(settings.DATABASES['default']['PORT']))

if settings.TEST_MODE:
    _conn = mongomock.MongoClient()
else:
    # Connect to mongo database
    _conn = pymongo.Connection(
        settings.DATABASES['default']['HOST'],
        int(settings.DATABASES['default']['PORT']))

_db = _conn[settings.DATABASES['default']['NAME']]

# Mongo collections
_user = _db['users']

# Ensure indicies
_user.ensure_index('uid')
_user.ensure_index('uname')

