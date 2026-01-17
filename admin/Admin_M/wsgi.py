"""
WSGI config for Admin_M project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os
import sys

# Add backend directory to path for central logger
backend_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Setup central logging BEFORE Django initialization
from app.core.central_logger import setup_central_logging

use_json = os.getenv("LOG_FORMAT", "text").lower() == "json"
log_level = os.getenv("LOG_LEVEL", "INFO")
setup_central_logging(
    service_name="admin",
    use_json=use_json,
    log_level=log_level,
    also_console=True
)

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Admin_M.settings")

application = get_wsgi_application()
