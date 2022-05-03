import os


redis_host = os.environ.get("REDIS_HOST", "localhost")
broker_url = f"redis://{redis_host}:6379/0"
result_backend = f"redis://{redis_host}redis:6379/0"
