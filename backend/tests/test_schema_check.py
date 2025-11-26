import pytest
from app.database import get_session
from sqlmodel import text


def test_database_schema():
    """Test to check the actual database schema."""
    # Ensure tables are created (conftest should do this, but ensure it's done)
    from app.database import create_db_and_tables

    create_db_and_tables()

    # Get a database session
    session_gen = get_session()
    session = next(session_gen)

    try:
        # Check the actual table structure using PostgreSQL information_schema
        result = session.exec(
            text(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'user'
                AND column_name = 'is_active'
                """
            )
        ).all()
        is_active_exists = len(result) > 0

        # Check if is_active column exists
        assert is_active_exists, "is_active column should exist in user table"

        # This test will help us understand the schema mismatch

    finally:
        session.close()


def test_user_model_fields():
    """Test to check what fields are defined in the User model."""
    from app.models.user import User

    # Get all field names from the User model
    field_names = list(User.model_fields.keys())

    # Check if is_active is in the model
    has_is_active = "is_active" in field_names
    assert has_is_active, "is_active field should exist in User model"

    # This test will help us understand the model definition
