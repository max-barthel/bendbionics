from app.database import get_session
from sqlmodel import text


def test_database_schema():
    """Test to check the actual database schema."""
    # Get a database session
    session_gen = get_session()
    session = next(session_gen)

    try:
        # Check the actual table structure using SQLite pragma
        result = session.exec(text("PRAGMA table_info(user);")).all()

        print("Database schema for 'user' table:")  # noqa: T201
        for row in result:
            print(f"  {row[1]}: {row[2]} (nullable: {row[3]}, default: {row[4]})")  # noqa: T201

        # Check if is_active column exists
        is_active_exists = any(row[1] == "is_active" for row in result)
        print(f"\nis_active column exists: {is_active_exists}")  # noqa: T201

        # This test will help us understand the schema mismatch
        # No assertion needed - we're just debugging schema

    finally:
        session.close()


def test_user_model_fields():
    """Test to check what fields are defined in the User model."""
    from app.models.user import User

    # Get all field names from the User model
    field_names = list(User.model_fields.keys())
    print(f"User model fields: {field_names}")  # noqa: T201

    # Check if is_active is in the model
    has_is_active = "is_active" in field_names
    print(f"User model has is_active field: {has_is_active}")  # noqa: T201

    # This test will help us understand the model definition
    # No assertion needed - we're just debugging model fields
