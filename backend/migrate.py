#!/usr/bin/env python3
"""
Database migration script for BendBionics.
This script handles schema changes without losing user data.
"""

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Callable, Dict, Optional
from urllib.parse import urlparse

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent))

from sqlmodel import Session, select, text

from app.config import settings
from app.database import get_session
from app.models.preset import Preset
from app.utils.logging import logger
from app.utils.preset_helpers import extract_preset_metadata, normalize_tendon_radius

# Backup configuration
BACKUP_RETENTION_COUNT = 7  # Keep last 7 backups
BACKUP_DIR_PRODUCTION_1 = "/var/backups/bendbionics/database"
BACKUP_DIR_PRODUCTION_2 = "/mnt/data/backups/database"  # Alternative production locatio
BACKUP_DIR_DEV = Path(__file__).parent.parent / "backups" / "database"


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


def get_backup_directory() -> Path:
    """Get the backup directory path based on environment."""
    # Try production directories first
    for backup_dir_str in [BACKUP_DIR_PRODUCTION_1, BACKUP_DIR_PRODUCTION_2]:
        backup_dir = Path(backup_dir_str)
        try:
            if backup_dir.exists() and os.access(backup_dir_str, os.W_OK):
                return backup_dir
            # Try to create if parent exists
            if backup_dir.parent.exists() and os.access(
                str(backup_dir.parent), os.W_OK
            ):
                backup_dir.mkdir(parents=True, exist_ok=True)
                return backup_dir
        except OSError:
            # Skip this directory if we don't have access (includes PermissionError)
            continue

    # Use dev directory if production doesn't exist or isn't writable
    backup_dir = Path(BACKUP_DIR_DEV)
    backup_dir.mkdir(parents=True, exist_ok=True)
    return backup_dir


def is_permission_error(error: Exception) -> bool:
    """Check if an error is a database permission error."""
    error_str = str(error)
    error_type = type(error).__name__

    # Check for PostgreSQL permission errors
    permission_indicators = [
        "permission denied",
        "InsufficientPrivilege",
        "insufficient_privilege",
        "access denied",
    ]

    return (
        "InsufficientPrivilege" in error_type
        or any(
            indicator.lower() in error_str.lower()
            for indicator in permission_indicators
        )
    )


def database_has_data() -> bool:
    """Check if database has any data (users or presets)."""
    try:
        session = next(get_session())

        # Check if we have any users or presets
        user_count = session.execute(
            text('SELECT COUNT(*) FROM "user"')
        ).fetchone()[0]
        preset_count = session.execute(
            text("SELECT COUNT(*) FROM preset")
        ).fetchone()[0]

        session.close()
        return user_count > 0 or preset_count > 0

    except Exception as e:
        if is_permission_error(e):
            logger.warning(
                f"Permission error checking database data: {e}\n"
                "This indicates the database user lacks necessary privileges."
            )
        else:
            logger.warning(f"Could not check if database has data: {e}")
        # Assume it has data to be safe
        return True


def parse_database_url() -> Dict[str, Optional[str]]:
    """Parse database URL to extract connection parameters."""
    parsed = urlparse(settings.database_url)

    return {
        "host": parsed.hostname or "localhost",
        "port": str(parsed.port) if parsed.port else "5432",
        "database": parsed.path.lstrip("/") if parsed.path else None,
        "username": parsed.username,
        "password": parsed.password,
    }


def create_database_backup() -> Optional[Path]:
    """Create a PostgreSQL database backup.

    Returns:
        Path to backup file if successful, None otherwise
    """
    # Only backup PostgreSQL databases
    if "postgresql" not in settings.database_url:
        logger.info("Skipping backup (not PostgreSQL database)")
        return None

    # Skip backup if database is empty (fresh install)
    if not database_has_data():
        logger.info("Skipping backup (database is empty - fresh install)")
        return None

    try:
        backup_dir = get_backup_directory()
        # Use datetime.now() without timezone for filename (not a security issue)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")  # noqa: DTZ005
        backup_filename = f"bendbionics_backup_{timestamp}.sql"
        backup_path = backup_dir / backup_filename

        logger.info(f"Creating database backup: {backup_path}")

        # Parse database URL
        db_params = parse_database_url()
        if not db_params["database"]:
            logger.error("Could not determine database name from URL")
            return None

        # Build pg_dump command
        env = os.environ.copy()
        if db_params["password"]:
            env["PGPASSWORD"] = db_params["password"]

        cmd = [
            "pg_dump",
            "-h",
            db_params["host"],
            "-p",
            db_params["port"],
            "-U",
            db_params["username"] or "postgres",
            "-d",
            db_params["database"],
            "-F",
            "c",  # Custom format (compressed)
            "-f",
            str(backup_path),
        ]

        # Run pg_dump (pg_dump is a trusted system command)
        result = subprocess.run(  # noqa: S603
            cmd, env=env, capture_output=True, text=True, check=False
        )

        if result.returncode != 0:
            error_output = result.stderr or result.stdout or ""
            logger.error(f"Backup failed: {error_output}")

            # Check if this is a permission error
            if "permission denied" in error_output.lower():
                logger.error(
                    "⚠️  Database permission error detected!\n"
                    "The database user lacks necessary privileges for backups.\n"
                    "To fix this, run the permission fix script:\n"
                    "  sudo scripts/deploy/fix-db-permissions.sh\n"
                    "Or manually grant privileges as the postgres superuser."
                )
            return None

        # Verify backup file exists and has content
        if not backup_path.exists():
            logger.error("Backup file was not created")
            return None

        file_size = backup_path.stat().st_size
        if file_size == 0:
            logger.error("Backup file is empty")
            backup_path.unlink()
            return None

        logger.info(f"✅ Backup created successfully ({file_size / 1024:.1f} KB)")
        return backup_path

    except FileNotFoundError:
        logger.error("pg_dump not found. Install PostgreSQL client tools.")
        return None
    except Exception as e:
        logger.error(f"Error creating backup: {e}")
        return None


