from datetime import timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session, select

from app.config import settings
from app.database import get_session
from app.models import TokenData, User
from app.utils.timezone import now_utc

# Password hashing - use pbkdf2_sha256 for testing to avoid bcrypt issues
# This is more reliable for testing environments
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto",
    pbkdf2_sha256__default_rounds=100000,  # Standard rounds for testing
    pbkdf2_sha256__min_rounds=100000,
    pbkdf2_sha256__max_rounds=100000
)

# JWT token security
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash with bcrypt 72-byte limit handling"""
    # bcrypt has a 72-byte limit, so we truncate if necessary
    if len(plain_password.encode("utf-8")) > 72:
        # Truncate to 72 bytes, but be careful with UTF-8 encoding
        password_bytes = plain_password.encode("utf-8")[:72]
        # Decode back to string, handling potential incomplete UTF-8 sequences
        plain_password = password_bytes.decode("utf-8", errors="ignore")
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password with bcrypt 72-byte limit handling"""
    # bcrypt has a 72-byte limit, so we truncate if necessary
    if len(password.encode("utf-8")) > 72:
        # Truncate to 72 bytes, but be careful with UTF-8 encoding
        password_bytes = password.encode("utf-8")[:72]
        # Decode back to string, handling potential incomplete UTF-8 sequences
        password = password_bytes.decode("utf-8", errors="ignore")

    # Use a more robust approach to avoid bcrypt initialization issues
    try:
        return pwd_context.hash(password)
    except ValueError as e:
        if "password cannot be longer than 72 bytes" in str(e):
            # If still too long, truncate more aggressively
            password = password[:50]  # Safe truncation
            return pwd_context.hash(password)
        raise


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = now_utc() + expires_delta
    else:
        expire = now_utc() + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def verify_token(token: str) -> Optional[TokenData]:
    """Verify JWT token and return token data"""
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        username: str = payload.get("sub")
        if username is None:
            return None
        return TokenData(username=username)
    except JWTError:
        return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials,
    session: Session = Depends(get_session),
) -> User:
    """Get current user from JWT token"""
    token = credentials.credentials
    token_data = verify_token(token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = session.exec(
        select(User).where(User.username == token_data.username)
    ).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def authenticate_user(session: Session, username: str, password: str) -> Optional[User]:
    """Authenticate user with username and password"""
    user = session.exec(select(User).where(User.username == username)).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
