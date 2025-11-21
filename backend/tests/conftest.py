"""
Pytest configuration and shared fixtures for backend tests.
"""
import pytest
from app.database import create_db_and_tables


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Initialize database tables before running tests."""
    create_db_and_tables()
    yield
    # Cleanup can be added here if needed

