import secrets
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
    # Generate a new secret key each time if not provided
    secret_key: str = secrets.token_urlsafe(32)
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Email settings (empty by default, must be set in production)
    mail_username: str = ""
    mail_password: str = ""
    mail_from: str = ""
    mail_port: int = 587
    mail_server: str = "smtp.gmail.com"
    mail_tls: bool = True
    mail_ssl: bool = False

    # Frontend URL for email verification
    frontend_url: str = "http://localhost:5173"

    @field_validator("cors_origins")
    @classmethod
    def validate_cors_origins(cls, v):
        if not v:
            raise ValueError("CORS origins cannot be empty")

        # Validate each origin format
        for origin in v:
            if not isinstance(origin, str):
                raise ValueError(f"Invalid CORS origin type: {type(origin)}")
            if not origin.strip():
                raise ValueError("CORS origin cannot be empty string")
            # Basic URL format validation
            if not (
                origin.startswith("http://") or origin.startswith("https://")
            ):
                raise ValueError(f"Invalid CORS origin format: {origin}")

        return v

    @field_validator("cors_allow_all_origins")
    @classmethod
    def validate_cors_allow_all_origins(cls, v):
        # Warn if allowing all origins in production-like environment
        if v and not cls.debug:
            import warnings

            msg = (
                "CORS_ALLOW_ALL_ORIGINS is enabled in non-debug mode. "
                "This is not recommended for production environments."
            )
            warnings.warn(msg, UserWarning)
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


# Create settings instance
settings = Settings()
