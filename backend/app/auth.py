from datetime import timedelta
from typing import Optional

import bcrypt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session

from app.api.responses import AuthenticationError
from app.config import settings
from app.database import get_session
from app.models import TokenData, User
from app.services.user_service import get_user_by_username
from app.utils.timezone import now_utc

# Password hashing - support both bcrypt and pbkdf2_sha256 for compatibility
# bcrypt is used for existing users, pbkdf2_sha256 for new users
pwd_context = CryptContext(
    schemes=["bcrypt", "pbkdf2_sha256"],
    deprecated="auto",
    pbkdf2_sha256__default_rounds=100000,  # Standard rounds for testing
    pbkdf2_sha256__min_rounds=100000,
    pbkdf2_sha256__max_rounds=100000,
)

# JWT token security
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash.

    Supports both pbkdf2_sha256 (new users) and bcrypt (legacy users)
    via CryptContext, with fallback to direct bcrypt for compatibility.
    """
    # Try CryptContext first (handles both schemes)
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        pass

    # Fallback to direct bcrypt for legacy bcrypt hashes
    if hashed_password.startswith("$2b$"):
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except Exception:
            pass

    return False


def get_password_hash(password: str) -> str:
    """Hash a password using pbkdf2_sha256 (via CryptContext).

    New passwords use pbkdf2_sha256. Falls back to bcrypt if CryptContext fails.
    """
    try:
        return pwd_context.hash(password)
    except Exception:
        # Fallback to direct bcrypt hashing if CryptContext fails
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = now_utc() + expires_delta
    else:
        expire = now_utc() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def verify_token(token: str) -> Optional[TokenData]:
    """Verify JWT token and return token data"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            return None
        return TokenData(username=username)
    except JWTError:
        return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
) -> User:
    """Get current user from JWT token.

    Can be used directly as a dependency:
    `current_user: User = Depends(get_current_user)`
    """
    token = credentials.credentials
    token_data = verify_token(token)
    if token_data is None:
        raise AuthenticationError(message="Could not validate credentials")

    user = get_user_by_username(session, token_data.username)
    if user is None:
        raise AuthenticationError(message="User not found")

    return user


def authenticate_user(session: Session, username: str, password: str) -> Optional[User]:
    """Authenticate user with username and password"""
    user = get_user_by_username(session, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
