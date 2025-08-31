from app.config import Settings


class TestConfigSimple:
    """Simple tests for configuration."""

    def test_settings_default_values(self):
        """Test that settings have default values."""
        settings = Settings()

        # Test that required fields have defaults
        assert settings.app_name is not None
        assert settings.debug is not None
        assert settings.secret_key is not None
        assert settings.algorithm is not None
        assert settings.access_token_expire_minutes is not None

    def test_settings_model_validation(self):
        """Test that settings model validation works correctly."""
        # Test with valid data
        settings = Settings(
            app_name="Test App",
            debug=True,
            secret_key="test_key",
            algorithm="HS256",
            access_token_expire_minutes=30,
        )

        assert settings.app_name == "Test App"
        assert settings.debug is True
        assert settings.secret_key == "test_key"
        assert settings.algorithm == "HS256"
        assert settings.access_token_expire_minutes == 30

    def test_settings_optional_fields(self):
        """Test that optional fields work correctly."""
        settings = Settings()

        # These should have default values
        assert settings.mail_username is not None
        assert settings.mail_password is not None
        assert settings.mail_from is not None
        assert settings.mail_server is not None
        assert settings.mail_port is not None
        assert settings.mail_tls is not None
        assert settings.mail_ssl is not None

    def test_settings_database_url_default(self):
        """Test database URL default value."""
        settings = Settings()

        # Should have a default database URL
        assert settings.database_url is not None
        assert isinstance(settings.database_url, str)

    def test_settings_log_level_default(self):
        """Test log level default value."""
        settings = Settings()

        # Should have a default log level
        assert settings.log_level is not None
        assert isinstance(settings.log_level, str)

    def test_settings_frontend_url_default(self):
        """Test frontend URL default value."""
        settings = Settings()

        # Should have a default frontend URL
        assert settings.frontend_url is not None
        assert isinstance(settings.frontend_url, str)

    def test_settings_secret_key_generation(self):
        """Test that secret key is generated if not provided."""
        settings = Settings()

        # Should have a generated secret key
        assert settings.secret_key is not None
        assert len(settings.secret_key) > 0

    def test_settings_algorithm_default(self):
        """Test algorithm default value."""
        settings = Settings()

        # Should have a default algorithm
        assert settings.algorithm is not None
        assert settings.algorithm in ["HS256", "HS384", "HS512"]

    def test_settings_token_expire_default(self):
        """Test access token expire minutes default value."""
        settings = Settings()

        # Should have a default value
        assert settings.access_token_expire_minutes is not None
        assert isinstance(settings.access_token_expire_minutes, int)
        assert settings.access_token_expire_minutes > 0
