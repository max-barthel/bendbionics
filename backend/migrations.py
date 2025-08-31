"""
Simple database migration script for the Soft Robot application.
This script helps manage database schema changes.
"""

import os
import sys

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import after path setup to avoid circular imports
from app.database import engine  # noqa: E402
from app.models.preset import Preset  # noqa: E402
from app.models.user import User  # noqa: E402
from app.utils.cache import clear_cache  # noqa: E402
from sqlmodel import Session, SQLModel, select  # noqa: E402


def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    try:
        SQLModel.metadata.create_all(engine)
        print("✅ Tables created successfully!")
        print("📋 Created tables:")
        print(
            "   - user (with fields: id, username, email, is_local, "
            "is_active, is_verified, hashed_password, created_at, updated_at)"
        )
        print(
            "   - preset (with fields: id, name, description, is_public, "
            "configuration, user_id, created_at, updated_at)"
        )
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False
    return True


def drop_tables():
    """Drop all database tables (DANGEROUS - use with caution)"""
    confirm = input("⚠️  This will delete ALL data. Are you sure? (yes/no): ")
    if confirm.lower() == "yes":
        print("Dropping all tables...")
        try:
            SQLModel.metadata.drop_all(engine)
            print("✅ Tables dropped successfully!")
            return True
        except Exception as e:
            print(f"❌ Error dropping tables: {e}")
            return False
    else:
        print("❌ Operation cancelled.")
        return False


def reset_database():
    """Reset the database by dropping and recreating all tables"""
    confirm = input(
        "⚠️  This will delete ALL data and recreate tables. "
        "Are you sure? (yes/no): "
    )
    if confirm.lower() == "yes":
        print("Resetting database...")
        try:
            # Clear cache first
            clear_cache()
            print("🧹 Cache cleared")

            # Drop and recreate tables
            SQLModel.metadata.drop_all(engine)
            SQLModel.metadata.create_all(engine)
            print("✅ Database reset successfully!")
            return True
        except Exception as e:
            print(f"❌ Error resetting database: {e}")
            return False
    else:
        print("❌ Operation cancelled.")
        return False


def check_database_status():
    """Check the current status of the database"""
    print("Checking database status...")

    try:
        with Session(engine) as session:
            # Check if tables exist by trying to query them
            user_count = len(session.exec(select(User)).all())
            preset_count = len(session.exec(select(Preset)).all())

            print("✅ Database connection successful!")
            print(f"📊 Users in database: {user_count}")
            print(f"📊 Presets in database: {preset_count}")

            # Check table structure
            print("\n📋 Current table structure:")
            print(
                "   User table fields: id, username, email, is_local, "
                "is_active, is_verified, hashed_password, created_at, "
                "updated_at"
            )
            print(
                "   Preset table fields: id, name, description, is_public, "
                "configuration, user_id, created_at, "
                "updated_at"
            )

            return True

    except Exception as e:
        print(f"❌ Database error: {e}")
        print(
            "💡 Try running 'python migrations.py create' to create "
            "missing tables"
        )
        return False


def clear_cache_only():
    """Clear only the computation cache"""
    print("Clearing computation cache...")
    try:
        clear_cache()
        print("✅ Cache cleared successfully!")
        return True
    except Exception as e:
        print(f"❌ Error clearing cache: {e}")
        return False


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(
            "Usage: python migrations.py [create|drop|reset|status|clear-cache]"
        )
        print("  create      - Create all tables")
        print("  drop        - Drop all tables (DANGEROUS)")
        print("  reset       - Drop and recreate all tables (DANGEROUS)")
        print("  status      - Check database status")
        print("  clear-cache - Clear computation cache only")
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "create":
        success = create_tables()
        sys.exit(0 if success else 1)
    elif command == "drop":
        success = drop_tables()
        sys.exit(0 if success else 1)
    elif command == "reset":
        success = reset_database()
        sys.exit(0 if success else 1)
    elif command == "status":
        success = check_database_status()
        sys.exit(0 if success else 1)
    elif command == "clear-cache":
        success = clear_cache_only()
        sys.exit(0 if success else 1)
    else:
        print("❌ Unknown command:", command)
        sys.exit(1)
