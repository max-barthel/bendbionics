"""
Simple database migration script for the Soft Robot application.
This script helps manage database schema changes.
"""

import os
import sys

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from app.models.preset import Preset
from app.models.user import User
from sqlmodel import Session, SQLModel, select


def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    SQLModel.metadata.create_all(engine)
    print("✅ Tables created successfully!")


def drop_tables():
    """Drop all database tables (DANGEROUS - use with caution)"""
    confirm = input("⚠️  This will delete ALL data. Are you sure? (yes/no): ")
    if confirm.lower() == "yes":
        print("Dropping all tables...")
        SQLModel.metadata.drop_all(engine)
        print("✅ Tables dropped successfully!")
    else:
        print("❌ Operation cancelled.")


def reset_database():
    """Reset the database by dropping and recreating all tables"""
    confirm = input(
        "⚠️  This will delete ALL data and recreate tables. "
        "Are you sure? (yes/no): "
    )
    if confirm.lower() == "yes":
        print("Resetting database...")
        SQLModel.metadata.drop_all(engine)
        SQLModel.metadata.create_all(engine)
        print("✅ Database reset successfully!")
    else:
        print("❌ Operation cancelled.")


def check_database_status():
    """Check the current status of the database"""
    print("Checking database status...")

    try:
        with Session(engine) as session:
            # Check if tables exist by trying to query them
            user_count = len(session.exec(select(User)).all())
            preset_count = len(session.exec(select(Preset)).all())

            print(f"✅ Database connection successful!")
            print(f"📊 Users in database: {user_count}")
            print(f"📊 Presets in database: {preset_count}")

    except Exception as e:
        print(f"❌ Database error: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python migrations.py [create|drop|reset|status]")
        print("  create  - Create all tables")
        print("  drop    - Drop all tables (DANGEROUS)")
        print("  reset   - Drop and recreate all tables (DANGEROUS)")
        print("  status  - Check database status")
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "create":
        create_tables()
    elif command == "drop":
        drop_tables()
    elif command == "reset":
        reset_database()
    elif command == "status":
        check_database_status()
    else:
        print("❌ Unknown command:", command)
        sys.exit(1)
