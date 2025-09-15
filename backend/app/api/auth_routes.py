from datetime import timedelta

from app.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_password_hash,
    security,
)
from app.config import settings
from app.database import get_session
from app.models import User, UserCreate, UserLogin, UserResponse
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlmodel import Session, select

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate, session: Session = Depends(get_session)
):
    """Register a new user"""
    # Check if username already exists
    existing_user = session.exec(
        select(User).where(User.username == user_data.username)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # Check if email is provided and already exists
    if user_data.email:
        existing_email = session.exec(
            select(User).where(User.email == user_data.email)
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        is_local=user_data.email is None,  # Local user if no email
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        is_local=user.is_local,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
    )


@router.post("/login", response_model=dict)
async def login(user_data: UserLogin, session: Session = Depends(get_session)):
    """Login user and return access token with user data"""
    user = authenticate_user(session, user_data.username, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(
        minutes=settings.access_token_expire_minutes
    )
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_local": user.is_local,
            "created_at": user.created_at.isoformat(),
        },
    }


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
        is_local=current_user.is_local,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
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
