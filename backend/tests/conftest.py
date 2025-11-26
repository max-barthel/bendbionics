"""
Pytest configuration and shared fixtures for backend tests.
"""
import os

# CRITICAL: Set DATABASE_URL before any app imports
# Use PostgreSQL test database (can be overridden via TEST_DATABASE_URL env var)
test_database_url = os.getenv(
    "TEST_DATABASE_URL", "postgresql://localhost:5432/bendbionics_test"
)
os.environ["DATABASE_URL"] = test_database_url

import pytest
from sqlmodel import SQLModel, create_engine

# Import after setting environment variable
from app.database import create_db_and_tables, engine

# Create a test-specific engine with PostgreSQL
test_engine = create_engine(
    test_database_url,
    echo=False,
    connect_args={"options": "-c timezone=UTC"},
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

