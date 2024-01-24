import copy
import json
import math
import sys
import os
import psycopg2
import psycopg2.extras
from contextlib import contextmanager
from psycopg2.sql import SQL, Literal

psycopg2.extensions.register_adapter(dict, psycopg2.extras.Json)

DEFAULT_USER_QUERY_LIMIT = 20



def pg_conn(settings=None):
    if settings is None:
        settings = sys.modules[os.environ['FLASK_SETTINGS_MODULE']]
    return psycopg2.connect(
        host=settings.DATABASES['pg']['HOST'],
        port=settings.DATABASES['pg']['PORT'],
        dbname=settings.DATABASES['pg']['NAME'],
        user=settings.DATABASES['pg']['USER'],
        password=settings.DATABASES['pg']['PASSWORD'])


### Postgres ###

def create_pg_user(uid, uname, *, db, migrated=1, storymaps=None):
    if storymaps is None:
        storymaps = {}
    query = "INSERT INTO users (uid, uname, migrated, storymaps) " \
        "VALUES (%s, %s, %s, %s);"
    with db.cursor() as cursor:
        cursor.execute(query, (uid, uname, migrated, storymaps))
    db.commit()


def create_users_table(*, db, drop_table=False):
    if drop_table:
        with db.cursor() as cursor:
            cursor.execute('DROP TABLE IF EXISTS users;')
            cursor.execute(
                "CREATE TABLE IF NOT EXISTS users " \
                "(id serial PRIMARY KEY, uid varchar(32), uname varchar(100), " \
                "migrated smallint, storymaps jsonb, " \
                "CONSTRAINT unique_uid UNIQUE (uid))")
        db.commit()
    else:
        with db.cursor() as cursor:
            cursor.execute(
                "CREATE TABLE IF NOT EXISTS users " \
                "(id serial PRIMARY KEY, uid varchar(32), uname varchar(100), " \
                "migrated smallint, storymaps jsonb, " \
                "CONSTRAINT unique_uid UNIQUE (uid))")
        db.commit()


def delete_test_user(*, db):
    """Delete the hard-coded user from the database.
    Use for testing new-user workflow
    """
    test_uid = '6331e0e40cd0ea0a72a130f6b352b106'
    with db.cursor() as cursor:
        cursor.execute('DELETE FROM users where uid=%s', (test_uid,))
    db.commit()


def get_pg_user(uid, *, db):
    with db.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
        cursor.execute(
            "SELECT uid, uname, migrated, storymaps FROM users " \
            "WHERE uid=%s", (uid,))
        u = cursor.fetchone()
    if u is not None:
        u = dict(u)
    return u


def save_pg_user(user, *, db):
    _u = get_pg_user(user['uid'], db=db)
    if _u:
        with db.cursor() as cursor:
            _u = dict(_u)
            _u.update(user)
            cursor.execute(
                "UPDATE users SET uid=%(uid)s, uname=%(uname)s, " \
                "migrated=%(migrated)s, storymaps=%(storymaps)s " \
                "WHERE uid=%(uid)s;", user)
            db.commit()
    else:
        create_pg_user(
            user['uid'],
            user['uname'],
            migrated=user.get('migrated', 1),
            storymaps=user.get('storymaps'), db=db)


def create_user(uid, uname, *, db, migrated=1, storymaps=None):
    if storymaps is None:
        storymaps = {}
    create_pg_user(uid, uname, migrated=1, storymaps=storymaps, db=db)


def get_user(uid, *, db):
    return get_pg_user(uid, db=db)


def save_user(user, *, db):
    user_copy = copy.copy(user)
    save_pg_user(user, db=db)


def find_users(*, db, uname=None, uname__like=None, uid=None, migrated=None,
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
    with db.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
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
