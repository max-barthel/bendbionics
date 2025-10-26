from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlmodel import Session, select

from app.api.responses import (
    AuthenticationError,
    ValidationError,
    created_response,
    success_response,
)
from app.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_password_hash,
    security,
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
    UserResponse,
    UserUpdate,
)
from app.utils.email import (
    email_service,
    generate_password_reset_token,
    generate_verification_token,
    get_token_expiry,
    is_token_expired,
)
from app.utils.logging import logger
from app.utils.timezone import now_utc

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register")
async def register(user_data: UserCreate, session: Session = Depends(get_session)):
    """Register a new user"""
    # Check if username already exists
    existing_user = session.exec(
        select(User).where(User.username == user_data.username)
    ).first()
    if existing_user:
        raise ValidationError(
            message="Username already taken",
            details={"field": "username", "value": user_data.username},
        )

    # Check if email already exists
    existing_email = session.exec(
        select(User).where(User.email == user_data.email)
    ).first()
    if existing_email:
        raise ValidationError(
            message="Email already registered",
            details={"field": "email", "value": user_data.email},
        )

    # Generate verification token
    verification_token = generate_verification_token()
    token_expires = get_token_expiry(settings.email_verification_token_expire_hours)

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        email_verification_token=verification_token,
        email_verification_token_expires=token_expires,
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    # Send verification email (logs to console in dev mode)
    await email_service.send_verification_email(
        to_email=user_data.email, username=user_data.username, token=verification_token
    )

    user_response = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        is_active=user.is_active,
        email_verified=user.email_verified,
        created_at=user.created_at,
    )

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
        data=user_response.model_dump(mode="json"),
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
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
):
    """Get current user information"""
    current_user = get_current_user(credentials, session)
    user_response = UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        is_active=current_user.is_active,
        email_verified=current_user.email_verified,
        created_at=current_user.created_at,
    )

    return success_response(
        data=user_response.model_dump(mode="json"),
        message="User information retrieved successfully",
    )


@router.put("/me")
async def update_user_profile(
    user_data: UserUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
):
    """Update user profile (username, email, password)"""
    from app.auth import verify_password

    current_user = get_current_user(credentials, session)

    # If changing password or sensitive info, require current password
    if user_data.new_password or user_data.username or user_data.email:
        if not user_data.current_password:
            raise ValidationError(
                message="Current password required to update profile",
                details={"field": "current_password"},
            )

        # Verify current password
        if not verify_password(
            user_data.current_password, current_user.hashed_password
        ):
            raise AuthenticationError(message="Current password is incorrect")

    # Update username if provided
    if user_data.username and user_data.username != current_user.username:
        # Check if username is already taken
        existing_user = session.exec(
            select(User).where(User.username == user_data.username)
        ).first()
        if existing_user:
            raise ValidationError(
                message="Username already taken",
                details={"field": "username", "value": user_data.username},
            )
        current_user.username = user_data.username

    # Update email if provided
    if user_data.email and user_data.email != current_user.email:
        # Check if email is already registered
        existing_email = session.exec(
            select(User).where(User.email == user_data.email)
        ).first()
        if existing_email:
            raise ValidationError(
                message="Email already registered",
                details={"field": "email", "value": user_data.email},
            )
        current_user.email = user_data.email
        # Reset email verification when email changes
        current_user.email_verified = False

        # Generate new verification token
        verification_token = generate_verification_token()
        token_expires = get_token_expiry(settings.email_verification_token_expire_hours)
        current_user.email_verification_token = verification_token
        current_user.email_verification_token_expires = token_expires

        # Send verification email to new address
        await email_service.send_verification_email(
            to_email=user_data.email,
            username=current_user.username,
            token=verification_token,
        )

    # Update password if provided
    if user_data.new_password:
        current_user.hashed_password = get_password_hash(user_data.new_password)

    # Update timestamp
    current_user.updated_at = now_utc().replace(tzinfo=None)

    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    user_response = UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        is_active=current_user.is_active,
        email_verified=current_user.email_verified,
        created_at=current_user.created_at,
    )

    return success_response(
        data=user_response.model_dump(mode="json"),
        message="Profile updated successfully",
    )


