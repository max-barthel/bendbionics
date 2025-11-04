"""
Simple timezone utilities for the BendBionics platform
"""

from datetime import UTC, datetime


def now_utc() -> datetime:
    """Get current datetime in UTC (timezone-aware)."""
    return datetime.now(UTC)


def now_utc_naive() -> datetime:
    """Get current datetime in UTC (timezone-naive).

    Use this only when timezone-naive datetimes are required for compatibility
    with existing database models. Prefer now_utc() for new code.
    """
    return datetime.now(UTC).replace(tzinfo=None)
