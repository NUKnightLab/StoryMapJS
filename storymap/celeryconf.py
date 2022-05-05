import os
import sys

"""
Obsolete. huey is now being used in lieu of celery.
"""


###
# redis
###

#redis_host = os.environ.get("REDIS_HOST", "localhost")
#broker_url = f"redis://{redis_host}:6379/0"
#result_backend = f"redis://{redis_host}redis:6379/0"


###
# sqs - not really working
###

#broker_url = 'sqs://xyz:xyz@localstack:4566'
#broker_transport_options = {
#    'region': 'us-east-1',
#    'visibility_timeout': 3600,
#    'polling_interval': 30,
#    'wait_time_seconds': 0,
#    'queue_name_prefix': 'storymap-'
#}

###
# rabbitmq
###

rabbitmq_host = os.environ.get("RABBITMQ_HOST", "localhost")
broker_url = f"amqp://guest:guest@{rabbitmq_host}:5672/"

broker_transport_options = {"queue_name_prefix": "storymap-tasks-"}
