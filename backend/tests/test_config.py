import os
from unittest.mock import patch

import pytest
from app.config import LogLevel, Settings
from pydantic import ValidationError


class TestLogLevel:
    """Test cases for the LogLevel enum."""

    def test_log_level_values(self):
        """Test that LogLevel enum has correct values."""
        assert LogLevel.DEBUG == "DEBUG"
        assert LogLevel.INFO == "INFO"
        assert LogLevel.WARNING == "WARNING"
        assert LogLevel.ERROR == "ERROR"

    def test_log_level_membership(self):
        """Test that LogLevel values are valid enum members."""
        assert LogLevel.DEBUG in LogLevel
        assert LogLevel.INFO in LogLevel
        assert LogLevel.WARNING in LogLevel
        assert LogLevel.ERROR in LogLevel

    def test_log_level_string_representation(self):
        """Test string representation of LogLevel values."""
        assert str(LogLevel.DEBUG) == "LogLevel.DEBUG"
        assert str(LogLevel.INFO) == "LogLevel.INFO"
        assert str(LogLevel.WARNING) == "LogLevel.WARNING"
        assert str(LogLevel.ERROR) == "LogLevel.ERROR"


class TestSettings:
    """Test cases for the Settings configuration class."""

    def test_default_values(self):
        """Test that Settings has correct default values."""
        settings = Settings()

        assert settings.app_name == "Soft Robot API"
        assert settings.debug is False
        assert settings.log_level == LogLevel.INFO
        assert settings.cors_origins == ["http://localhost:5173"]

    def test_custom_values(self):
        """Test that Settings can be initialized with custom values."""
        settings = Settings(
            app_name="Custom App",
            debug=True,
            log_level=LogLevel.DEBUG,
            cors_origins=["http://example.com", "https://example.com"],
        )

        assert settings.app_name == "Custom App"
        assert settings.debug is True
        assert settings.log_level == LogLevel.DEBUG
        assert settings.cors_origins == [
            "http://example.com",
            "https://example.com",
        ]

    def test_environment_variable_loading(self):
        """Test that Settings loads values from environment variables."""
        with patch.dict(
            os.environ,
            {
                "APP_NAME": "Env App",
                "DEBUG": "true",
                "LOG_LEVEL": "WARNING",
                "CORS_ORIGINS": '["http://env1.com", "http://env2.com"]',
            },
        ):
            settings = Settings()

            assert settings.app_name == "Env App"
            assert settings.debug is True
            assert settings.log_level == LogLevel.WARNING
            assert settings.cors_origins == [
                "http://env1.com",
                "http://env2.com",
            ]

    def test_environment_variable_boolean_parsing(self):
        """Test that boolean environment variables are parsed correctly."""
        # Test true values
        for true_value in ["true", "True", "TRUE", "1", "yes", "on"]:
            with patch.dict(os.environ, {"DEBUG": true_value}):
                settings = Settings()
                assert settings.debug is True

        # Test false values
        for false_value in ["false", "False", "FALSE", "0", "no", "off"]:
            with patch.dict(os.environ, {"DEBUG": false_value}):
                settings = Settings()
                assert settings.debug is False

    def test_environment_variable_log_level_parsing(self):
        """Test that log level environment variables are parsed correctly."""
        for level in ["DEBUG", "INFO", "WARNING", "ERROR"]:
            with patch.dict(os.environ, {"LOG_LEVEL": level}):
                settings = Settings()
                assert settings.log_level == LogLevel(level)

    def test_invalid_log_level_environment_variable(self):
        """Test that invalid log level raises an error."""
        with patch.dict(os.environ, {"LOG_LEVEL": "INVALID"}):
            with pytest.raises(ValueError):
                Settings()

    def test_cors_origins_validation_empty_list(self):
        """Test that empty CORS origins list raises an error."""
        with pytest.raises(ValueError, match="CORS origins cannot be empty"):
            Settings(cors_origins=[])

    def test_cors_origins_validation_empty_string(self):
        """Test that empty string CORS origins raises an error."""
        with patch.dict(os.environ, {"CORS_ORIGINS": "[]"}):
            with pytest.raises(
                ValueError, match="CORS origins cannot be empty"
            ):
                Settings()

    def test_cors_origins_validation_whitespace_only(self):
        """Test that whitespace-only CORS origins raises an error."""
        with patch.dict(os.environ, {"CORS_ORIGINS": '["   "]'}):
            # Should raise error as whitespace-only strings are invalid
            with pytest.raises(ValidationError):
                Settings()

    def test_cors_origins_validation_single_origin(self):
        """Test that single CORS origin is handled correctly."""
        settings = Settings(cors_origins=["http://single.com"])
        assert settings.cors_origins == ["http://single.com"]

    def test_cors_origins_validation_multiple_origins(self):
        """Test that multiple CORS origins are handled correctly."""
        origins = [
            "http://origin1.com",
            "https://origin2.com",
            "http://localhost:3000",
        ]
        settings = Settings(cors_origins=origins)
        assert settings.cors_origins == origins

    def test_cors_origins_environment_variable_parsing(self):
        """
        Test that CORS origins from environment variable are parsed correctly.
        """
        with patch.dict(
            os.environ,
            {"CORS_ORIGINS": '["http://env1.com", "https://env2.com"]'},
        ):
            settings = Settings()
            assert settings.cors_origins == [
                "http://env1.com",
                "https://env2.com",
            ]

    def test_cors_origins_environment_variable_with_spaces(self):
        """Test that CORS origins with spaces are handled correctly."""
        with patch.dict(
            os.environ,
            {"CORS_ORIGINS": '["http://env1.com", "https://env2.com"]'},
        ):
            settings = Settings()
            assert settings.cors_origins == [
                "http://env1.com",
                "https://env2.com",
            ]

    def test_settings_mutability(self):
        """Test that Settings objects can be modified after creation."""
        settings = Settings()

        # Settings objects are mutable by default in Pydantic v2
        settings.app_name = "Modified"
        assert settings.app_name == "Modified"

    def test_settings_equality(self):
        """Test that Settings objects with same values are equal."""
        settings1 = Settings(
            app_name="Test App",
            debug=True,
            log_level=LogLevel.DEBUG,
            cors_origins=["http://test.com"],
        )

        settings2 = Settings(
            app_name="Test App",
            debug=True,
            log_level=LogLevel.DEBUG,
            cors_origins=["http://test.com"],
        )

        assert settings1 == settings2

    def test_settings_inequality(self):
        """Test that Settings objects with different values are not equal."""
        settings1 = Settings(app_name="App 1")
        settings2 = Settings(app_name="App 2")

        assert settings1 != settings2

    def test_settings_repr(self):
        """Test that Settings has a meaningful string representation."""
        settings = Settings(
            app_name="Test App",
            debug=True,
            log_level=LogLevel.DEBUG,
            cors_origins=["http://test.com"],
        )

        repr_str = repr(settings)
        assert "Test App" in repr_str
        assert "debug=True" in repr_str
        assert "DEBUG" in repr_str
        assert "http://test.com" in repr_str

    def test_settings_dict_conversion(self):
        """Test that Settings can be converted to dictionary."""
        settings = Settings(
            app_name="Test App",
            debug=True,
            log_level=LogLevel.DEBUG,
            cors_origins=["http://test.com"],
        )

        settings_dict = settings.model_dump()

        assert settings_dict["app_name"] == "Test App"
        assert settings_dict["debug"] is True
        assert settings_dict["log_level"] == "DEBUG"
        assert settings_dict["cors_origins"] == ["http://test.com"]

    def test_settings_json_conversion(self):
        """Test that Settings can be converted to JSON."""
        settings = Settings(
            app_name="Test App",
            debug=True,
            log_level=LogLevel.DEBUG,
            cors_origins=["http://test.com"],
        )

        settings_json = settings.model_dump_json()

        assert "Test App" in settings_json
        assert "true" in settings_json
        assert "DEBUG" in settings_json
        assert "http://test.com" in settings_json

    def test_settings_from_dict(self):
        """Test that Settings can be created from a dictionary."""
        settings_dict = {
            "app_name": "Dict App",
            "debug": True,
            "log_level": "WARNING",
            "cors_origins": ["http://dict.com"],
        }

        settings = Settings.model_validate(settings_dict)

        assert settings.app_name == "Dict App"
        assert settings.debug is True
        assert settings.log_level == LogLevel.WARNING
        assert settings.cors_origins == ["http://dict.com"]

    def test_settings_validation_error_messages(self):
        """Test that validation errors provide meaningful messages."""
        # Test invalid log level
        with pytest.raises(ValueError) as exc_info:
            Settings(log_level="INVALID_LEVEL")
        assert "INVALID_LEVEL" in str(exc_info.value)

        # Test empty CORS origins
        with pytest.raises(ValueError) as exc_info:
            Settings(cors_origins=[])
        assert "CORS origins cannot be empty" in str(exc_info.value)

    def test_settings_edge_cases(self):
        """Test Settings with edge case values."""
        # Test with very long app name
        long_name = "A" * 1000
        settings = Settings(app_name=long_name)
        assert settings.app_name == long_name

        # Test with special characters in CORS origins
        special_origins = [
            "http://test.com/path?param=value",
            "https://test.com:8080",
        ]
        settings = Settings(cors_origins=special_origins)
        assert settings.cors_origins == special_origins

        # Test with all log levels
        for level in LogLevel:
            settings = Settings(log_level=level)
            assert settings.log_level == level

    def test_settings_environment_variable_case_sensitivity(self):
        """
        Test that environment variable names are case-insensitive by default.
        """
        # Test with lowercase environment variable names
        with patch.dict(
            os.environ,
            {
                "app_name": "Lowercase App",
                "debug": "true",
                "log_level": "DEBUG",
                "cors_origins": '["http://lowercase.com"]',
            },
        ):
            settings = Settings()
            # Pydantic Settings is case-insensitive by default
            assert settings.app_name == "Lowercase App"
            assert settings.debug is True
            assert settings.log_level == LogLevel.DEBUG
            assert settings.cors_origins == ["http://lowercase.com"]

    def test_settings_environment_variable_override_priority(self):
        """Test that environment variables override default values."""
        with patch.dict(
            os.environ,
            {
                "APP_NAME": "Env Override",
                "DEBUG": "true",
                "LOG_LEVEL": "ERROR",
                "CORS_ORIGINS": '["http://override.com"]',
            },
        ):
            settings = Settings()

            # Environment variables should override defaults
            assert settings.app_name == "Env Override"
            assert settings.debug is True
            assert settings.log_level == LogLevel.ERROR
            assert settings.cors_origins == ["http://override.com"]

    def test_settings_constructor_override_priority(self):
        """Test that constructor arguments override environment variables."""
        with patch.dict(
            os.environ,
            {
                "APP_NAME": "Env Value",
                "DEBUG": "false",
                "LOG_LEVEL": "INFO",
                "CORS_ORIGINS": '["http://env.com"]',
            },
        ):
            settings = Settings(
                app_name="Constructor Value",
                debug=True,
                log_level=LogLevel.DEBUG,
                cors_origins=["http://constructor.com"],
            )

            # Constructor arguments should override environment variables
            assert settings.app_name == "Constructor Value"
            assert settings.debug is True
            assert settings.log_level == LogLevel.DEBUG
            assert settings.cors_origins == ["http://constructor.com"]

    def test_settings_with_missing_environment_variables(self):
        """Test that missing environment variables use defaults."""
        # Remove any existing environment variables
        with patch.dict(os.environ, {}, clear=True):
            settings = Settings()

            # Should use defaults when environment variables are missing
            assert settings.app_name == "Soft Robot API"
            assert settings.debug is False
            assert settings.log_level == LogLevel.INFO
            assert settings.cors_origins == ["http://localhost:5173"]

    def test_settings_with_invalid_json_in_environment(self):
        """Test that invalid JSON in environment variables raises an error."""
        with patch.dict(os.environ, {"CORS_ORIGINS": "invalid json"}):
            with pytest.raises(Exception):  # Should raise some kind of error
                Settings()

    def test_settings_with_malformed_json_array(self):
        """Test that malformed JSON array raises an error."""
        with patch.dict(os.environ, {"CORS_ORIGINS": '["incomplete'}):
            with pytest.raises(Exception):  # Should raise some kind of error
                Settings()
