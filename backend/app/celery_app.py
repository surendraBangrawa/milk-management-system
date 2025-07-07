from celery import Celery
from app.core.config import (
    CELERY_BROKER_URL,
    CELERY_RESULT_BACKEND,
    CELERY_TASK_SERIALIZER,
    CELERY_RESULT_SERIALIZER,
    CELERY_ACCEPT_CONTENT,
    CELERY_TIMEZONE,
    CELERY_ENABLE_UTC,
    CELERY_TASK_TRACK_STARTED,
    CELERY_TASK_TIME_LIMIT,
    CELERY_TASK_SOFT_TIME_LIMIT,
)

# Create Celery instance
celery_app = Celery(
    "milk_management",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=["app.tasks.ratelist_tasks"],
)

# Configure Celery
celery_app.conf.update(
    task_serializer=CELERY_TASK_SERIALIZER,
    result_serializer=CELERY_RESULT_SERIALIZER,
    accept_content=CELERY_ACCEPT_CONTENT,
    timezone=CELERY_TIMEZONE,
    enable_utc=CELERY_ENABLE_UTC,
    task_track_started=CELERY_TASK_TRACK_STARTED,
    task_time_limit=CELERY_TASK_TIME_LIMIT,
    task_soft_time_limit=CELERY_TASK_SOFT_TIME_LIMIT,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
)

# Optional: Configure task routing
celery_app.conf.task_routes = {
    "app.tasks.ratelist_tasks.*": {"queue": "ratelist"},
}

if __name__ == "__main__":
    celery_app.start()
