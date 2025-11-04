"""User service for user-related database operations."""

from typing import Optional

from sqlmodel import Session, select

from app.models.user import User


def get_user_by_username(session: Session, username: str) -> Optional[User]:
    """Get user by username."""
    return session.exec(select(User).where(User.username == username)).first()


def get_user_by_email(session: Session, email: str) -> Optional[User]:
    """Get user by email."""
    return session.exec(select(User).where(User.email == email)).first()


def get_user_by_id(session: Session, user_id: int) -> Optional[User]:
    """Get user by ID."""
    return session.get(User, user_id)


def check_username_available(
    session: Session, username: str, exclude_user_id: Optional[int] = None
) -> bool:
    """Check if username is available.

    Args:
        session: Database session
        username: Username to check
        exclude_user_id: User ID to exclude from check (for updates)

    Returns:
        True if username is available, False otherwise
    """
    query = select(User).where(User.username == username)
    if exclude_user_id:
        query = query.where(User.id != exclude_user_id)
    existing = session.exec(query).first()
    return existing is None


def check_email_available(
    session: Session, email: str, exclude_user_id: Optional[int] = None
) -> bool:
    """Check if email is available.

    Args:
        session: Database session
        email: Email to check
        exclude_user_id: User ID to exclude from check (for updates)

    Returns:
        True if email is available, False otherwise
    """
    query = select(User).where(User.email == email)
    if exclude_user_id:
        query = query.where(User.id != exclude_user_id)
    existing = session.exec(query).first()
    return existing is None


def get_user_by_verification_token(session: Session, token: str) -> Optional[User]:
    """Get user by email verification token."""
    return session.exec(
        select(User).where(User.email_verification_token == token)
    ).first()


def get_user_by_reset_token(session: Session, token: str) -> Optional[User]:
    """Get user by password reset token."""
    return session.exec(select(User).where(User.password_reset_token == token)).first()
