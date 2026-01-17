"""
Celery initialization with central logging
This file should be imported before starting Celery workers
"""
import os
from app.core.central_logger import setup_central_logging

# Setup central logging for Celery worker
use_json = os.getenv("LOG_FORMAT", "text").lower() == "json"
log_level = os.getenv("LOG_LEVEL", "INFO")
setup_central_logging(
    service_name="celery",
    use_json=use_json,
    log_level=log_level,
    also_console=True
)

