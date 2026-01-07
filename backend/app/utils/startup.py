"""Startup utilities for application initialization and configuration validation."""

from app.config import settings
from app.utils.logging import LogContext, default_logger


def validate_email_config() -> None:
    """Validate email configuration and log appropriate messages.

    Checks Mailgun configuration when email verification is enabled
    and logs warnings/info messages accordingly.
    """
    if settings.email_verification_enabled:
        if not settings.mailgun_api_key or not settings.mailgun_domain:
            default_logger.warning(
                LogContext.GENERAL,
                "EMAIL_VERIFICATION_ENABLED=true but Mailgun credentials are missing!",
                {},
                "Startup",
                "config_warning",
            )
            default_logger.warning(
                LogContext.GENERAL,
                "Set MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables",
                {},
                "Startup",
                "config_warning",
            )
            default_logger.warning(
                LogContext.GENERAL,
                "Email verification will not work until credentials are configured",
                {},
                "Startup",
                "config_warning",
            )
        else:
            default_logger.info(
                LogContext.GENERAL,
                "Mailgun configuration found - email verification enabled",
                {
                    "domain": settings.mailgun_domain,
                    "region": settings.mailgun_region,
                    "from_email": settings.mailgun_from_email,
                },
                "Startup",
                "config_success",
            )
    else:
        default_logger.info(
            LogContext.GENERAL,
            ("Email verification disabled - verification links will be logged to console"),
            {},
            "Startup",
            "config_info",
        )


def log_startup_info() -> None:
    """Log startup information."""
    default_logger.info(
        LogContext.GENERAL,
        f"Starting {settings.app_name}",
        {
            "debug": settings.debug,
            "log_level": settings.log_level.value,
        },
        "Startup",
        "app_start",
    )
