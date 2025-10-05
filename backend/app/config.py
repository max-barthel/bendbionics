from enum import Enum
from typing import List

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

    # CORS Configuration
    # For production, set this via environment variable CORS_ORIGINS
    # Format: JSON array of strings, e.g.,
    # '["https://yourdomain.com", "https://www.yourdomain.com"]'
    cors_origins: List[str] = ["http://localhost:5173"]

    # Allow all origins in development (use with caution in production)
    cors_allow_all_origins: bool = False

    # Database settings
    # Default to SQLite for development, override with DATABASE_URL for
    # production
    database_url: str = "sqlite:///./soft_robot.db"

    # Authentication settings
    # Use a fixed secret key for development, generate new one for production
    secret_key: str = "dev-secret-key-for-soft-robot-app-2024"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    @field_validator("cors_origins")
    @classmethod
    def validate_cors_origins(cls, v):
        if not v:
            msg = "CORS origins cannot be empty"
            raise ValueError(msg)

        # Validate each origin format
        for origin in v:
            if not isinstance(origin, str):
                msg = f"Invalid CORS origin type: {type(origin)}"
                raise ValueError(msg)
            if not origin.strip():
                msg = "CORS origin cannot be empty string"
                raise ValueError(msg)
            # Basic URL format validation
            if not (origin.startswith(("http://", "https://"))):
                msg = f"Invalid CORS origin format: {origin}"
                raise ValueError(msg)

        return v

    @field_validator("cors_allow_all_origins")
    @classmethod
    def validate_cors_allow_all_origins(cls, v):
        return v

    def get_cors_origins(self) -> List[str]:
        """
        Get the final CORS origins list, handling the allow_all_origins flag.
        """
        if self.cors_allow_all_origins:
            return ["*"]
        return self.cors_origins

    class Config:
        env_file = ".env"
        # Allow environment variables to override defaults
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields from environment variables


# Create settings instance
settings = Settings()
