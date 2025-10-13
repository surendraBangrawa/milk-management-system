import logging
import sys


# Hardcoded values for logging configuration
LOG_LEVEL = "INFO"  # Set the log level (e.g., "INFO", "DEBUG", "WARNING")


def configure_logging():
    """
    Configures the central logger for the application.
    Sets up console handler to stdout (no file logging).
    """
    # Get the root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(LOG_LEVEL)  # Set the overall minimum log level

    # Always ensure a stdout console handler exists; avoid duplicates
    has_stdout_handler = any(
        isinstance(h, logging.StreamHandler)
        and getattr(h, "stream", None) is sys.stdout
        for h in root_logger.handlers
    )

    if not has_stdout_handler:
        console_handler = logging.StreamHandler(sys.stdout)
        console_formatter = logging.Formatter(
            "%(levelname)s | %(asctime)s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S %Z",
        )
        console_handler.setFormatter(console_formatter)
        console_handler.setLevel(logging.DEBUG)
        root_logger.addHandler(console_handler)

    # Intentionally no file handler; logs go to stdout for platforms like Render
