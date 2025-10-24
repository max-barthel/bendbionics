import logging
import sys
from typing import Optional

from app.config import Settings

# Create logger instance
logger = logging.getLogger("bendbionics_api")


def setup_logging(settings: Optional[Settings] = None) -> None:
    """Setup logging configuration based on settings."""
    if settings is None:
        settings = Settings()

    # Configure logging level
    log_level = getattr(logging, settings.log_level.upper())

    # Create formatter
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # Configure logger
    logger.setLevel(log_level)
    logger.addHandler(console_handler)

    # Prevent duplicate log messages
    logger.propagate = False


# Initialize logging with default settings
setup_logging()
