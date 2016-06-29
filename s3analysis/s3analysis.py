import importlib
import os
import sys
try:
    import unicodecsv as csv
except ImportError:
    print "warning: unicodecsv not found. Please install it"
    import csv
from urlparse import urlparse
import json
settings_module = os.environ.setdefault('FLASK_SETTINGS_MODULE', 'core.settings.loc') # other StoryMap code expects this value to be set
try:
    importlib.import_module(settings_module)
except ImportError, e:
    raise ImportError("Could not import settings '%s' (Is it on sys.path?): %s" % (settings_module, e))

from storymap import storage
bucket = storage._conn.get_bucket('uploads.knightlab.com')

def prepare_mirror_path(dump_dir, user, title_slug, key_name):
    fn = key_name[key_name.index('/')+1:] # chop off everything up to and including the first '/'
    title_slug_truncated = title_slug[:255] # someone has a bizarrely long one
    if title_slug != title_slug_truncated:
        print "VERBOSE: %s" % title_slug
    path = os.path.join(dump_dir,user, title_slug_truncated) # chop off the last '/' and everything after
    filename = key_name.split('/')[-1]
    return path, filename

def prepare_data_from_keys(keys, error_log):
    """Given a set of S3 keys for a single storymap, analyze them to find the "best" JSON file. Read that file in,
       and "annotate" it with a list of the key names so that we can cache the data and not have to read from S3
       if we make changes to what we pull out."""

    user, title_slug = keys[0].name.split('/')[1:3]

    image_keys = []
    pub = draft = None
    for k in keys:
        if '/_images/' in k.name:
            image_keys.append(k.name)
        elif k.name.endswith('draft.json'):
            draft = k
        elif k.name.endswith('published.json'):
            pub = k

    status = 'draft'
    config_key = draft
    if pub:
        status = 'published'
        config_key = pub
    if config_key is None:
        error_log.writerow(["%s/%s" % (user, title_slug), "No JSON for storymap"])
        return None

    try:
        data = json.loads(config_key.get_contents_as_string())
    except Exception, e:
        error_log.writerow([config_key.name, "Error loading from S3: %s" % e])
        return None

    # add things which we would otherwise need the entire keyset to know.
    data['status'] = status
    data['image_count'] = len(image_keys)
    data['keys'] = [k.name for k in keys]
    filename = 'draft.html' if status == 'draft' else 'index.html'

    data['url'] = 'http://uploads.knightlab.com/storymapjs/{}/{}/{}'.format(user, title_slug, filename)

    return data



def process_keys(keys, data_csv, error_log, dump_dir=None, force_reload=False):
    """Given a list of keys that are in a single 'directory' on S3, sort out the details and log what we need
        before going on to the next "directory".

        error_log is a csvwriter. Log errors to it with error_log.write_row([key, message])

        If dump_dir is specified, JSON which is retrieved will be stored there. If dump_dir is specified and force_reload is False,
        this script will read a cached file from the dump_dir instead of from S3.
    """
    key_parts = keys[0].name.split('/')
    if len(key_parts) < 4:
        error_log.writerow([keys[0].name, 'key name has too few paths'])
        return
    user, title_slug = keys[0].name.split('/')[1:3]

    data = None

    if dump_dir and not force_reload:
        title_dir = title_slug[:255] # Mac OS can't take file or directory names longer than 255
        mirror_file = os.path.join(dump_dir, user, title_dir, 'data.json')
        if os.path.exists(mirror_file):
            data = json.load(open(mirror_file,'rb'))

    if data is None:
        data = prepare_data_from_keys(keys, error_log)

    if data is None:
        return # any anomalies should have been logged already

    if dump_dir:
        try:
            os.makedirs(os.path.dirname(mirror_file))
        except:
            pass #directories already existed
        json.dump(data, open(mirror_file, 'wb'))


    d = {
        'user': user,
        'title_slug': title_slug,
        'status': 'draft',
        'kind': 'map'
    }

    d['uploaded_image_count'] = data['image_count']
    d['status'] = data['status']


    d['base_layer'] = data['storymap'].get('map_type','default')
    if d['base_layer'] == 'zoomify':
        d['kind'] = 'gigapixel'

    d['slide_count'] = len(data['storymap']['slides'])
    for i,slide in enumerate(data['storymap']['slides']):
        d['slide_index'] = i
        if slide is None:
            print "ERROR: null slide %i in %s/%s" % (i, user, title_slug)
            d['background'] = d['media_domain'] = ''
        else:
            try:
                bg = slide['background']
                d['background'] = 'image' if bg.get('url') else 'color'
            except KeyError:
                d['background'] = ''
            try:
                parsed = urlparse(slide['media']['url'])
                d['media_domain'] = parsed.netloc
            except KeyError:
                d['media_domain'] = ''
        try:
            data_csv.writerow(d)
        except Exception, e:
            import pdb; pdb.set_trace()
            print "Error writing row: %s" % e
            print d

if __name__ == '__main__':

    last_user_title = None
    keys = []
    processed = 0
    with open("s3analysis/anomalies.csv", "w") as error_file:
        error_log = csv.writer(error_file)
        error_log.writerow(['key', 'error'])
        with open("s3analysis/storymap_data.csv", "w") as f:
            fields = ['user', 'title_slug', 'kind', 'slide_count', 'status', 'base_layer', 'uploaded_image_count',
                      'slide_index', 'media_domain', 'background']
            data_csv = csv.DictWriter(f,fields)
            data_csv.writerow(dict(zip(fields, fields))) # header row
            for i, key in enumerate(bucket.list(prefix='storymapjs')):

                user, title_slug = key.name.split('/')[1:3]
                user_title = '{}/{}'.format(user,title_slug)
                if last_user_title and last_user_title != user_title:
                    process_keys(keys, data_csv, error_log, 's3analysis/mirror') # remove the third argument to not mirror the files
                    keys = []
                    processed += 1
                    if processed > 0 and processed % 1000 == 0: print processed,
                last_user_title = user_title
                keys.append(key)
