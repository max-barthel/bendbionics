"""
Simple error tracking for the BendBionics platform
"""

import traceback
from typing import Any, Dict, Optional

from app.utils.logging import logger


def log_error(
    error: Exception,
    context: Optional[str] = None,
    extra_data: Optional[Dict[str, Any]] = None,
) -> None:
    """Log errors with context and optional extra data."""
    error_info = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "context": context,
        "traceback": traceback.format_exc(),
    }

    if extra_data:
        error_info.update(extra_data)

    logger.error(f"Error in {context or 'unknown'}: {error}", extra=error_info)


def log_api_error(
    error: Exception,
    endpoint: str,
    user_id: Optional[str] = None,
) -> None:
    """Log API errors with endpoint context."""
    extra_data = {"endpoint": endpoint}
    if user_id:
        extra_data["user_id"] = user_id

    log_error(error, f"API endpoint {endpoint}", extra_data)
