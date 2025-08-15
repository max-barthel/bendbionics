import json
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .user import User


class PresetBase(SQLModel):
    name: str = Field(index=True)
    description: Optional[str] = None
    is_public: bool = Field(default=False)
    configuration: str = Field(default="{}")  # Store as JSON string


class Preset(PresetBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Foreign key to user
    user_id: int = Field(foreign_key="user.id")
    user: Optional["User"] = Relationship(back_populates="presets")

    @property
    def config_dict(self) -> Dict[str, Any]:
        """Get configuration as dictionary"""
        try:
            return json.loads(self.configuration)
        except (json.JSONDecodeError, TypeError):
            return {}

    @config_dict.setter
    def config_dict(self, value: Dict[str, Any]):
        """Set configuration from dictionary"""
        self.configuration = json.dumps(value)


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
