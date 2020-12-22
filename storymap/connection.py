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


_pg_conn = psycopg2.connect(
    host=settings.DATABASES['pg']['HOST'],
    port=settings.DATABASES['pg']['PORT'],
    dbname=settings.DATABASES['pg']['NAME'],
    user=settings.DATABASES['pg']['USER'],
    password=settings.DATABASES['pg']['PASSWORD'])


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
    _pg_conn.close()


def delete_test_user():
    """Delete the hard-coded user from the database.
    Use for testing new-user workflow
    """
    test_uid = '6331e0e40cd0ea0a72a130f6b352b106'
    with _pg_conn.cursor() as cursor:
        cursor.execute('DELETE FROM users where uid=%s', (test_uid,))
    _pg_conn.commit()


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
    create_pg_user(uid, uname, migrated=1, storymaps=storymaps)


def get_user(uid):
    return get_pg_user(uid)


def save_user(user):
    """The time requirement for saving a user in Mongo is enough that record
    audits usually show at least a few mismatched records. Trying to mitigate
    that by saving the Mongo record first.
    """
    user_copy = copy.copy(user)
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
