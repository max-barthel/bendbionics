from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .preset import Preset


class UserBase(SQLModel):
    username: str = Field(unique=True, index=True)
    email: Optional[EmailStr] = Field(default=None, unique=True, index=True)
    # Local users don't need email verification
    is_local: bool = Field(default=True)


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    presets: List["Preset"] = Relationship(back_populates="user")


class UserCreate(SQLModel):
    username: str
    password: str
    email: Optional[EmailStr] = None


class UserLogin(SQLModel):
    username: str
    password: str


class UserResponse(SQLModel):
    id: int
    username: str
    email: Optional[EmailStr] = None
    is_local: bool
    created_at: datetime


class Token(SQLModel):
    access_token: str
    token_type: str


class TokenData(SQLModel):
    username: Optional[str] = None
