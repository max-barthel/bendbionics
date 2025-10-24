#!/usr/bin/env python3
"""
Development setup script for BendBionics.
This script sets up the development environment with PostgreSQL.
"""

import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent))

from app.database import engine
from app.utils.logging import logger
from sqlmodel import SQLModel


def create_database():
    """Create all database tables for development"""
    logger.info("🚀 Setting up BendBionics development database...")

    try:
        # Create all tables
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
   DATABASE_URL=postgresql://postgres:password@localhost:5432/bendbionics.db

# Mailgun (for email verification)
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-mailgun-domain
MAILGUN_FROM_EMAIL=noreply@yourdomain.com

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

    # Create database
    if create_database():
        logger.info("\n🎉 Development setup completed successfully!")
        logger.info("\n🔧 Next steps:")
        logger.info("   1. Update your .env file with your Mailgun credentials")
        logger.info(
            "   2. Start your application: python -m uvicorn app.main:app --reload"
        )
        logger.info("   3. Test the email verification flow")
        logger.info("\n📝 Database connection:")
        logger.info("   Host: localhost:5432")
        logger.info("   Database: bendbionics.db")
        logger.info("   Username: postgres")
        return True
    logger.error("\n❌ Development setup failed")
    return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
