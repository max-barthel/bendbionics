from enum import Enum

from pydantic import field_validator
from pydantic_settings import BaseSettings


class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"


class Settings(BaseSettings):
    app_name: str = "Soft Robot API"
    debug: bool = False
    log_level: LogLevel = LogLevel.INFO  # Only accepts valid log levels
    cors_origins: list[str] = ["http://localhost:5173"]

    @field_validator("cors_origins")
    @classmethod
    def validate_cors_origins(cls, v):
        if not v:
            raise ValueError("CORS origins cannot be empty")
        return v