@router.delete("/account")
async def delete_account(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
):
    """Delete the current user's account and all associated data"""
    current_user = get_current_user(credentials, session)

    # Delete all presets associated with the user
    from app.models import Preset

    user_presets = session.exec(
        select(Preset).where(Preset.user_id == current_user.id)
    ).all()

    for preset in user_presets:
        session.delete(preset)

    # Delete the user account
    session.delete(current_user)
    session.commit()

    return success_response(message="Account deleted successfully")


@router.post("/verify-email")
async def verify_email(
    token: str = Query(..., description="Email verification token"),
    session: Session = Depends(get_session),
):
    """Verify user email with token"""
    from app.utils.logging import logger

    logger.info(f"verify_email called with token: {token}")

    try:
        # Query user and convert timezone-aware datetimes to timezone-naive
        user = session.exec(
            select(User).where(User.email_verification_token == token)
        ).first()

        if user and user.email_verification_token_expires:
            # Convert timezone-aware datetime to timezone-naive if needed
            if user.email_verification_token_expires.tzinfo is not None:
                user.email_verification_token_expires = (
                    user.email_verification_token_expires.replace(tzinfo=None)
                )

        logger.info("Database query completed successfully")
    except Exception as e:
        logger.error(f"Database query failed: {e}")
        raise

    if not user:
        logger.info("User not found for token")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token"
        )

    logger.info(f"User found: {user.username}")
    logger.info(
        f"Token expires at: {user.email_verification_token_expires} (type: {type(user.email_verification_token_expires)})"
    )
    logger.info(
        f"Token expires tzinfo: {getattr(user.email_verification_token_expires, 'tzinfo', 'N/A')}"
    )

    # Ensure the token expiry is timezone-naive before checking
    token_expires = user.email_verification_token_expires
    if token_expires and token_expires.tzinfo is not None:
        token_expires = token_expires.replace(tzinfo=None)

    if is_token_expired(token_expires):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired",
        )

    # Mark email as verified
    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_token_expires = None
    user.updated_at = now_utc().replace(tzinfo=None)

    session.add(user)
    session.commit()

    return success_response(
        data={"email_verified": True}, message="Email verified successfully"
    )


@router.post("/resend-verification")
async def resend_verification(
    request: EmailVerificationRequest, session: Session = Depends(get_session)
):
    """Resend email verification"""
    user = session.exec(select(User).where(User.email == request.email)).first()

    if not user:
        # Don't reveal if email exists or not
        return success_response(
            data={}, message="If the email exists, a verification email has been sent"
        )

    if user.email_verified:
        return success_response(data={}, message="Email is already verified")

    # Generate new verification token
    verification_token = generate_verification_token()
    token_expires = get_token_expiry(settings.email_verification_token_expire_hours)

    user.email_verification_token = verification_token
    user.email_verification_token_expires = token_expires
    user.updated_at = now_utc().replace(tzinfo=None)

    session.add(user)
    session.commit()

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
    user = session.exec(select(User).where(User.email == request.email)).first()

    if not user:
        # Don't reveal if email exists or not
        return success_response(
            data={}, message="If the email exists, a password reset email has been sent"
        )

    # Generate password reset token
    reset_token = generate_password_reset_token()
    token_expires = get_token_expiry(settings.password_reset_token_expire_hours)

    user.password_reset_token = reset_token
    user.password_reset_token_expires = token_expires
    user.updated_at = now_utc().replace(tzinfo=None)

    session.add(user)
    session.commit()

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
    user = session.exec(
        select(User).where(User.password_reset_token == request.token)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token"
        )

    if is_token_expired(user.password_reset_token_expires):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token has expired"
        )

    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    user.password_reset_token = None
    user.password_reset_token_expires = None
    user.updated_at = now_utc().replace(tzinfo=None)

    session.add(user)
    session.commit()

    return success_response(data={}, message="Password reset successfully")


@router.post("/debug/test-email")
async def debug_email_sending(to_email: str, session: Session = Depends(get_session)):
    """Debug endpoint to test email sending (development only)"""
    # Only allow in development mode
    if settings.debug:
        logger.info(f"🧪 Testing email sending to: {to_email}")

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
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Debug endpoint only available in development mode",
    )
