"""
Centralized timezone handling for the Soft Robot App.
Uses Berlin timezone with automatic DST handling.
"""

from datetime import datetime
from zoneinfo import ZoneInfo

# Berlin timezone with automatic DST handling
BERLIN_TZ = ZoneInfo("Europe/Berlin")


def now_berlin() -> datetime:
    """Get current datetime in Berlin timezone."""
    return datetime.now(BERLIN_TZ)


def utc_to_berlin(utc_dt: datetime) -> datetime:
    """Convert UTC datetime to Berlin timezone."""
    return utc_dt.replace(tzinfo=ZoneInfo("UTC")).astimezone(BERLIN_TZ)


def berlin_to_utc(berlin_dt: datetime) -> datetime:
    """Convert Berlin datetime to UTC."""
    return berlin_dt.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)


def now_utc() -> datetime:
    """Get current datetime in UTC (for compatibility)."""
    return datetime.now(ZoneInfo("UTC"))


# For backward compatibility, provide the old UTC function
def utcnow() -> datetime:
    """Deprecated: Use now_utc() instead."""
    return now_utc()
