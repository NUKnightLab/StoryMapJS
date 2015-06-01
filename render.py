"""
Re-render embed pages for storymaps with problematic id chars
"""
import importlib
import re
import os
import sys

# Import settings module
if __name__ == "__main__":
    if not os.environ.get('FLASK_SETTINGS_MODULE', ''):
        os.environ['FLASK_SETTINGS_MODULE'] = 'core.settings.loc'

settings_module = os.environ.get('FLASK_SETTINGS_MODULE')

print 'Importing settings: %s' % settings_module

try:
    importlib.import_module(settings_module)
except ImportError, e:
    raise ImportError("Could not import settings '%s' (Is it on sys.path?): %s" % (settings_module, e))

print 'Connecting to database'

from storymap.connection import _user
from storymap import storage
from api import app, _write_embed_draft, _write_embed_published
from flask import g

# Find all storymaps with ids that contain bad chars

print 'Examining StoryMaps'

regex = re.compile('[^A-Za-z0-9_\-]')

skip = 0
limit = 100
n = _user.count()

while skip < n:
    for user in _user.find({}, skip=skip, limit=limit):
        for id in [id for id in user['storymaps'].keys() if regex.search(id)]:        
            key_prefix = storage.key_prefix(user['uid'], id)  
            
            with app.test_request_context():
                print 'Writing embed draft for %s' % key_prefix                
                _write_embed_draft(key_prefix, user['storymaps'][id])
            
                if user['storymaps'][id].get('published_on'):
                    print 'Writing embed published for %s' % key_prefix                
                    _write_embed_published(key_prefix, user['storymaps'][id])
                            
    skip += limit   
    
sys.exit(0)
   
