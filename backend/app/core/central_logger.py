"""
Central Logging Configuration
This module provides a unified logging system that captures all logs from
all services (backend, admin, website, celery) into a single log file.

Usage:
    from app.core.central_logger import setup_central_logging

    # At application startup
    setup_central_logging(service_name="backend", use_json=False)
"""

import logging
import sys
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
import threading

# Global lock for thread-safe logging
_log_lock = threading.Lock()

# Central log file path
CENTRAL_LOG_DIR = Path("/app/logs")
CENTRAL_LOG_FILE = CENTRAL_LOG_DIR / "milk_management.log"


class CentralLogFormatter(logging.Formatter):
    """Custom formatter for central logging"""

    def __init__(self, use_json: bool = False, service_name: str = "unknown"):
        super().__init__()
        self.use_json = use_json
        self.service_name = service_name

    def format(self, record: logging.LogRecord) -> str:
        """Format log record"""
        if self.use_json:
            return self._format_json(record)
        else:
            return self._format_text(record)

    def _format_json(self, record: logging.LogRecord) -> str:
        """Format as JSON for Loki"""
        log_entry: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "service": self.service_name,
            "thread": record.threadName,
            "process": record.process,
        }

        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Add extra context if present
        if hasattr(record, "extra_fields"):
            log_entry.update(record.extra_fields)

        return json.dumps(log_entry, ensure_ascii=False)

    def _format_text(self, record: logging.LogRecord) -> str:
        """Format as human-readable text"""
        timestamp = datetime.fromtimestamp(record.created).strftime("%Y-%m-%d %H:%M:%S")
        level = record.levelname
        logger_name = record.name
        message = record.getMessage()

        log_line = f"[{timestamp}] [{level:8s}] [{self.service_name:10s}] [{logger_name:30s}] {message}"

        # Add exception info if present
        if record.exc_info:
            log_line += "\n" + self.formatException(record.exc_info)

        return log_line


class CentralFileHandler(logging.Handler):
    """Thread-safe file handler for central logging"""

    def __init__(
        self, log_file: Path, use_json: bool = False, service_name: str = "unknown"
    ):
        super().__init__()
        self.log_file = log_file
        self.use_json = use_json
        self.service_name = service_name

        # Ensure log directory exists
        self.log_file.parent.mkdir(parents=True, exist_ok=True)

        # Set formatter
        self.setFormatter(
            CentralLogFormatter(use_json=use_json, service_name=service_name)
        )

    def emit(self, record: logging.LogRecord):
        """Emit log record to file"""
        try:
            with _log_lock:
                with open(self.log_file, "a", encoding="utf-8") as f:
                    f.write(self.format(record) + "\n")
        except Exception:
            # Fallback to stderr if file write fails
            self.handleError(record)


class InterceptHandler(logging.Handler):
    """
    Intercept handler that captures logs from third-party libraries
    (like loguru, etc.) and routes them through the standard logging system
    """

    def emit(self, record: logging.LogRecord):
        # Get the corresponding standard logging level
        try:
            level = logging.getLogger().getEffectiveLevel()
            if record.levelno >= level:
                logging.getLogger(record.name).handle(record)
        except Exception:
            pass


def setup_central_logging(
    service_name: str = "unknown",
    use_json: bool = False,
    log_level: str = "INFO",
    log_file: Optional[Path] = None,
    also_console: Optional[bool] = None,
):
    """
    Set up central logging configuration.

    This function configures the root logger to:
    1. Write all logs to a central file (Grafana/Loki)
    2. Optionally output to console (dev only)
    3. Support JSON format for Loki or text format for console

    Environment-based behavior:
    - Dev: Logs to both console (text) and Grafana (JSON)
    - Prod: Logs only to Grafana (JSON), no console

    Args:
        service_name: Name of the service (backend, admin, website, celery)
        use_json: If True, use JSON format (for Loki). If False, use text format.
                  If None, auto-detects based on environment (defaults to True for Grafana)
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Custom log file path (defaults to CENTRAL_LOG_FILE)
        also_console: If True, also log to console. If None, auto-detects based on environment
                     (True for dev, False for prod)
    """
    # Detect environment (dev vs prod)
    environment = os.getenv("ENVIRONMENT", os.getenv("ENV", "development")).lower()
    is_production = environment == "production" or environment == "prod"

    # Auto-configure console logging based on environment
    # Dev: console enabled, Prod: console disabled
    if also_console is None:
        also_console = not is_production  # Console only in dev

    # Note: File handler always uses JSON format for Grafana/Loki
    # The use_json parameter is kept for backward compatibility but file handler always uses JSON

    # Determine log file path
    if log_file is None:
        log_file = CENTRAL_LOG_FILE

    # Convert log level string to logging constant
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)

    # Clear existing handlers
    root_logger.handlers.clear()

    # Add central file handler (always JSON for Grafana)
    file_handler = CentralFileHandler(
        log_file=log_file,
        use_json=True,  # Always JSON for Grafana/Loki
        service_name=service_name,
    )
    file_handler.setLevel(numeric_level)
    root_logger.addHandler(file_handler)

    # Optionally add console handler (dev only, text format for readability)
    if also_console:
        console_handler = logging.StreamHandler(sys.stdout)
        # Use text format for console (more readable than JSON)
        console_formatter = logging.Formatter(
            "%(levelname)s | %(asctime)s | [%(name)s] | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        console_handler.setFormatter(console_formatter)
        console_handler.setLevel(numeric_level)
        root_logger.addHandler(console_handler)

    # Configure third-party loggers
    # Intercept loguru if present
    try:
        from loguru import logger as loguru_logger

        loguru_logger.remove()  # Remove default handler
        loguru_logger.add(
            lambda msg: logging.getLogger().log(logging.INFO, msg),
            format="{message}",
            level="INFO",
        )
    except ImportError:
        pass

    # Set levels for common third-party loggers
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
    logging.getLogger("celery").setLevel(logging.INFO)
    logging.getLogger("django").setLevel(logging.INFO)

    return root_logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance. This is a convenience function that ensures
    all loggers use the central logging configuration.

    Args:
        name: Logger name (typically __name__)

    Returns:
        Logger instance
    """
    return logging.getLogger(name)
