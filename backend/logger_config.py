import logging
import sys
from pathlib import Path
from loguru import logger
import json
from datetime import datetime
 
# Create logs directory if it doesn't exist
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)
 
# Configure loguru logger
logger.remove()  # Remove default handler
 
# Add console handler with color
logger.add(
    sys.stdout,
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)
 
# Add file handler for all logs
logger.add(
    LOGS_DIR / "app.log",
    rotation="500 MB",
    retention="10 days",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level="INFO"
)
 
# Add file handler for errors only
logger.add(
    LOGS_DIR / "error.log",
    rotation="100 MB",
    retention="10 days",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level="ERROR"
)
 
class CustomJSONFormatter(logging.Formatter):
    def format(self, record):
        json_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        if hasattr(record, "request_id"):
            json_record["request_id"] = record.request_id
        if hasattr(record, "path"):
            json_record["path"] = record.path
        if hasattr(record, "method"):
            json_record["method"] = record.method
        return json.dumps(json_record)