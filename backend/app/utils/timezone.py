"""
Simple timezone utilities for the BendBionics platform
"""

from datetime import datetime
from zoneinfo import ZoneInfo


def now_utc() -> datetime:
    """Get current datetime in UTC."""
    return datetime.now(ZoneInfo("UTC"))
