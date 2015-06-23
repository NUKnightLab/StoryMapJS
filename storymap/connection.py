import sys
import os
import pymongo

# Get settings module
settings = sys.modules[os.environ['FLASK_SETTINGS_MODULE']]

# Connect to mongo database
_conn = pymongo.Connection(
    settings.DATABASES['default']['HOST'],
    settings.DATABASES['default']['PORT'])
    
_db = _conn[settings.DATABASES['default']['NAME']]

# Mongo collections
_user = _db['users']

# Ensure indicies
_user.ensure_index('uid')
_user.ensure_index('uname')
  
