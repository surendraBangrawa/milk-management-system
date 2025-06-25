from loguru import logger as adminlogger
import os
from pathlib import Path
_frmt = "[{time: YYYY-MM-DD}] [{level}] [{module}:{line}] {message}"

basedir = Path(__file__).resolve().parent.parent
_info_log_dir = os.path.join(basedir, "logs/info")


adminlogger.configure(
    handlers=[{
        "sink": os.path.join(_info_log_dir,"admin.log"),
        "colorize": False,
        "format": _frmt,
        "rotation": "1 day",
        "level": "INFO"
    }]
)