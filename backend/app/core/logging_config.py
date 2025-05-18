import logging
import sys
import os
from logging.handlers import RotatingFileHandler


LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()  # Default to INFO
LOG_FILE = os.getenv("LOG_FILE", "app.log")
LOG_FILE_MAX_BYTES = int(os.getenv("LOG_FILE_MAX_BYTES", 1024 * 1024 * 5))  # 5 MB
LOG_FILE_BACKUP_COUNT = int(os.getenv("LOG_FILE_BACKUP_COUNT", 5))  # Keep 5 backup logs


def configure_logging():
    """
    Configures the central logger for the application.
    Sets up console and file handlers.
    """
    # Get the root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(LOG_LEVEL)  # Set the overall minimum log level

    # Prevent adding handlers multiple times if configure_logging is called more than once
    if not root_logger.handlers:
        # --- Console Handler ---
        console_handler = logging.StreamHandler(sys.stdout)
        # Define a formatter for console output
        console_formatter = logging.Formatter(
            "%(levelname)s | %(asctime)s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S %Z",  # Include timezone info
        )
        console_handler.setFormatter(console_formatter)
        # Set console handler level (can be different from root, e.g., DEBUG for console)
        console_handler.setLevel(
            logging.DEBUG
        )  # Typically show all debug messages on console

        # Add the console handler to the root logger
        root_logger.addHandler(console_handler)

        # --- File Handler (Optional) ---
        # Create logs directory if it doesn't exist
        log_dir = "logs"
        os.makedirs(log_dir, exist_ok=True)
        log_file_path = os.path.join(log_dir, LOG_FILE)

        # Use RotatingFileHandler to prevent log files from getting too large
        file_handler = RotatingFileHandler(
            log_file_path,
            maxBytes=LOG_FILE_MAX_BYTES,
            backupCount=LOG_FILE_BACKUP_COUNT,
        )
        # Define a formatter for file output
        file_formatter = logging.Formatter(
            "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S %Z",  # Include timezone info
        )
        file_handler.setFormatter(file_formatter)
        # Set file handler level (can be different from root)
        file_handler.setLevel(
            LOG_LEVEL
        )  # Typically use the overall log level for the file

        # Add the file handler to the root logger
        root_logger.addHandler(file_handler)

        # --- Configure Loggers for specific libraries (Optional) ---
        # You might want to set different levels for noisy libraries
        # logging.getLogger("uvicorn").setLevel(logging.INFO)
        # logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING) # Avoid noisy SQL logs

        print(
            f"Logging configured. Minimum level: {LOG_LEVEL}. Log file: {log_file_path}"
        )


# Example of how to get a logger in another module
# logger = logging.getLogger(__name__)
# logger.info("This is an info message from the module.")
