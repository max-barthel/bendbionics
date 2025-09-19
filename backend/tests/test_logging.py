import logging
import sys

from app.utils.logging import logger, setup_logging


class TestLogging:
    """Test logging utility functions."""

    def test_setup_logging_default_settings(self):
        """Test setting up logging with default settings."""
        # Clear any existing handlers
        logger.handlers.clear()

        setup_logging()

        # Check that logger has handlers
        assert len(logger.handlers) > 0

        # Check that logger level is set
        assert logger.level != logging.NOTSET

        # Check that propagate is False
        assert logger.propagate is False

    def test_setup_logging_with_custom_settings(self):
        """Test setting up logging with custom settings."""
        from app.config import Settings

        # Create custom settings
        custom_settings = Settings()
        custom_settings.log_level = "DEBUG"

        # Clear any existing handlers
        logger.handlers.clear()

        setup_logging(custom_settings)

        # Check that logger level matches custom settings
        assert logger.level == logging.DEBUG

    def test_setup_logging_with_different_levels(self):
        """Test setting up logging with different log levels."""
        from app.config import Settings

        # Test different log levels
        levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]

        for level_name in levels:
            custom_settings = Settings()
            custom_settings.log_level = level_name

            # Clear any existing handlers
            logger.handlers.clear()

            setup_logging(custom_settings)

            # Check that logger level matches
            expected_level = getattr(logging, level_name)
            assert logger.level == expected_level

    def test_setup_logging_handler_configuration(self):
        """Test that logging handlers are properly configured."""
        # Clear any existing handlers
        logger.handlers.clear()

        setup_logging()

        # Check that we have at least one handler
        assert len(logger.handlers) > 0

        # Check that the handler is a StreamHandler
        handler = logger.handlers[0]
        assert isinstance(handler, logging.StreamHandler)

        # Check that the handler has a formatter
        assert handler.formatter is not None

        # Check that the formatter has the expected format
        formatter = handler.formatter
        assert "%(asctime)s" in formatter._fmt
        assert "%(name)s" in formatter._fmt
        assert "%(levelname)s" in formatter._fmt
        assert "%(message)s" in formatter._fmt

    def test_setup_logging_console_output(self):
        """Test that logging outputs to console."""
        # Clear any existing handlers
        logger.handlers.clear()

        setup_logging()

        # Check that the handler outputs to stdout
        handler = logger.handlers[0]
        assert handler.stream == sys.stdout

    def test_setup_logging_no_duplicate_handlers(self):
        """Test that setup_logging doesn't create duplicate handlers."""
        # Clear any existing handlers
        logger.handlers.clear()

        # Setup logging multiple times
        setup_logging()
        initial_handler_count = len(logger.handlers)

        # Clear handlers again to simulate fresh setup
        logger.handlers.clear()
        setup_logging()
        final_handler_count = len(logger.handlers)

        # Should have the same number of handlers after each setup
        assert final_handler_count == initial_handler_count

    def test_logger_name(self):
        """Test that logger has the correct name."""
        assert logger.name == "soft_robot_api"

    def test_logging_functionality(self):
        """Test that logging actually works."""
        # Clear any existing handlers
        logger.handlers.clear()

        setup_logging()

        # Test that we can log messages without error
        try:
            logger.info("Test message")
            logger.warning("Test warning")
            logger.error("Test error")
            # If we get here, logging is working
            assert True
        except Exception as e:
            assert False, f"Logging failed with error: {e}"

    def test_setup_logging_with_none_settings(self):
        """Test setting up logging with None settings (should use defaults)."""
        # Clear any existing handlers
        logger.handlers.clear()

        setup_logging(None)

        # Should still work and create handlers
        assert len(logger.handlers) > 0
        assert logger.level != logging.NOTSET

    def test_logger_propagate_setting(self):
        """Test that logger.propagate is set to False."""
        # Clear any existing handlers
        logger.handlers.clear()

        setup_logging()

        # Check that propagate is False to prevent duplicate messages
        assert logger.propagate is False
