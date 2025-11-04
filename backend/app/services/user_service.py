"""User service for user-related database operations."""

from typing import Optional

from sqlmodel import Session, select

from app.models.user import User, UserResponse, UserUpdate
from app.services.preset_service import get_user_presets


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


def user_to_response(user: User) -> UserResponse:
    """Convert User model to UserResponse DTO."""
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        is_active=user.is_active,
        email_verified=user.email_verified,
        created_at=user.created_at,
    )


def delete_user_account(session: Session, user: User) -> None:
    """Delete user account and all associated presets.

    Args:
        session: Database session
        user: User to delete
    """
    # Delete all presets associated with the user
    user_presets = get_user_presets(session, user.id)
    for preset in user_presets:
        session.delete(preset)

    # Delete the user account
    session.delete(user)
    session.commit()


def verify_user_email(session: Session, token: str) -> User:
    """Verify user email with token.

    Args:
        session: Database session
        token: Email verification token

    Returns:
        User with verified email

    Raises:
        ValidationError: If token is invalid or expired
    """
    from app.services.db_helpers import save_and_refresh
    from app.services.token_service import is_token_expired
    from app.utils.timezone import now_utc_naive

    user = get_user_by_verification_token(session, token)
    if not user:
        from app.api.responses import ValidationError

        raise ValidationError(message="Invalid verification token")

    if is_token_expired(user.email_verification_token_expires):
        from app.api.responses import ValidationError

        raise ValidationError(message="Verification token has expired")

    # Mark email as verified
    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_token_expires = None
    user.updated_at = now_utc_naive()

    return save_and_refresh(session, user)


def update_user_profile(
    session: Session,
    user: User,
    update_data: UserUpdate,
    verify_password_func,
    get_password_hash_func,
    generate_verification_token_func,
    validate_and_get_token_expiry_func,
) -> tuple[User, str | None]:
    """Update user profile (username, email, password).

    Args:
        session: Database session
        user: User to update
        update_data: Update data
        verify_password_func: Function to verify password
        get_password_hash_func: Function to hash password
        generate_verification_token_func: Function to generate verification token
        validate_and_get_token_expiry_func: Function to get token expiry

    Returns:
        Tuple of (updated user, verification_token if email was changed, None otherwise)

    Raises:
        ValidationError: If validation fails
        AuthenticationError: If authentication fails
    """
    from app.api.responses import AuthenticationError, ValidationError
    from app.services.db_helpers import save_and_refresh
    from app.utils.timezone import now_utc_naive

    verification_token = None

    # If changing password or sensitive info, require current password
    if update_data.new_password or update_data.username or update_data.email:
        if not update_data.current_password:
            raise ValidationError(
                message="Current password required to update profile",
                details={"field": "current_password"},
            )

        # Verify current password
        if not verify_password_func(update_data.current_password, user.hashed_password):
            raise AuthenticationError(message="Current password is incorrect")

    # Update username if provided
    if update_data.username and update_data.username != user.username:
        # Check if username is already taken
        if not check_username_available(session, update_data.username, user.id):
            raise ValidationError(
                message="Username already taken",
                details={"field": "username", "value": update_data.username},
            )
        user.username = update_data.username

    # Update email if provided
    if update_data.email and update_data.email != user.email:
        # Check if email is already registered
        if not check_email_available(session, update_data.email, user.id):
            raise ValidationError(
                message="Email already registered",
                details={"field": "email", "value": update_data.email},
            )
        user.email = update_data.email
        # Reset email verification when email changes
        user.email_verified = False

        # Generate new verification token
        verification_token = generate_verification_token_func()
        token_expires = validate_and_get_token_expiry_func("verification")
        user.email_verification_token = verification_token
        user.email_verification_token_expires = token_expires

    # Update password if provided
    if update_data.new_password:
        user.hashed_password = get_password_hash_func(update_data.new_password)

    # Update timestamp
    user.updated_at = now_utc_naive()

    updated_user = save_and_refresh(session, user)
    return (updated_user, verification_token)
