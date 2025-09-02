from unittest.mock import patch

from app.email import (
    _get_fastmail,
    send_password_reset_email,
    send_verification_email,
)


class TestEmailSimple:
    """Simple tests for email functionality."""

    def setup_method(self):
        """Reset the global _fastmail variable before each test."""
        import app.email

        app.email._fastmail = None

    @patch("app.email.settings")
    def test_get_fastmail_no_credentials(self, mock_settings):
        """Test _get_fastmail when no credentials are provided."""
        mock_settings.mail_username = None
        mock_settings.mail_password = None

        result = _get_fastmail()
        assert result is None

    @patch("app.email.settings")
    def test_get_fastmail_with_credentials_import_error(self, mock_settings):
        """Test _get_fastmail when fastapi-mail is not installed."""
        mock_settings.mail_username = "test@example.com"
        mock_settings.mail_password = "password123"
        mock_settings.mail_from = "noreply@example.com"
        mock_settings.mail_port = 587
        mock_settings.mail_server = "smtp.example.com"
        mock_settings.mail_tls = True
        mock_settings.mail_ssl = False

        # Mock the import to fail
        with patch(
            "builtins.__import__",
            side_effect=ImportError("No module named 'fastapi_mail'"),
        ):
            result = _get_fastmail()
            assert result is None

    @patch("app.email._get_fastmail")
    @patch("app.email.settings")
    async def test_send_verification_email_no_fastmail(
        self, mock_settings, mock_get_fastmail
    ):
        """Test send_verification_email when email is not configured."""
        mock_get_fastmail.return_value = None
        mock_settings.frontend_url = "http://localhost:3000"

        result = await send_verification_email(
            "test@example.com", "test-token"
        )
        assert result is True

    @patch("app.email._get_fastmail")
    @patch("app.email.settings")
    async def test_send_password_reset_email_no_fastmail(
        self, mock_settings, mock_get_fastmail
    ):
        """Test send_password_reset_email when email is not configured."""
        mock_get_fastmail.return_value = None
        mock_settings.frontend_url = "http://localhost:3000"

        # Should complete without error
        await send_password_reset_email("test@example.com", "test-token")

    def test_email_module_imports(self):
        """Test that email module imports work correctly."""
        # Test that we can import the email functions
        from app.email import (
            _get_fastmail,
            send_password_reset_email,
            send_verification_email,
        )

        # Test that functions are callable
        assert callable(_get_fastmail)
        assert callable(send_verification_email)
        assert callable(send_password_reset_email)
