"""
Legacy logging configuration - kept for backward compatibility
This now uses the central logger
"""
from app.core.central_logger import setup_central_logging
import os

def configure_logging():
    """
    Configures the central logger for the application.
    This is a wrapper around setup_central_logging for backward compatibility.
    """
    use_json = os.getenv("LOG_FORMAT", "text").lower() == "json"
    log_level = os.getenv("LOG_LEVEL", "INFO")
    setup_central_logging(
        service_name="backend",
        use_json=use_json,
        log_level=log_level,
        also_console=True
    )

