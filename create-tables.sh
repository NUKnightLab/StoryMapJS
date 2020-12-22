#!/usr/bin/env sh
docker-compose run pg psql -h pg -U storymap -c 'CREATE TABLE IF NOT EXISTS users (id serial PRIMARY KEY, uid varchar(32), uname varchar(100), migrated smallint, storymaps jsonb, CONSTRAINT unique_uid UNIQUE (uid));'
