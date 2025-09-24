#!/usr/bin/env python3
"""
Migration: Remove obsolete user fields

This migration removes the obsolete fields from the user table:
- email
- is_local
- is_verified

These fields are no longer needed in the current application.
"""

import sqlite3
import sys
from pathlib import Path

# Add the app directory to the path
sys.path.append(str(Path(__file__).parent.parent))

def migrate_database():
    """Remove obsolete fields from user table."""
    db_path = Path(__file__).parent.parent / "soft_robot.db"

    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return False

    try:
        # Connect to the database
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()

        # Check if the obsolete fields exist
        cursor.execute("PRAGMA table_info(user)")
        columns = [row[1] for row in cursor.fetchall()]

        obsolete_fields = ["email", "is_local", "is_verified"]
        fields_to_remove = [field for field in obsolete_fields if field in columns]

        if not fields_to_remove:
            print("No obsolete fields found to remove.")
            return True

        print(f"Found obsolete fields to remove: {fields_to_remove}")

        # Create a new table with the correct schema
        cursor.execute("""
            CREATE TABLE user_new (
                id INTEGER NOT NULL,
                username VARCHAR NOT NULL,
                is_active BOOLEAN NOT NULL,
                hashed_password VARCHAR NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                PRIMARY KEY (id)
            )
        """)

        # Create unique index for username (with a different name first)
        cursor.execute("CREATE UNIQUE INDEX ix_user_username_new ON user_new (username)")

        # Copy data from old table to new table
        cursor.execute("""
            INSERT INTO user_new (id, username, is_active, hashed_password, created_at, updated_at)
            SELECT id, username, is_active, hashed_password, created_at, updated_at
            FROM user
        """)

        # Drop the old table
        cursor.execute("DROP TABLE user")

        # Rename the new table
        cursor.execute("ALTER TABLE user_new RENAME TO user")

        # Drop the old index and create the new one with the standard name
        cursor.execute("DROP INDEX IF EXISTS ix_user_username")
        cursor.execute("CREATE UNIQUE INDEX ix_user_username ON user (username)")

        # Commit the changes
        conn.commit()
        print("Successfully removed obsolete fields from user table.")
        return True

    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    success = migrate_database()
    sys.exit(0 if success else 1)
