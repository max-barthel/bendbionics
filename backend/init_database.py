#!/usr/bin/env python3
"""
Database initialization script for BendBionics PostgreSQL database.
This script safely creates tables and handles migrations.
"""

import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent))

from app.database import engine
from app.utils.logging import logger
from sqlmodel import SQLModel, text


def check_database_exists():
    """Check if database tables already exist"""
    try:
        from app.database import engine
        from sqlalchemy import inspect
        
        # Use inspector to check if tables exist
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        return 'user' in tables

    except Exception:
        return False


def create_database():
    """Create all database tables (idempotent - safe to run multiple times)"""
    logger.info("🔍 Checking database state...")

    # Check if tables already exist
    if check_database_exists():
        logger.info("✅ Database tables already exist - skipping creation")
        return True

    logger.info("Creating BendBionics database tables...")

    try:
        # Create all tables (SQLModel.create_all is idempotent)
        SQLModel.metadata.create_all(engine)
        logger.info("✅ Database tables created successfully!")
        logger.info("📊 Tables created:")
        logger.info("   - user (with email verification fields)")
        logger.info("   - preset")
        logger.info("   - All related tables")

    except Exception as e:
        logger.error(f"❌ Error creating database: {e}")
        return False

    return True


def run_migrations():
    """Run database migrations for schema changes"""
    logger.info("🔄 Checking for required migrations...")

    try:
        from app.database import engine
        from sqlalchemy import inspect
        
        # Use inspector to check table structure
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        # Only run migrations if table exists
        if 'user' not in tables:
            logger.info("✅ Fresh database - all tables created with correct schema")
            return True
        
        # Check existing columns
        columns = inspector.get_columns('user')
        existing_columns = [col['name'] for col in columns]
        
        required_email_fields = [
            "email", "email_verified", "email_verification_token",
            "email_verification_token_expires", "password_reset_token",
            "password_reset_token_expires"
        ]

        missing_fields = [field for field in required_email_fields
                         if field not in existing_columns]

        if missing_fields:
            logger.warning(f"⚠️  Missing email verification fields: {missing_fields}")
            logger.info("🔄 Running migration to add email verification fields...")

            from app.database import get_session
            session = next(get_session())

            # Add missing email fields
            for field in missing_fields:
                if field == "email":
                    session.execute(text(
                        'ALTER TABLE "user" ADD COLUMN email VARCHAR UNIQUE'
                    ))
                elif field == "email_verified":
                    session.execute(text(
                        'ALTER TABLE "user" ADD COLUMN email_verified '
                        'BOOLEAN DEFAULT FALSE'
                    ))
                elif field == "email_verification_token":
                    session.execute(text(
                        'ALTER TABLE "user" ADD COLUMN email_verification_token VARCHAR'
                    ))
                elif field == "email_verification_token_expires":
                    session.execute(text(
                        'ALTER TABLE "user" ADD COLUMN '
                        'email_verification_token_expires TIMESTAMP'
                    ))
                elif field == "password_reset_token":
                    session.execute(text(
                        'ALTER TABLE "user" ADD COLUMN password_reset_token VARCHAR'
                    ))
                elif field == "password_reset_token_expires":
                    session.execute(text(
                        'ALTER TABLE "user" ADD COLUMN '
                        'password_reset_token_expires TIMESTAMP'
                    ))

            session.commit()
            session.close()
            logger.info("✅ Email verification fields migration completed!")
        else:
            logger.info("✅ All required fields present - no migration needed")

        return True

    except Exception as e:
        logger.error(f"❌ Error running migrations: {e}")
        return False


def verify_database():
    """Verify database connection and table structure"""
    logger.info("\n🔍 Verifying database structure...")

    try:
        from app.database import get_session
        from sqlmodel import text

        session = next(get_session())

        # Check if user table exists and has email fields
        result = session.execute(text("""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'user'
            ORDER BY ordinal_position
        """)).fetchall()

        logger.info("📋 User table columns:")
        for column_name, data_type in result:
            logger.info(f"   - {column_name}: {data_type}")

        # Check for email verification fields
        email_fields = ["email", "email_verified", "email_verification_token",
                        "email_verification_token_expires", "password_reset_token",
                        "password_reset_token_expires"]

        existing_columns = [row[0] for row in result]
        missing_fields = [
            field for field in email_fields if field not in existing_columns
        ]

        if missing_fields:
            logger.warning(f"⚠️  Missing email verification fields: {missing_fields}")
        else:
            logger.info("✅ All email verification fields present!")

        session.close()
        return True

    except Exception as e:
        logger.error(f"❌ Error verifying database: {e}")
        return False


if __name__ == "__main__":
    logger.info("🚀 BendBionics Database Management")
    logger.info("=" * 50)

    # Create database tables (idempotent)
    if create_database():
        # Run migrations for existing databases
        if run_migrations():
            # Verify database structure
            if verify_database():
                logger.info("\n🎉 Database setup completed successfully!")
                logger.info("🔧 Next steps:")
                logger.info("   1. Update your .env file with your Mailgun credentials")
                logger.info(
                    "   2. Start your application with: "
                    "python -m uvicorn app.main:app --reload"
                )
                logger.info("   3. Test the email verification flow")
            else:
                logger.warning("\n⚠️  Database setup completed but verification failed")
        else:
            logger.warning("\n⚠️  Database created but migrations failed")
    else:
        logger.error("\n❌ Database initialization failed")
        sys.exit(1)
