#!/usr/bin/env python3
"""
Script to manually create database tables for Railway deployment
Run this if the automatic table creation doesn't work
"""

import os
import sys

from sqlalchemy import create_engine, text

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import Settings
from app.database import create_db_and_tables


def main():
    """Create database tables manually"""
    settings = Settings()

    print(f"Connecting to database: {settings.database_url}")

    try:
        # Create tables
        create_db_and_tables()
        print("✅ Database tables created successfully!")

        # Test connection
        engine = create_engine(settings.database_url)
        with engine.connect() as conn:
            result = conn.execute(
                text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
                )
            )
            tables = [row[0] for row in result]
            print(f"📋 Available tables: {tables}")

    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
