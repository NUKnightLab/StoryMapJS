import json
import sys
import os
import psycopg2
import psycopg2.extras
import pymongo
import mongomock

psycopg2.extensions.register_adapter(dict, psycopg2.extras.Json)

# Get settings module
settings = sys.modules[os.environ['FLASK_SETTINGS_MODULE']]

print('db host', settings.DATABASES['default']['HOST'])
print('db port', int(settings.DATABASES['default']['PORT']))

_pg_conn = psycopg2.connect(
    f"host={settings.DATABASES['pg']['HOST']} " \
    f"dbname={settings.DATABASES['pg']['NAME']} " \
    f"user={settings.DATABASES['pg']['USER']} " \
    f"password={settings.DATABASES['pg']['PASSWORD']}")



if settings.TEST_MODE:
    _conn = mongomock.MongoClient()
else:
    # Connect to mongo database
    _conn = pymongo.Connection(
        settings.DATABASES['default']['HOST'],
        int(settings.DATABASES['default']['PORT']))

_db = _conn[settings.DATABASES['default']['NAME']]

# Mongo collections
_users = _db['users']

# Ensure indicies
_users.ensure_index('uid')
_users.ensure_index('uname')


### Postgres ###

def create_pg_user(uid, uname, migrated=1, storymaps=None, cursor=None):
    if storymaps is None:
        storymaps = {}
    query = "INSERT INTO users (uid, uname, migrated, storymaps) " \
        "VALUES (%s, %s, %s, %s);"
    if cursor:
        cursor.execute(query, (uid, uname, migrated, storymaps))
        return
    else:
        with _pg_conn.cursor() as cursor:
            cursor.execute(query, (uid, uname, migrated, storymaps))
        _pg_conn.commit()


def migrate_pg(drop_table=True):
    # Checked max length of uname in mongo was 71 characters
    if drop_table:
        with _pg_conn.cursor() as cursor:
            cursor.execute('DROP TABLE IF EXISTS users;')
            cursor.execute(
                "CREATE TABLE IF NOT EXISTS users " \
                "(id serial PRIMARY KEY, uid varchar(32), uname varchar(100), " \
                "migrated smallint, storymaps jsonb, " \
                "CONSTRAINT unique_uid UNIQUE (uid))")
        _pg_conn.commit()
    with _pg_conn.cursor() as cursor:
        for u in _users.find({}):
            try:
                create_pg_user(u['uid'], u['uname'], u['migrated'],
                    json.dumps(u['storymaps']))
                print(u['uid'])
            except psycopg2.errors.UniqueViolation:
                print('Skipping existing:', u['uid'])
    _pg_conn.commit()
    _pg_conn.close()


def audit_pg():
    with _pg_conn.cursor() as cursor:
        cursor.execute('SELECT COUNT (*) from users')
        count = cursor.fetchone()[0]
        assert count == _users.count(), 'Postgres / Mongo user count mismatch'
        cursor.execute(
            "SELECT uid, uname, migrated, storymaps FROM users " \
            "ORDER BY RANDOM() " \
            "LIMIT 1000")
        rand_users = cursor.fetchall()
        for u in rand_users:
            uid, uname, migrated, storymaps = u
            mongo_user = _users.find_one({'uid': uid})
            assert uid == mongo_user['uid']
            assert uname == mongo_user['uname']
            assert migrated == mongo_user['migrated']
            assert storymaps == mongo_user['storymaps']


def get_pg_user(uid):
    with _pg_conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
        cursor.execute(
            "SELECT uid, uname, migrated, storymaps FROM users " \
            "WHERE uid=%s", (uid,))
        u = cursor.fetchone()
    return u


def save_pg_user(user):
    with _pg_conn.cursor() as cursor:
        _u = dict(get_pg_user(user['uid']))
        _u.update(user)
        cursor.execute(
            "UPDATE users SET uid=%(uid)s, uname=%(uname)s, " \
            "migrated=%(migrated)s, storymaps=%(storymaps)s " \
            "WHERE uid=%(uid)s;", user)
        _pg_conn.commit()


def create_user(uid, uname, migrated=1, storymaps=None):
    if storymaps is None:
        storymaps = {}
    _users.insert({
        'uid': uid,
        'uname': uname,
        'migrated': migrated,
        'storymaps': storymaps
    })
    create_pg_user(uid, uname, migrated=1, storymaps=storymaps)


def get_user(uid):
    # for pg: get_pg_user(uid)
    user = _users.find_one({'uid': uid})
    if 'google' in user:
        del user['google']
    return user


def save_user(user):
    _users.save(user)
    save_pg_user(user)


def find_users(query=None, skip=None, limit=None):
    for u in _users.find(query, skip, limit):
        yield u
