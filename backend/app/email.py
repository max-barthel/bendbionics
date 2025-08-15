from app.config import settings

# Email functionality with proper error handling
_fastmail = None


def _get_fastmail():
    """Get or create FastMail instance with lazy loading"""
    global _fastmail
    if _fastmail is None and settings.mail_username and settings.mail_password:
        try:
            from fastapi_mail import ConnectionConfig, FastMail

            conf = ConnectionConfig(
                MAIL_USERNAME=settings.mail_username,
                MAIL_PASSWORD=settings.mail_password,
                MAIL_FROM=settings.mail_from,
                MAIL_PORT=settings.mail_port,
                MAIL_SERVER=settings.mail_server,
                MAIL_STARTTLS=settings.mail_tls,
                MAIL_SSL_TLS=settings.mail_ssl,
                USE_CREDENTIALS=True,
            )
            _fastmail = FastMail(conf)
            print("Email configuration initialized successfully")
        except ImportError:
            print("fastapi-mail not installed, email functionality disabled")
            _fastmail = None
        except Exception as e:
            print(f"Failed to initialize email configuration: {e}")
            _fastmail = None
    return _fastmail


async def send_verification_email(email: str, token: str):
    """Send email verification link"""
    fastmail = _get_fastmail()
    if not fastmail:
        print(
            f"Email verification requested for {email} "
            "but email not configured"
        )
        return True  # Return True to allow registration to continue

    try:
        from fastapi_mail import MessageSchema

        verification_url = (
            f"{settings.frontend_url}/verify-email?token={token}"
        )

        message = MessageSchema(
            subject="Verify your Soft Robot App account",
            recipients=[email],
            body=f"""
            <html>
              <body>
                  <h2>Welcome to Soft Robot App!</h2>
                  <p>Please click the link below to verify your email:</p>
                  <a href="{verification_url}">Verify Email</a>
                  <p>This link will expire in 24 hours.</p>
                  <p>If you didn't create an account,</p>
                  <p>you can safely ignore this email.</p>
              </body>
            </html>
            """,
            subtype="html",
        )

        await fastmail.send_message(message)
        print("Email verification sent successfully")
        return True
    except Exception as e:
        print(f"Failed to send verification email: {e}")
        return False


async def send_password_reset_email(email: str, token: str):
    """Send password reset link"""
    fastmail = _get_fastmail()
    if not fastmail:
        print(f"Password reset requested for {email} but email not configured")
        return

    try:
        from fastapi_mail import MessageSchema

        reset_url = f"{settings.frontend_url}/reset-password?token={token}"

        message = MessageSchema(
            subject="Reset your Soft Robot App password",
            recipients=[email],
            body=f"""
            <html>
                <body>
                    <h2>Password Reset Request</h2>
                    <p>Click the link below to reset your password:</p>
                    <a href="{reset_url}">Reset Password</a>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request a password reset,</p>
                    <p>you can safely ignore this email.</p>
                </body>
            </html>
            """,
            subtype="html",
        )

        await fastmail.send_message(message)
        print("Password reset email sent successfully")
    except Exception as e:
        print(f"Failed to send password reset email: {e}")
