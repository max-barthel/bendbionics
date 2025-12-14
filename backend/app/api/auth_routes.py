from datetime import timedelta

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.api.responses import (
    AuthenticationError,
    AuthorizationError,
    ValidationError,
    created_response,
    success_response,
)
from app.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_password_hash,
)
from app.config import settings
from app.database import get_session
from app.models import (
    EmailVerificationRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    User,
    UserCreate,
    UserLogin,
    UserUpdate,
)
from app.services.db_helpers import save_and_refresh
from app.services.token_service import (
    TokenType,
    generate_password_reset_token,
    generate_verification_token,
    is_token_expired,
    validate_and_get_token_expiry,
)
from app.services.user_service import (
    check_email_available,
    check_username_available,
    delete_user_account,
    get_user_by_email,
    get_user_by_reset_token,
    user_to_response,
    verify_user_email,
)
from app.services.user_service import (
    update_user_profile as update_user_profile_service,
)
from app.utils.email import email_service
from app.utils.logging import LogContext, default_logger
from app.utils.timezone import now_utc, now_utc_naive

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register")
async def register(user_data: UserCreate, session: Session = Depends(get_session)):
    """Register a new user"""
    # Check if username already exists
    if not check_username_available(session, user_data.username):
        raise ValidationError(
            message="Username already taken",
            details={"field": "username", "value": user_data.username},
        )

    # Check if email already exists
    if not check_email_available(session, user_data.email):
        raise ValidationError(
            message="Email already registered",
            details={"field": "email", "value": user_data.email},
        )

    # Generate verification token
    verification_token = generate_verification_token()
    token_expires = validate_and_get_token_expiry(TokenType.VERIFICATION)

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        email_verification_token=verification_token,
        email_verification_token_expires=token_expires,
    )

    save_and_refresh(session, user)

    # Send verification email (logs to console in dev mode)
    await email_service.send_verification_email(
        to_email=user_data.email, username=user_data.username, token=verification_token
    )

    user_response = user_to_response(user)

    if settings.email_verification_enabled:
        message = (
            "User registered successfully. Please check your email to verify your "
            "account."
        )
    else:
        message = (
            "User registered successfully. Check the server logs for your verification "
            "link."
        )

    return created_response(
        data=user_response,
        message=message,
    )


@router.post("/login")
async def login(user_data: UserLogin, session: Session = Depends(get_session)):
    """Login user and return access token with user data"""
    user = authenticate_user(session, user_data.username, user_data.password)
    if not user:
        msg = "Incorrect username or password"
        raise AuthenticationError(msg)

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    login_data = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "created_at": user.created_at.isoformat(),
        },
    }

    return success_response(data=login_data, message="Login successful")


@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user),  # NOSONAR
):
    """Get current user information"""
    user_response = user_to_response(current_user)

    return success_response(
        data=user_response,
        message="User information retrieved successfully",
    )


@router.put("/me")
async def update_user_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),  # NOSONAR
    session: Session = Depends(get_session),  # NOSONAR
):
    """Update user profile (username, email, password)"""
    from app.auth import get_password_hash, verify_password

    # Update user profile using service
    updated_user, verification_token = update_user_profile_service(
        session=session,
        user=current_user,
        update_data=user_data,
        verify_password_func=verify_password,
        get_password_hash_func=get_password_hash,
        generate_verification_token_func=generate_verification_token,
        validate_and_get_token_expiry_func=validate_and_get_token_expiry,
    )

    # Send verification email if email was changed
    if verification_token:
        await email_service.send_verification_email(
            to_email=updated_user.email,
            username=updated_user.username,
            token=verification_token,
        )

    user_response = user_to_response(updated_user)

    return success_response(
        data=user_response,
        message="Profile updated successfully",
    )


@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user),  # NOSONAR
    session: Session = Depends(get_session),  # NOSONAR
):
    """Delete the current user's account and all associated data"""
    delete_user_account(session, current_user)

    return success_response(message="Account deleted successfully")


