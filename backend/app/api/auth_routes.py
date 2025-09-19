from datetime import timedelta

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials
from sqlmodel import Session, select

from app.api.responses import (AuthenticationError, ValidationError,
                               created_response, success_response)
from app.auth import (authenticate_user, create_access_token, get_current_user,
                      get_password_hash, security)
from app.config import settings
from app.database import get_session
from app.models import User, UserCreate, UserLogin, UserResponse

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

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        username=user_data.username,
        hashed_password=hashed_password,
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    user_response = UserResponse(
        id=user.id,
        username=user.username,
        is_active=user.is_active,
        created_at=user.created_at,
    )

    return created_response(
        data=user_response.model_dump(mode="json"),
        message="User registered successfully",
    )


@router.post("/login")
async def login(user_data: UserLogin, session: Session = Depends(get_session)):
    """Login user and return access token with user data"""
    user = authenticate_user(session, user_data.username, user_data.password)
    if not user:
        raise AuthenticationError("Incorrect username or password")

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
        is_active=current_user.is_active,
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
