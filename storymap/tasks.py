from celery import Celery
tasks = Celery('tasks')
tasks.config_from_object('storymap.celeryconf')
from . import storage

import logging
log = logging.getLogger("huey")


# Celery is unused. Using huey now.

@tasks.task
def _storymap_cleanup(user_id, storymap_id):
    """Cleanup the assets of a deleted storymap. Returns the number of assets deleted."""
    max_keys = min(storage.S3_LIST_OBJECTS_MAX, storage.S3_DELETE_OBJECTS_MAX)
    key_prefix = storage.key_prefix(user_id, storymap_id)
    count = 0
    key_list = None
    while key_list is None or len(key_list) > 0:
        key_list, maybe_more_keys = storage.list_keys(key_prefix, max_keys)
        if len(key_list) == 0:
            break 
        storage.delete_keys(key_list)
        count += len(key_list)
    return count


from huey import SqliteHuey
from pathlib import Path

huey = SqliteHuey(filename='storymap/huey.db')

@huey.task()
def storymap_cleanup(user_id, storymap_id):
    """Cleanup the assets of a deleted storymap. Returns the number of assets deleted."""
    log.info(f"Deleting assets for user: {user_id}, StoryMap: {storymap_id}")
    max_keys = min(storage.S3_LIST_OBJECTS_MAX, storage.S3_DELETE_OBJECTS_MAX)
    key_prefix = storage.key_prefix(user_id, storymap_id)
    count = 0
    key_list = None
    while key_list is None or len(key_list) > 0:
        key_list, maybe_more_keys = storage.list_keys(key_prefix, max_keys)
        if len(key_list) == 0:
            break 
        storage.delete_keys(key_list)
        count += len(key_list)
    log.info(f"Deleted {count} assets for user: {user_id}, StoryMap: {storymap_id}")
    return count
