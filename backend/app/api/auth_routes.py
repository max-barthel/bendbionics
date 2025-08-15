from datetime import timedelta

from app.auth import (
    authenticate_user,
    create_access_token,
    create_verification_token,
    get_current_user,
    get_password_hash,
    security,
    verify_token,
)
from app.config import settings
from app.database import get_session
from app.email import send_verification_email
from app.models import Token, User, UserCreate, UserLogin, UserResponse
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlmodel import Session, select

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate, session: Session = Depends(get_session)
):
    """Register a new user"""
    # Check if user already exists
    existing_user = session.exec(
        select(User).where(User.email == user_data.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        is_active=True,  # Auto-activate if email not configured
        is_verified=True,  # Auto-verify if email not configured
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    # Send verification email only if email is configured
    if settings.mail_username and settings.mail_password:
        try:
            verification_token = create_verification_token(user.email)
            email_sent = await send_verification_email(
                user.email, verification_token
            )
            if email_sent:
                # Set user as unverified until email is confirmed
                user.is_verified = False
                user.is_active = False
                session.add(user)
                session.commit()
                print("Email verification sent - user set to inactive")
            else:
                print("Email failed to send - keeping user active")
        except Exception as e:
            print(f"Email sending failed: {e}")
            # If email fails, keep user active for testing
            print("Keeping user active due to email failure")
    else:
        print("Email not configured - user kept active")

    return UserResponse(
        id=user.id,
        email=user.email,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
    )


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, session: Session = Depends(get_session)):
    """Login user and return access token"""
    user = authenticate_user(session, user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is not active",
        )

    access_token_expires = timedelta(
        minutes=settings.access_token_expire_minutes
    )
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/verify-email")
async def verify_email(token: str, session: Session = Depends(get_session)):
    """Verify user email with token"""
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token",
        )

    user = session.exec(
        select(User).where(User.email == token_data.email)
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    user.is_verified = True
    user.is_active = True
    session.add(user)
    session.commit()

    return {"message": "Email verified successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
):
    """Get current user information"""
    current_user = get_current_user(session, credentials)
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
    )


@router.post("/create-admin")
async def create_admin_user(
    admin_data: UserCreate, session: Session = Depends(get_session)
):
    """Create an admin user (for testing purposes)"""
    # Check if user already exists
    existing_user = session.exec(
        select(User).where(User.email == admin_data.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create admin user
    hashed_password = get_password_hash(admin_data.password)
    admin_user = User(
        email=admin_data.email,
        hashed_password=hashed_password,
        is_active=True,
        is_verified=True,
    )

    session.add(admin_user)
    session.commit()
    session.refresh(admin_user)

    return UserResponse(
        id=admin_user.id,
        email=admin_user.email,
        is_active=admin_user.is_active,
        is_verified=admin_user.is_verified,
        created_at=admin_user.created_at,
    )


@router.post("/verify-user-dev")
async def verify_user_dev(
    email_data: dict, session: Session = Depends(get_session)
):
    """Manually verify a user for development (when email is not configured)"""
    email = email_data.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email is required"
        )

    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    user.is_verified = True
    user.is_active = True
    session.add(user)
    session.commit()

    return {"message": f"User {email} verified successfully"}
