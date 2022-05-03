from celery import Celery
tasks = Celery('tasks')
tasks.config_from_object('storymap.celeryconf')
from . import storage



@tasks.task
def storymap_cleanup(user_id, storymap_id):
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
