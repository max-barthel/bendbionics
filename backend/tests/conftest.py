"""
Pytest configuration and shared fixtures for backend tests.
"""
import os

# CRITICAL: Set DATABASE_URL before any app imports
# This ensures settings loads with SQLite URL for tests
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

import pytest
from sqlmodel import SQLModel, create_engine

# Import after setting environment variable
from app.database import create_db_and_tables, engine

# Create a test-specific engine with SQLite
test_database_url = "sqlite:///./test.db"
test_engine = create_engine(
    test_database_url,
    echo=False,
    connect_args={},  # No PostgreSQL-specific options for SQLite
    pool_pre_ping=True,
)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Initialize database tables before running tests."""
    # Override the global engine with test engine
    import app.database

    # Store original engine
    original_engine = app.database.engine

    # Replace with test engine
    app.database.engine = test_engine

    # Create tables using test engine
    SQLModel.metadata.create_all(test_engine)

    yield

    # Restore original engine
    app.database.engine = original_engine

    # Cleanup test database file if it exists
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except OSError:
            pass  # Ignore errors during cleanup

