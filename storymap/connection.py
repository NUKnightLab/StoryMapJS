import json
import sys
import os
import psycopg2
import psycopg2.extras
import pymongo
import mongomock

# Get settings module
settings = sys.modules[os.environ['FLASK_SETTINGS_MODULE']]

print('db host', settings.DATABASES['default']['HOST'])
print('db port', int(settings.DATABASES['default']['PORT']))

# Checked max length of uname in mongo was 71 characters
_pg_conn = psycopg2.connect('host=pg dbname=storymap user=storymap password=storymap')




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


### Postgres ###

def migrate_pg():
    with _pg_conn.cursor() as cursor:
        # cursor.execute('DROP TABLE IF EXISTS users;')
        cursor.execute(
            "CREATE TABLE IF NOT EXISTS users " \
            "(id serial PRIMARY KEY, uid varchar(32), uname varchar(100), " \
            "migrated boolean, google jsonb, storymaps jsonb, " \
            "CONSTRAINT unique_uid UNIQUE (uid))")
        for u in _user.find({}):
            try:
                cursor.execute(
                    "INSERT INTO users (uid, uname, migrated, google, storymaps) " \
                    "VALUES (%s, %s, %s, %s, %s);",
                    (u['uid'], u['uname'], bool(u['migrated']),
                    json.dumps(u['google']), json.dumps(u['storymaps'])))
                print(u['uid'])
            except psycopg2.errors.UniqueViolation:
                print('Skipping existing:', u['uid'])
    _pg_conn.commit()
    _pg_conn.close()


def get_pg_user(uid):
    with _pg_conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
        cursor.execute(
            "SELECT uid, uname, migrated, google, storymaps FROM users " \
            "WHERE uid=%s", (uid,))
        u = cursor.fetchone()
    return u


def save_pg_user(user):
    with _pg_conn.cursor() as cursor:
        pass
        _u = get_pg_user(user['uid'])
        _u.update(user)
        cursor.execute(
            "UPDATE user SET (uid, uname, migrated, google, storymaps) " \
            "VALUES (%(uid)s, %(uname)s, %(migrated)s, %(google)s, %(storymap) WHERE uid=%(uid)s;",
            **user)
        _pg_conn.commit()
