"""
Simple timezone utilities for the BendBionics platform
"""

from datetime import UTC, datetime


def now_utc() -> datetime:
    """Get current datetime in UTC."""
    return datetime.now(UTC)
