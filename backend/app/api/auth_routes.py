from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
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
        to_email=user_data.email,
        username=user_data.username,
        token=verification_token
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
        message = "User registered successfully. Please check your email to verify your account."
    else:
        message = "User registered successfully. Check the server logs for your verification link."

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


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
):
    """Get current user information"""
    current_user = get_current_user(credentials, session)
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        is_active=current_user.is_active,
        email_verified=current_user.email_verified,
        created_at=current_user.created_at,
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
        if not verify_password(user_data.current_password, current_user.hashed_password):
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
            token=verification_token
        )

    # Update password if provided
    if user_data.new_password:
        current_user.hashed_password = get_password_hash(user_data.new_password)

    # Update timestamp
    current_user.updated_at = now_utc()

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

    return {"message": "Account deleted successfully"}


@router.post("/verify-email")
async def verify_email(token: str, session: Session = Depends(get_session)):
    """Verify user email with token"""
    user = session.exec(
        select(User).where(User.email_verification_token == token)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )

    if is_token_expired(user.email_verification_token_expires):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired"
        )

    # Mark email as verified
    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_token_expires = None
    user.updated_at = now_utc()

    session.add(user)
    session.commit()

    return success_response(
        data={"email_verified": True},
        message="Email verified successfully"
    )


@router.post("/resend-verification")
async def resend_verification(request: EmailVerificationRequest, session: Session = Depends(get_session)):
    """Resend email verification"""
    user = session.exec(
        select(User).where(User.email == request.email)
    ).first()

    if not user:
        # Don't reveal if email exists or not
        return success_response(
            data={},
            message="If the email exists, a verification email has been sent"
        )

    if user.email_verified:
        return success_response(
            data={},
            message="Email is already verified"
        )

    # Generate new verification token
    verification_token = generate_verification_token()
    token_expires = get_token_expiry(settings.email_verification_token_expire_hours)

    user.email_verification_token = verification_token
    user.email_verification_token_expires = token_expires
    user.updated_at = now_utc()

    session.add(user)
    session.commit()

    # Send verification email (logs to console in dev mode)
    await email_service.send_verification_email(
        to_email=user.email,
        username=user.username,
        token=verification_token
    )

    return success_response(
        data={},
        message="Verification email sent"
    )


@router.post("/request-password-reset")
async def request_password_reset(request: PasswordResetRequest, session: Session = Depends(get_session)):
    """Request password reset"""
    user = session.exec(
        select(User).where(User.email == request.email)
    ).first()

    if not user:
        # Don't reveal if email exists or not
        return success_response(
            data={},
            message="If the email exists, a password reset email has been sent"
        )

    # Generate password reset token
    reset_token = generate_password_reset_token()
    token_expires = get_token_expiry(settings.password_reset_token_expire_hours)

    user.password_reset_token = reset_token
    user.password_reset_token_expires = token_expires
    user.updated_at = now_utc()

    session.add(user)
    session.commit()

    # Send password reset email
    await email_service.send_password_reset_email(
        to_email=user.email,
        username=user.username,
        token=reset_token
    )

    return success_response(
        data={},
        message="Password reset email sent"
    )


@router.post("/reset-password")
async def reset_password(request: PasswordResetConfirm, session: Session = Depends(get_session)):
    """Reset password with token"""
    user = session.exec(
        select(User).where(User.password_reset_token == request.token)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )

    if is_token_expired(user.password_reset_token_expires):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )

    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    user.password_reset_token = None
    user.password_reset_token_expires = None
    user.updated_at = now_utc()

    session.add(user)
    session.commit()

    return success_response(
        data={},
        message="Password reset successfully"
    )