def cleanup_old_backups(retention_count: int = BACKUP_RETENTION_COUNT) -> None:
    """Clean up old backups, keeping only the most recent N backups.

    Args:
        retention_count: Number of backups to keep
    """
    try:
        backup_dir = get_backup_directory()

        # Find all backup files
        backup_files = sorted(
            backup_dir.glob("bendbionics_backup_*.sql"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )

        if len(backup_files) <= retention_count:
            logger.info(
                f"Keeping all {len(backup_files)} backups "
                f"(within retention limit of {retention_count})"
            )
            return

        # Delete old backups
        to_delete = backup_files[retention_count:]
        deleted_count = 0
        for backup_file in to_delete:
            try:
                backup_file.unlink()
                deleted_count += 1
            except Exception as e:
                logger.warning(f"Could not delete backup {backup_file}: {e}")

        if deleted_count > 0:
            logger.info(
                f"Cleaned up {deleted_count} old backup(s), "
                f"keeping {retention_count} most recent"
            )

    except Exception as e:
        logger.warning(f"Error cleaning up old backups: {e}")


def apply_migration(
    migration_name: str,
    migration_sql: Optional[str] = None,
    migration_func: Optional[Callable[[Session], bool]] = None,
):
    """Apply a single migration.

    Args:
        migration_name: Name of the migration
        migration_sql: SQL migration script (for SQL-based migrations)
        migration_func: Python function to run (for Python-based migrations)
    """
    session = None
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
        if migration_sql:
            session.execute(text(migration_sql))
        elif migration_func:
            if not migration_func(session):
                logger.error(f"Migration function {migration_name} returned False")
                session.rollback()
                session.close()
                return False
        else:
            logger.error(f"No migration SQL or function provided for {migration_name}")
            if session:
                session.close()
            return False

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
        import traceback
        logger.error(f"Migration error traceback:\n{traceback.format_exc()}")
        if session:
            try:
                session.rollback()
                session.close()
            except Exception:
                pass  # Ignore errors during cleanup
        return False




def migrate_preset_to_jsonb_with_metadata(session: Session) -> bool:
    """Migrate preset table to use JSONB with metadata columns.

    Steps:
    1. Add metadata columns (segments, tendon_count) as nullable
    2. Migrate existing data: normalize JSON, extract metadata
    3. Change configuration column type to JSONB
    """
    try:
        # Step 1: Add metadata columns if they don't exist
        logger.info("Step 1: Adding metadata columns...")
        session.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                              WHERE table_name = 'preset'
                              AND column_name = 'segments') THEN
                    ALTER TABLE preset ADD COLUMN segments INTEGER;
                    CREATE INDEX IF NOT EXISTS
                        ix_preset_segments ON preset(segments);
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                              WHERE table_name = 'preset'
                              AND column_name = 'tendon_count') THEN
                    ALTER TABLE preset ADD COLUMN tendon_count INTEGER;
                    CREATE INDEX IF NOT EXISTS
                        ix_preset_tendon_count ON preset(tendon_count);
                END IF;
            END $$;
        """))

        session.commit()

        # Step 2: Migrate existing data
        logger.info("Step 2: Migrating existing preset data...")
        presets = session.exec(select(Preset)).all()
        migrated_count = 0

        for preset in presets:
            try:
                # Parse existing configuration
                if isinstance(preset.configuration, str):
                    config = json.loads(preset.configuration)
                elif isinstance(preset.configuration, dict):
                    config = preset.configuration
                else:
                    config = {}

                # Normalize configuration
                normalized_config = normalize_tendon_radius(config)
                segments, tendon_count = extract_preset_metadata(normalized_config)

                # Update preset
                preset.configuration = normalized_config
                preset.segments = segments
                preset.tendon_count = tendon_count

                migrated_count += 1
            except Exception as e:
                logger.warning(f"Error migrating preset {preset.id}: {e}")
                continue

        session.commit()
        logger.info(f"Migrated {migrated_count} presets")

        # Step 3: Change configuration column type to JSONB
        logger.info("Step 3: Converting configuration column to JSONB...")
        session.execute(text("""
            DO $$
            BEGIN
                -- Check if column is already JSONB
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'preset'
                    AND column_name = 'configuration'
                    AND data_type = 'jsonb'
                ) THEN
                    RAISE NOTICE 'Configuration column is already JSONB';
                ELSE
                    -- Convert TEXT to JSONB
                    ALTER TABLE preset
                    ALTER COLUMN configuration TYPE JSONB
                    USING configuration::jsonb;
                END IF;
            END $$;
        """))

        session.commit()
        logger.info("✅ Preset migration completed successfully")
        return True

    except Exception as e:
        logger.error(f"❌ Error in preset migration: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


def check_and_handle_permission_error() -> bool:
    """Check for permission errors and log helpful error message.

    Returns:
        True if permission error was detected (migration should stop)
        False if no permission error (migration can continue)
    """
    try:
        session = next(get_session())
        # Try a simple query to check permissions
        session.execute(text('SELECT 1 FROM "user" LIMIT 1'))
        session.close()
        return False
    except Exception as e:
        if is_permission_error(e):
            logger.error(
                "⚠️  Database permission error detected!\n"
                "The database user lacks necessary privileges for "
                "migrations and backups.\n"
                "\n"
                "To fix this issue:\n"
                "1. Run the permission fix script:\n"
                "   sudo scripts/deploy/fix-db-permissions.sh\n"
                "\n"
                "2. Or manually grant privileges as postgres superuser:\n"
                "   sudo -u postgres psql -d bendbionics -c "
                "'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public "
                "TO bendbionics_user;'\n"
                "   sudo -u postgres psql -d bendbionics -c "
                "'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public "
                "TO bendbionics_user;'\n"
                "\n"
                "After fixing permissions, run migrations again."
            )
            return True
        return False


def handle_migration_backup(pending_migrations: list) -> bool:
    """Handle backup creation before migrations.

    Args:
        pending_migrations: List of pending migration names

    Returns:
        True if backup succeeded or is not needed, False if backup failed critically
    """
    if not pending_migrations:
        logger.info("No pending migrations - skipping backup")
        return True

    logger.info(
        f"Found {len(pending_migrations)} pending migration(s): "
        f"{pending_migrations}"
    )
    logger.info("Creating backup before applying migrations...")
    backup_path = create_database_backup()

    if backup_path is None:
        if check_and_handle_permission_error():
            return False

        # If no permission error, check if database has data
        has_data = database_has_data()
        if has_data:
            logger.error(
                "⚠️  Backup creation failed but database has data. "
                "Aborting migrations for safety."
            )
            logger.error(
                "Possible causes:\n"
                "  - Database permission errors (run fix-db-permissions.sh)\n"
                "  - pg_dump not installed\n"
                "  - Backup directory not writable\n"
                "\n"
                "Please resolve the backup issue before running migrations."
            )
            return False

        logger.info("Backup skipped (database is empty - fresh install)")
    else:
        logger.info(f"✅ Backup ready: {backup_path}")

    return True


def run_migrations():
    """Run all pending migrations with automatic backup."""
    logger.info("🔄 Checking for database migrations...")

    if not check_migration_needed():
        logger.error("Failed to check migration status - cannot proceed")
        return False

    applied_migrations = get_applied_migrations()
    logger.info(f"Applied migrations: {applied_migrations}")

    # Check if there are pending migrations
    all_migrations = [
        "add_email_verification_fields",
        "migrate_preset_to_jsonb_with_metadata",
    ]
    pending_migrations = [
        name for name in all_migrations if name not in applied_migrations
    ]

    # Create backup before running migrations
    if not handle_migration_backup(pending_migrations):
        return False

    # Apply pending migrations
    if not apply_pending_migrations(applied_migrations):
        return False

    # Clean up old backups after successful migrations
    if pending_migrations:
        cleanup_old_backups()

    logger.info("✅ All migrations completed successfully")
    return True


def get_migration_definitions():
    """Get all available migration definitions."""
    return [
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
            """,
            "func": None,
        },
        {
            "name": "migrate_preset_to_jsonb_with_metadata",
            "sql": None,
            "func": migrate_preset_to_jsonb_with_metadata,
        },
    ]


def apply_pending_migrations(applied_migrations: list) -> bool:
    """Apply all pending migrations.

    Args:
        applied_migrations: List of already applied migration names

    Returns:
        True if all migrations succeeded, False otherwise
    """
    migrations = get_migration_definitions()

    for migration in migrations:
        if migration["name"] not in applied_migrations:
            logger.info(f"Applying pending migration: {migration['name']}")
            if not apply_migration(
                migration["name"],
                migration.get("sql"),
                migration.get("func"),
            ):
                logger.error(
                    f"Failed to apply migration: {migration['name']}. "
                    "Stopping migration process."
                )
                return False

    return True


if __name__ == "__main__":
    logger.info("🚀 BendBionics Database Migration")
    logger.info("=" * 40)

    if run_migrations():
        logger.info("🎉 Database migrations completed successfully!")
    else:
        logger.error("❌ Database migrations failed")
        sys.exit(1)
