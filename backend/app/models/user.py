from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlmodel import Field, Relationship, SQLModel

from app.utils.timezone import now_utc

if TYPE_CHECKING:
    from .preset import Preset


class UserBase(SQLModel):
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    is_active: bool = Field(default=True)


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    email_verified: bool = Field(default=False)
    email_verification_token: Optional[str] = Field(default=None, index=True)
    email_verification_token_expires: Optional[datetime] = Field(default=None)
    password_reset_token: Optional[str] = Field(default=None, index=True)
    password_reset_token_expires: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

    # Relationships
    presets: List["Preset"] = Relationship(back_populates="user")


class UserCreate(SQLModel):
    username: str
    email: str
    password: str


class UserLogin(SQLModel):
    username: str
    password: str


class UserResponse(SQLModel):
    id: int
    username: str
    email: str
    is_active: bool
    email_verified: bool
    created_at: datetime


class EmailVerificationRequest(SQLModel):
    email: str


class PasswordResetRequest(SQLModel):
    email: str


class PasswordResetConfirm(SQLModel):
    token: str
    new_password: str


class UserUpdate(SQLModel):
    username: Optional[str] = None
    email: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class Token(SQLModel):
    access_token: str
    token_type: str


class TokenData(SQLModel):
    username: Optional[str] = None
