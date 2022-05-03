import os


redis_host = os.environ.get("REDIS_HOST", "localhost")
broker_url = f"redis://{REDIS_HOST}:6379/0"
result_backend = f"redis://{REDIS_HOST}redis:6379/0"
