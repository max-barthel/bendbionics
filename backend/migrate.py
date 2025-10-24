#!/usr/bin/env python3
"""
Database migration script for BendBionics.
This script handles schema changes without losing user data.
"""

import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent))

from app.database import get_session
from app.utils.logging import logger
from sqlmodel import text


def check_migration_needed():
    """Check if any migrations are needed"""
    try:
        session = next(get_session())

        # Check if migration tracking table exists
        result = session.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'migrations'
            );
        """)).fetchone()

        if not result[0]:
            # Create migrations table
            session.execute(text("""
                CREATE TABLE migrations (
                    id SERIAL PRIMARY KEY,
                    migration_name VARCHAR(255) UNIQUE NOT NULL,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            session.commit()
            logger.info("Created migrations tracking table")

        session.close()
        return True

    except Exception as e:
        logger.error(f"Error checking migrations: {e}")
        return False


def get_applied_migrations():
    """Get list of applied migrations"""
    try:
        session = next(get_session())
        result = session.execute(text("""
            SELECT migration_name FROM migrations ORDER BY applied_at
        """)).fetchall()

        session.close()
        return [row[0] for row in result]

    except Exception as e:
        logger.error(f"Error getting applied migrations: {e}")
        return []


def apply_migration(migration_name, migration_sql):
    """Apply a single migration"""
    try:
        session = next(get_session())

        # Check if migration already applied
        existing = session.execute(text("""
            SELECT COUNT(*) FROM migrations WHERE migration_name = :name
        """), {"name": migration_name}).fetchone()

        if existing[0] > 0:
            logger.info(f"Migration {migration_name} already applied - skipping")
            session.close()
            return True

        # Apply migration
        logger.info(f"Applying migration: {migration_name}")
        session.execute(text(migration_sql))

        # Record migration
        session.execute(text("""
            INSERT INTO migrations (migration_name) VALUES (:name)
        """), {"name": migration_name})

        session.commit()
        session.close()

        logger.info(f"✅ Migration {migration_name} applied successfully")
        return True

    except Exception as e:
        logger.error(f"❌ Error applying migration {migration_name}: {e}")
        return False


def run_migrations():
    """Run all pending migrations"""
    logger.info("🔄 Checking for database migrations...")

    if not check_migration_needed():
        return False

    applied_migrations = get_applied_migrations()
    logger.info(f"Applied migrations: {applied_migrations}")

    # Define available migrations
    migrations = [
        {
            "name": "add_email_verification_fields",
            "sql": """
                -- Add email verification fields to user table
                DO $$
                BEGIN
                    -- Add email field if not exists
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                                  WHERE table_name = 'user'
                                  AND column_name ='email') THEN
                        ALTER TABLE "user" ADD COLUMN email VARCHAR UNIQUE;
                    END IF;

                    -- Add email_verified field if not exists
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                                  WHERE table_name = 'user'
                                  AND column_name ='email_verified') THEN
                        ALTER TABLE "user" ADD COLUMN email_verified
                        BOOLEAN DEFAULT FALSE;
                    END IF;

                    -- Add email_verification_token field if not exists
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                                  WHERE table_name = 'user'
                                  AND column_name ='email_verification_token') THEN
                        ALTER TABLE "user" ADD COLUMN
                        email_verification_token VARCHAR;
                    END IF;

                    -- Add email_verification_token_expires field if not exists
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                                  WHERE table_name = 'user'
                                  AND column_name =
                                  'email_verification_token_expires') THEN
                        ALTER TABLE "user" ADD COLUMN
                        email_verification_token_expires TIMESTAMP;
                    END IF;

                    -- Add password_reset_token field if not exists
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                                  WHERE table_name = 'user'
                                  AND column_name ='password_reset_token') THEN
                        ALTER TABLE "user" ADD COLUMN password_reset_token VARCHAR;
                    END IF;

                    -- Add password_reset_token_expires field if not exists
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                                  WHERE table_name = 'user'
                                  AND column_name ='password_reset_token_expires') THEN
                        ALTER TABLE "user" ADD COLUMN
                        password_reset_token_expires TIMESTAMP;
                    END IF;
                END $$;
            """
        }
    ]

    # Apply pending migrations
    for migration in migrations:
        if migration["name"] not in applied_migrations:
            if not apply_migration(migration["name"], migration["sql"]):
                return False

    logger.info("✅ All migrations completed successfully")
    return True


if __name__ == "__main__":
    logger.info("🚀 BendBionics Database Migration")
    logger.info("=" * 40)

    if run_migrations():
        logger.info("🎉 Database migrations completed successfully!")
    else:
        logger.error("❌ Database migrations failed")
        sys.exit(1)
