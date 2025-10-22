"""
Simple performance monitoring for the BendBionics platform
"""

import time
from functools import wraps
from typing import Any, Callable

from app.utils.logging import logger


def time_function(func: Callable) -> Callable:
    """Simple decorator to time function execution."""

    @wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        start_time = time.time()
        result = func(*args, **kwargs)
        execution_time = time.time() - start_time

        if execution_time > 1.0:  # Log slow functions (>1 second)
            logger.warning(f"Slow function {func.__name__}: {execution_time:.2f}s")

        return result

    return wrapper


def log_performance(operation: str, duration: float) -> None:
    """Log performance metrics for operations."""
    if duration > 1.0:
        logger.warning(f"Slow operation '{operation}': {duration:.2f}s")
    else:
        logger.info(f"Operation '{operation}': {duration:.2f}s")
