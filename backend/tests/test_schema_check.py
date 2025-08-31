from app.database import get_session
from sqlmodel import text


def test_database_schema():
    """Test to check the actual database schema."""
    # Get a database session
    session_gen = get_session()
    session = next(session_gen)

    try:
        # Check the actual table structure
        result = session.exec(
            text(
                """
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'user'
            ORDER BY ordinal_position;
        """
            )
        ).all()

        print("Database schema for 'user' table:")
        for row in result:
            print(
                f"  {row[0]}: {row[1]} (nullable: {row[2]}, default: {row[3]})"
            )

        # Check if is_active column exists
        is_active_exists = any(row[0] == "is_active" for row in result)
        print(f"\nis_active column exists: {is_active_exists}")

        # This test will help us understand the schema mismatch
        assert True  # We're just checking, not asserting anything specific

    finally:
        session.close()


def test_user_model_fields():
    """Test to check what fields are defined in the User model."""
    from app.models.user import User

    # Get all field names from the User model
    field_names = [field for field in User.__fields__.keys()]
    print(f"User model fields: {field_names}")

    # Check if is_active is in the model
    has_is_active = "is_active" in field_names
    print(f"User model has is_active field: {has_is_active}")

    # This test will help us understand the model definition
    assert True  # We're just checking, not asserting anything specific
