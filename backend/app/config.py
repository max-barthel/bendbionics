from enum import Enum
from pathlib import Path
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"


class Settings(BaseSettings):
    app_name: str = "BendBionics API"
    debug: bool = False
    log_level: LogLevel = LogLevel.INFO  # Only accepts valid log levels

    # CORS Configuration
    # For production, set this via environment variable CORS_ORIGINS
    # Format: JSON array of strings, e.g.,
    # '["https://yourdomain.com", "https://www.yourdomain.com"]'
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:3000",
    ]

    # Allow all origins in development (use with caution in production)
    cors_allow_all_origins: bool = False

    # Database settings
    # PostgreSQL for both development and production
    # Must be set via DATABASE_URL environment variable or in .env file
    # Development: postgresql://username@localhost:5432/bendbionics
    # Production: postgresql://username:password@host:5432/database
    # Default: PostgreSQL connection for development (override via environment variable)
    database_url: str = "postgresql://localhost:5432/bendbionics"

    # Authentication settings
    # SECRET_KEY must be set via environment variable in production
    # For development, a default is provided but should be overridden in .env
    # Generate a secure key: python -c "import secrets; print(secrets.token_urlsafe(32))"
    secret_key: str = "CHANGE_THIS_IN_PRODUCTION_OR_ENV_FILE"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Email Verification Settings
    # Mailgun Configuration
    mailgun_api_key: str = ""
    mailgun_domain: str = ""
    mailgun_from_email: str = "noreply@localhost"
    mailgun_from_name: str = "BendBionics"
    mailgun_region: str = "us"  # "us" or "eu"

    # Email Verification Settings
    # In dev mode (False), verification links are logged to console
    # In production (True), emails are sent via Mailgun
    email_verification_enabled: bool = False
    email_verification_token_expire_hours: int = 24
    email_verification_url: str = "http://localhost:5173/verify-email"

    # Password Reset Settings
    password_reset_token_expire_hours: int = 1
    password_reset_url: str = "http://localhost:5173/reset-password"

    # Frontend URLs (for email links)
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"

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

    # Pydantic v2 settings configuration
    model_config = SettingsConfigDict(
        # Allow environment variables to override defaults
        case_sensitive=False,
        extra="ignore",  # Ignore extra fields from environment variables
        # Look for env files in the backend directory (parent of app/)
        env_file=(
            str(Path(__file__).parent.parent / ".env.production"),
            str(Path(__file__).parent.parent / ".env"),
        ),
        env_file_encoding="utf-8",
    )


# Create settings instance
# Pydantic-settings will automatically try .env.production first, then .env
settings = Settings()
