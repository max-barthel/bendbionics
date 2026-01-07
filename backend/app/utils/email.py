import secrets
from datetime import datetime, timedelta
from typing import Optional

import httpx

from app.config import settings
from app.utils.logging import logger
from app.utils.timezone import now_utc


class EmailService:
    """Service for sending emails via Mailgun API"""

    def __init__(self):
        self.api_key = settings.mailgun_api_key
        self.domain = settings.mailgun_domain
        self.from_email = settings.mailgun_from_email
        self.from_name = settings.mailgun_from_name

        # Support different Mailgun regions
        region = getattr(settings, "mailgun_region", "us")
        if region == "eu":
            self.base_url = f"https://api.eu.mailgun.net/v3/{self.domain}"
        else:
            self.base_url = f"https://api.mailgun.net/v3/{self.domain}"

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
    ) -> bool:
        """Send an email via Mailgun API"""
        if not self.api_key or not self.domain:
            logger.warning("Mailgun not configured - email not sent")
            return False

        # Log request details for debugging
        logger.info(f"Sending email via Mailgun to: {to_email}")
        logger.debug(f"Mailgun API URL: {self.base_url}/messages")
        logger.debug(f"From: {self.from_name} <{self.from_email}>")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/messages",
                    auth=("api", self.api_key),
                    data={
                        "from": f"{self.from_name} <{self.from_email}>",
                        "to": to_email,
                        "subject": subject,
                        "html": html_content,
                        "text": text_content or self._html_to_text(html_content),
                    },
                )

                # Log response details
                logger.info(f"Mailgun API response: {response.status_code}")

                if response.status_code == 200:
                    logger.info(f"Email sent successfully to {to_email}")
                    return True
                # Log detailed error information
                logger.error(f"Mailgun API error - Status: {response.status_code}")
                logger.error(f"Mailgun API error - Response: {response.text}")
                logger.error(f"Mailgun API error - Headers: {dict(response.headers)}")
                return False

        except httpx.HTTPError as e:
            logger.error(f"HTTP error sending email to {to_email}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending email to {to_email}: {e}")
            return False

    async def send_verification_email(self, to_email: str, username: str, token: str) -> bool:
        """Send email verification email"""
        verification_url = f"{settings.email_verification_url}?token={token}"

        # In development, log the verification URL instead of sending email
        if not settings.email_verification_enabled:
            logger.info("=" * 80)
            logger.info("📧 EMAIL VERIFICATION (DEV MODE)")
            logger.info(f"To: {to_email}")
            logger.info(f"Username: {username}")
            logger.info(f"Verification URL: {verification_url}")
            logger.info("=" * 80)
            return True

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Verify Your Email - BendBionics</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">Welcome to BendBionics!</h2>
                <p>Hi {username},</p>
                <p>Thank you for registering with BendBionics. To complete your
                registration, please verify your email address by clicking the
                button below:</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}"
                       style="background-color: #3498db; color: white;
                       padding: 12px 30px; text-decoration: none;
                       border-radius: 5px; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>

                <p>If the button doesn't work, you can copy and paste this link
                into your browser:</p>
                <p style="word-break: break-all; color: #7f8c8d;">
                {verification_url}</p>

                <p>This verification link will expire in
                {settings.email_verification_token_expire_hours} hours.</p>

                <hr style="border: none; border-top: 1px solid #ecf0f1;
                margin: 30px 0;">
                <p style="font-size: 12px; color: #7f8c8d;">
                    If you didn't create an account with BendBionics,
                    please ignore this email.
                </p>
            </div>
        </body>
        </html>
        """

        return await self.send_email(
            to_email=to_email,
            subject="Verify Your Email - BendBionics",
            html_content=html_content,
        )

    async def send_password_reset_email(self, to_email: str, username: str, token: str) -> bool:
        """Send password reset email"""
        reset_url = f"{settings.password_reset_url}?token={token}"

        # In development, log the reset URL instead of sending email
        if not settings.email_verification_enabled:
            logger.info("=" * 80)
            logger.info("🔐 PASSWORD RESET (DEV MODE)")
            logger.info(f"To: {to_email}")
            logger.info(f"Username: {username}")
            logger.info(f"Reset URL: {reset_url}")
            logger.info("=" * 80)
            return True

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Reset Your Password - BendBionics</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">Password Reset Request</h2>
                <p>Hi {username},</p>
                <p>We received a request to reset your password for your
                BendBionics account. Click the button below to reset your
                password:</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}"
                       style="background-color: #e74c3c; color: white;
                       padding: 12px 30px; text-decoration: none;
                       border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </div>

                <p>If the button doesn't work, you can copy and paste this link
                into your browser:</p>
                <p style="word-break: break-all; color: #7f8c8d;">
                {reset_url}</p>

                <p>This reset link will expire in
                {settings.password_reset_token_expire_hours} hour(s).</p>

                <hr style="border: none; border-top: 1px solid #ecf0f1;
                margin: 30px 0;">
                <p style="font-size: 12px; color: #7f8c8d;">
                    If you didn't request a password reset, please ignore this
                    email. Your password will remain unchanged.
                </p>
            </div>
        </body>
        </html>
        """

        return await self.send_email(
            to_email=to_email,
            subject="Reset Your Password - BendBionics",
            html_content=html_content,
        )

    def _html_to_text(self, html: str) -> str:
        """Convert HTML to plain text (basic implementation)"""
        import re

        # Remove HTML tags and clean up whitespace
        return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html)).strip()


def generate_verification_token() -> str:
    """Generate a secure verification token"""
    return secrets.token_urlsafe(32)


def generate_password_reset_token() -> str:
    """Generate a secure password reset token"""
    return secrets.token_urlsafe(32)


def get_token_expiry(hours: int) -> datetime:
    """Get token expiry datetime"""
    return (now_utc() + timedelta(hours=hours)).replace(tzinfo=None)


def is_token_expired(expires_at: Optional[datetime]) -> bool:
    """Check if token is expired"""
    if expires_at is None:
        return True

    # Get current time and ensure it's timezone-naive
    current_utc = now_utc()
    if current_utc.tzinfo is not None:
        current_utc = current_utc.replace(tzinfo=None)

    # Ensure expires_at is timezone-naive
    expires_utc = expires_at.replace(tzinfo=None) if expires_at.tzinfo is not None else expires_at

    # Both should now be timezone-naive UTC datetimes
    return current_utc > expires_utc


# Create email service instance
email_service = EmailService()
