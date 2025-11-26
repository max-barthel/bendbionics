#!/usr/bin/env python3
"""
Development setup script for BendBionics.
This script sets up the development environment with PostgreSQL.
"""

import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent))

from sqlmodel import SQLModel

from app.database import engine
from app.utils.logging import logger


def create_database():
    """Create all database tables for development (idempotent)"""
    logger.info("🔍 Checking database state...")

    try:
        from sqlalchemy import inspect

        # Use inspector to check if tables exist
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        if "user" in tables:
            logger.info("✅ Database tables already exist - skipping creation")
            return True

        logger.info("Creating BendBionics development database tables...")
        # Create all tables (SQLModel.create_all is idempotent)
        SQLModel.metadata.create_all(engine)
        logger.info("✅ Database tables created successfully!")
        logger.info("📊 Tables created:")
        logger.info("   - user (with email verification fields)")
        logger.info("   - preset")
        logger.info("   - All related tables")

        return True

    except Exception as e:
        logger.error(f"❌ Error creating database: {e}")
        return False


def run_migrations():
    """Run database migrations for schema changes using migrate.py"""
    logger.info("🔄 Running database migrations...")

    try:
        # Import and run migrations from migrate.py
        from migrate import run_migrations as run_migration_script

        if run_migration_script():
            logger.info("✅ Migrations completed successfully")
            return True
        logger.error("❌ Migrations failed")
        return False

    except Exception as e:
        logger.error(f"❌ Error running migrations: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


def check_environment():
    """Check if environment is properly configured"""
    logger.info("🔍 Checking environment configuration...")

    # Check if .env file exists
    env_file = Path(__file__).parent / ".env"
    if not env_file.exists():
        logger.warning(
            "⚠️  .env file not found. Please create it with your configuration."
        )
        logger.info("📝 Example .env content:")
        logger.info("""
   # Database
   DATABASE_URL=postgresql://postgres:password@localhost:5432/bendbionics

# Mailgun (for email verification)
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-mailgun-domain
MAILGUN_FROM_EMAIL=noreply@yourdomain.com
MAILGUN_REGION=eu

# Email Verification
EMAIL_VERIFICATION_ENABLED=true
EMAIL_VERIFICATION_URL=http://localhost:5173/verify-email
PASSWORD_RESET_URL=http://localhost:5173/reset-password
        """)
        return False

    logger.info("✅ .env file found")
    return True


def main():
    """Main setup function"""
    logger.info("🌐 BendBionics Development Setup")
    logger.info("=" * 40)

    # Check environment
    if not check_environment():
        logger.error("\n❌ Environment setup incomplete")
        return False

    # Create database tables (idempotent)
    if create_database():
        # Run migrations for existing databases
        if run_migrations():
            logger.info("\n🎉 Development setup completed successfully!")
            logger.info("\n🔧 Next steps:")
            logger.info("   1. Update your .env file with your Mailgun credentials")
            logger.info(
                "   2. Start your application: python -m uvicorn app.main:app --reload"
            )
            logger.info("   3. Test the email verification flow")
            logger.info("\n📝 Database connection:")
            logger.info("   Host: localhost:5432")
            logger.info("   Database: bendbionics")
            logger.info("   Username: postgres")
            return True
        logger.warning("\n⚠️  Database created but migrations failed")
    logger.error("\n❌ Development setup failed")
    return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
