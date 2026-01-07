import contextvars
import logging
import sys
from enum import Enum
from typing import Any, Dict, Optional

from app.config import Settings

# Context variables for request tracking
request_id_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "request_id", default=None
)
session_id_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "session_id", default=None
)
user_id_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("user_id", default=None)


class LogContext(str, Enum):
    """Logging context categories"""

    GENERAL = "general"
    API = "api"
    UI = "ui"
    PERFORMANCE = "performance"
    SECURITY = "security"


# Create logger instance
logger = logging.getLogger("bendbionics_api")


def setup_logging(settings: Optional[Settings] = None) -> None:
    """Setup logging configuration based on settings."""
    if settings is None:
        settings = Settings()

    # Configure logging level
    log_level = getattr(logging, settings.log_level.upper())

    # Create formatter
    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # Configure logger
    logger.setLevel(log_level)
    logger.addHandler(console_handler)

    # Prevent duplicate log messages
    logger.propagate = False


class LoggerWrapper:
    """Wrapper around standard logger with structured logging support"""

    def __init__(self, logger_instance: logging.Logger):
        self.logger = logger_instance

    def _format_message(
        self,
        context: LogContext,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        category: Optional[str] = None,
        event_type: Optional[str] = None,
    ) -> str:
        """Format log message with context information"""
        parts = [f"[{context.value.upper()}]"]
        if category:
            parts.append(f"[{category}]")
        if event_type:
            parts.append(f"[{event_type}]")
        parts.append(message)

        # Add context variables if available
        request_id = request_id_var.get()
        user_id = user_id_var.get()
        session_id = session_id_var.get()

        context_info = []
        if request_id:
            context_info.append(f"req_id={request_id}")
        if user_id:
            context_info.append(f"user_id={user_id}")
        if session_id:
            context_info.append(f"session_id={session_id}")

        if context_info:
            parts.append(f"({', '.join(context_info)})")

        formatted = " ".join(parts)

        # Add data if provided
        if data:
            formatted += f" | Data: {data}"

        return formatted

    def debug(
        self,
        context: LogContext,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        category: Optional[str] = None,
        event_type: Optional[str] = None,
    ) -> None:
        """Log debug message"""
        formatted = self._format_message(context, message, data, category, event_type)
        self.logger.debug(formatted, extra={"data": data or {}})

    def info(
        self,
        context: LogContext,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        category: Optional[str] = None,
        event_type: Optional[str] = None,
    ) -> None:
        """Log info message"""
        formatted = self._format_message(context, message, data, category, event_type)
        self.logger.info(formatted, extra={"data": data or {}})

    def warning(
        self,
        context: LogContext,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        category: Optional[str] = None,
        event_type: Optional[str] = None,
    ) -> None:
        """Log warning message"""
        formatted = self._format_message(context, message, data, category, event_type)
        self.logger.warning(formatted, extra={"data": data or {}})

    def error(
        self,
        context: LogContext,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        category: Optional[str] = None,
        event_type: Optional[str] = None,
    ) -> None:
        """Log error message"""
        formatted = self._format_message(context, message, data, category, event_type)
        self.logger.error(formatted, extra={"data": data or {}})

    def security_event(
        self,
        event_type: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log security event"""
        self.warning(
            LogContext.SECURITY,
            message,
            data,
            category="Security",
            event_type=event_type,
        )


# Initialize logging with default settings
setup_logging()

# Create default logger wrapper
default_logger = LoggerWrapper(logger)
