"""Token service for managing verification and reset tokens."""

import secrets
from datetime import datetime, timedelta
from typing import Literal, Optional

from app.config import settings
from app.utils.timezone import now_utc, now_utc_naive


def generate_verification_token() -> str:
    """Generate a new email verification token."""
    return secrets.token_urlsafe(32)


def generate_password_reset_token() -> str:
    """Generate a new password reset token."""
    return secrets.token_urlsafe(32)


def get_token_expiry(hours: int) -> datetime:
    """Get token expiry datetime.

    Args:
        hours: Hours until token expires

    Returns:
        Timezone-naive datetime (for database compatibility)
    """
    return (now_utc() + timedelta(hours=hours)).replace(tzinfo=None)


def is_token_expired(expires: Optional[datetime]) -> bool:
    """Check if a token has expired.

    Args:
        expires: Token expiry datetime (can be timezone-aware or naive)

    Returns:
        True if expired or None, False if still valid
    """
    if expires is None:
        return True

    # Handle both timezone-aware and naive datetimes
    if expires.tzinfo is not None:
        expires = expires.replace(tzinfo=None)

    return now_utc_naive() > expires


def validate_and_get_token_expiry(
    token_type: Literal["verification", "reset"] = "verification",  # noqa: S107
) -> datetime:
    """Get token expiry based on token type.

    Args:
        token_type: Type of token ('verification' or 'reset')

    Returns:
        Token expiry datetime
    """
    if token_type == "reset":
        return get_token_expiry(settings.password_reset_token_expire_hours)
    return get_token_expiry(settings.email_verification_token_expire_hours)