@router.post("/verify-email")
async def verify_email(
    token: str = Query(..., description="Email verification token"),
    session: Session = Depends(get_session),
):
    """Verify user email with token"""
    default_logger.info(
        LogContext.API,
        f"verify_email called with token: {token[:10]}...",
        {},
        "API",
        "email_verification",
    )

    try:
        user = verify_user_email(session, token)
        default_logger.info(
            LogContext.API,
            f"Email verified for user: {user.username}",
            {"username": user.username},
            "API",
            "email_verification",
        )
    except ValidationError as e:
        default_logger.info(
            LogContext.API,
            f"Email verification failed: {e.message}",
            {"error": str(e)},
            "API",
            "email_verification",
        )
        raise

    return success_response(
        data={"email_verified": True}, message="Email verified successfully"
    )


@router.post("/resend-verification")
async def resend_verification(
    request: EmailVerificationRequest, session: Session = Depends(get_session)
):
    """Resend email verification"""
    user = get_user_by_email(session, request.email)

    if not user:
        # Don't reveal if email exists or not
        return success_response(
            data={}, message="If the email exists, a verification email has been sent"
        )

    if user.email_verified:
        return success_response(data={}, message="Email is already verified")

    # Generate new verification token
    verification_token = generate_verification_token()
    token_expires = validate_and_get_token_expiry(TokenType.VERIFICATION)

    user.email_verification_token = verification_token
    user.email_verification_token_expires = token_expires
    user.updated_at = now_utc_naive()

    save_and_refresh(session, user)

    # Send verification email (logs to console in dev mode)
    await email_service.send_verification_email(
        to_email=user.email, username=user.username, token=verification_token
    )

    return success_response(data={}, message="Verification email sent")


@router.post("/request-password-reset")
async def request_password_reset(
    request: PasswordResetRequest, session: Session = Depends(get_session)
):
    """Request password reset"""
    user = get_user_by_email(session, request.email)

    if not user:
        # Don't reveal if email exists or not
        return success_response(
            data={}, message="If the email exists, a password reset email has been sent"
        )

    # Generate password reset token
    reset_token = generate_password_reset_token()
    token_expires = validate_and_get_token_expiry(TokenType.RESET)

    user.password_reset_token = reset_token
    user.password_reset_token_expires = token_expires
    user.updated_at = now_utc_naive()

    save_and_refresh(session, user)

    # Send password reset email
    await email_service.send_password_reset_email(
        to_email=user.email, username=user.username, token=reset_token
    )

    return success_response(data={}, message="Password reset email sent")


@router.post("/reset-password")
async def reset_password(
    request: PasswordResetConfirm, session: Session = Depends(get_session)
):
    """Reset password with token"""
    user = get_user_by_reset_token(session, request.token)

    if not user:
        raise ValidationError(message="Invalid reset token")

    if is_token_expired(user.password_reset_token_expires):
        raise ValidationError(message="Reset token has expired")

    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    user.password_reset_token = None
    user.password_reset_token_expires = None
    user.updated_at = now_utc_naive()

    save_and_refresh(session, user)

    return success_response(data={}, message="Password reset successfully")


@router.post("/debug/test-email")
async def debug_email_sending(to_email: str, session: Session = Depends(get_session)):
    """Debug endpoint to test email sending (development only)

    This endpoint is safe for public repositories as it's protected by the
    settings.debug check and will only function in development mode.
    In production (debug=False), it returns an authorization error.
    """
    # Only allow in development mode
    if settings.debug:
        default_logger.info(
            LogContext.API,
            f"Testing email sending to: {to_email}",
            {"to_email": to_email},
            "API",
            "debug_email",
        )

        # Test sending a simple email
        success = await email_service.send_email(
            to_email=to_email,
            subject="BendBionics Test Email",
            html_content=f"""
            <h2>Test Email from BendBionics</h2>
            <p>This is a test email to verify Mailgun configuration.</p>
            <p>If you receive this, email verification is working correctly!</p>
            <p><strong>Time:</strong> {now_utc().isoformat()}</p>
            """,
        )

        if success:
            return success_response(
                data={"email_sent": True, "to": to_email},
                message="Test email sent successfully",
            )
        return success_response(
            data={"email_sent": False, "to": to_email},
            message="Test email failed - check server logs for details",
        )
    raise AuthorizationError(
        message="Debug endpoint only available in development mode"
    )
