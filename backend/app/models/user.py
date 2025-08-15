from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .preset import Preset


class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True)
    is_active: bool = Field(default=False)
    is_verified: bool = Field(default=False)


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    presets: List["Preset"] = Relationship(back_populates="user")


class UserCreate(SQLModel):
    email: EmailStr
    password: str


class UserLogin(SQLModel):
    email: EmailStr
    password: str


class UserResponse(SQLModel):
    id: int
    email: EmailStr
    is_active: bool
    is_verified: bool
    created_at: datetime


class Token(SQLModel):
    access_token: str
    token_type: str


class TokenData(SQLModel):
    email: Optional[str] = None
