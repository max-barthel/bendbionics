import json
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, Optional

from sqlalchemy import Column, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel

from app.utils.timezone import now_utc

if TYPE_CHECKING:
    from .user import User


class PresetBase(SQLModel):
    name: str = Field(index=True)
    description: Optional[str] = None
    is_public: bool = Field(default=False)
    # Metadata columns for querying
    segments: Optional[int] = Field(
        default=None, sa_column=Column(Integer, nullable=True, index=True)
    )
    tendon_count: Optional[int] = Field(
        default=None, sa_column=Column(Integer, nullable=True, index=True)
    )
    # Configuration stored as JSONB (PostgreSQL)
    configuration: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSONB(), nullable=False),
    )


class Preset(PresetBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

    # Foreign key to user
    user_id: int = Field(foreign_key="user.id")
    user: Optional["User"] = Relationship(back_populates="presets")

    @property
    def config_dict(self) -> Dict[str, Any]:
        """Get configuration as dictionary"""
        if isinstance(self.configuration, dict):
            return self.configuration
        if isinstance(self.configuration, str):
            try:
                return json.loads(self.configuration)
            except (json.JSONDecodeError, TypeError):
                return {}
        return {}

    @config_dict.setter
    def config_dict(self, value: Dict[str, Any]):
        """Set configuration from dictionary"""
        self.configuration = value


class PresetCreate(SQLModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False
    configuration: Dict[str, Any]


class PresetUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    configuration: Optional[Dict[str, Any]] = None


class PresetResponse(SQLModel):
    id: int
    name: str
    description: Optional[str]
    is_public: bool
    configuration: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    user_id: int
