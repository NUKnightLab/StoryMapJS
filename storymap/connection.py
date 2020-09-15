import copy
import json
import math
import sys
import os
import psycopg2
import psycopg2.extras
from psycopg2.sql import SQL, Literal

psycopg2.extensions.register_adapter(dict, psycopg2.extras.Json)

DEFAULT_USER_QUERY_LIMIT = 20

# Get settings module
settings = sys.modules[os.environ['FLASK_SETTINGS_MODULE']]

print('db host', settings.DATABASES['default']['HOST'])
print('db port', int(settings.DATABASES['default']['PORT']))


_pg_conn = psycopg2.connect(
    host=settings.DATABASES['pg']['HOST'],
    port=settings.DATABASES['pg']['PORT'],
    dbname=settings.DATABASES['pg']['NAME'],
    user=settings.DATABASES['pg']['USER'],
    password=settings.DATABASES['pg']['PASSWORD'])


### Consolidated mongo resources. TODO: Remove these
import pymongo
import mongomock

USE_MONGO = True

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

### /END consolidated mongo resources


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


def migrate_pg(drop_table=False):
    # Checked max length of uname in mongo was 71 characters
    raise Exception('Migration currently unavailable')
    if drop_table:
        with _pg_conn.cursor() as cursor:
            cursor.execute('DROP TABLE IF EXISTS users;')
            cursor.execute(
                "CREATE TABLE IF NOT EXISTS users " \
                "(id serial PRIMARY KEY, uid varchar(32), uname varchar(100), " \
                "migrated smallint, storymaps jsonb, " \
                "CONSTRAINT unique_uid UNIQUE (uid))")
        _pg_conn.commit()
    for u in _users.find({}):
        query = "INSERT INTO users (uid, uname, migrated, storymaps) " \
            "VALUES (%s, %s, %s, %s);"
        with _pg_conn.cursor() as cursor:
            try:
                cursor.execute(query, (u['uid'], u['uname'], u['migrated'], {}))
            except psycopg2.errors.UniqueViolation:
                return
        print('Created:', u['uid'])
        _pg_conn.commit()
        print('Created pg user:', u['uid'])
    _pg_conn.close()



def delete_test_user():
    """Delete the hard-coded user from the database.
    Use for testing new-user workflow
    """
    test_uid = '6331e0e40cd0ea0a72a130f6b352b106'
    if USE_MONGO:
        _users.remove({ 'uid': test_uid })
    with _pg_conn.cursor() as cursor:
        cursor.execute('DELETE FROM users where uid=%s', (test_uid,))
    _pg_conn.commit()


def audit_pg():
    if not USE_MONGO:
        print('Mongo usage is disabled. Expect extreme divergence between databases!')
    with _pg_conn.cursor() as cursor:
        cursor.execute('SELECT COUNT (*) from users')
        count = cursor.fetchone()[0]
        if count != _users.count():
            mongo_users = _users.find()
            for u in mongo_users:
                cursor.execute(
                    "SELECT * FROM users where uid=%s", (u['uid'],))
                pg_user = cursor.fetchall()
                if not pg_user:
                    print('Mongo user:', u['uid'], 'not in pg database')
        cursor.execute(
            "SELECT uid, uname, migrated, storymaps FROM users")
            #"SELECT uid, uname, migrated, storymaps FROM users " \
            #"ORDER BY RANDOM() " \
            #"LIMIT 1000")
        rand_users = cursor.fetchall()
        audit_count = 0
        bad_storymaps_count = 0
        for u in rand_users:
            audit_count += 1
            uid, uname, migrated, storymaps = u
            mongo_user = _users.find_one({'uid': uid})
            assert uid == mongo_user['uid']
            assert uname == mongo_user['uname']
            assert migrated == mongo_user['migrated']
            if storymaps != mongo_user['storymaps']:
                print(storymaps)
                bad_storymaps_count += 1
        print(f'Audited {audit_count} users')
        print(f'{bad_storymaps_count} mismatched')


def get_pg_user(uid):
    with _pg_conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
        cursor.execute(
            "SELECT uid, uname, migrated, storymaps FROM users " \
            "WHERE uid=%s", (uid,))
        u = cursor.fetchone()
    if u is not None:
        u = dict(u)
    return u


def save_pg_user(user):
    _u = get_pg_user(user['uid'])
    if _u:
        with _pg_conn.cursor() as cursor:
            _u = dict(_u)
            _u.update(user)
            cursor.execute(
                "UPDATE users SET uid=%(uid)s, uname=%(uname)s, " \
                "migrated=%(migrated)s, storymaps=%(storymaps)s " \
                "WHERE uid=%(uid)s;", user)
            _pg_conn.commit()
    else:
        create_pg_user(
            user['uid'],
            user['uname'],
            migrated=user.get('migrated', 1),
            storymaps=user.get('storymaps'))


def create_user(uid, uname, migrated=1, storymaps=None):
    if storymaps is None:
        storymaps = {}
    if USE_MONGO:
        _users.insert({
            'uid': uid,
            'uname': uname,
            'migrated': migrated,
            'storymaps': storymaps
        })
    create_pg_user(uid, uname, migrated=1, storymaps=storymaps)


def get_user(uid):
    # We have fully cut-over user retrieval to be from pg now instead of mongo
    # TODO: Delete these mongo lines when consolidated mongo resources are
    # also deleted.
    # for mongo:
    #user = _users.find_one({'uid': uid})
    #if user and 'google' in user:
    #    del user['google']

    # for pg:
    user = get_pg_user(uid)

    return user


def save_user(user):
    """The time requirement for saving a user in Mongo is enough that record
    audits usually show at least a few mismatched records. Trying to mitigate
    that by saving the Mongo record first.
    """
    user_copy = copy.copy(user)
    if USE_MONGO:
        mongo_user = _users.find_one({'uid': user_copy['uid']})
        if mongo_user:
            user_copy['_id'] = mongo_user['_id']
        _users.save(user_copy)
    save_pg_user(user)


def find_users(uname=None, uname__like=None, uid=None, migrated=None,
        limit=DEFAULT_USER_QUERY_LIMIT, offset=0):
    """NOTE: currently does not properly handle an all-users search. Must
    include either uname, uname__like, or uid for a legitimate query.
    """
    params = []
    query = SQL('')
    if uid is not None:
        query += SQL('uid=%s')
        params.append(uid) 
    else:
        if uname is not None:
            query += SQL('uname=%s')
            params.append(uname)
        elif uname__like is not None:
            query += SQL('uname ILIKE %s')
            params.append(f'%{uname__like}%')
    if migrated is not None:
        conj = 'AND' if any([uname, uname__like, uid]) else 'WHERE'
        query += SQL(f' {conj} migrated=%s')
        params.append(migrated)
    with _pg_conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
        q = SQL('SELECT COUNT(*) FROM users WHERE ') + query
        cursor.execute(q, params)
        count = cursor.fetchone()[0]
        q = SQL('SELECT * FROM users WHERE ') + query + \
            SQL(' OFFSET %s LIMIT %s')
        params.extend([offset, limit])
        cursor.execute(q, params)
        users = cursor.fetchall()
    pages = int(math.ceil(count / limit))
    return users, pages
    
