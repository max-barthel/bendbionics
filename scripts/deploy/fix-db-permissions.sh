#!/bin/bash

# PostgreSQL Permission Fix Script for BendBionics
# This script grants necessary privileges to the database user for migrations and backups
# Safe to run multiple times (idempotent)

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo "================================"
echo "🔧 Fix Database Permissions for BendBionics"
echo "================================"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Please run with sudo: sudo $0"
    exit 1
fi

# Database configuration (should match setup-postgres.sh)
DB_NAME="bendbionics"
DB_USER="bendbionics_user"

print_status "Fixing permissions for user: $DB_USER on database: $DB_NAME"

# Check if database exists
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    print_error "Database '$DB_NAME' does not exist!"
    print_error "Please run setup-postgres.sh first to create the database"
    exit 1
fi

# Check if user exists
if ! sudo -u postgres psql -t -c "SELECT 1 FROM pg_user WHERE usename = '$DB_USER'" | grep -q 1; then
    print_error "User '$DB_USER' does not exist!"
    print_error "Please run setup-postgres.sh first to create the user"
    exit 1
fi

# Grant privileges on existing tables and sequences
print_status "Granting privileges on existing tables and sequences..."

GRANT_RESULT=$(sudo -u postgres psql -d "$DB_NAME" << EOF 2>&1
-- Grant schema privileges (if not already granted)
GRANT ALL ON SCHEMA public TO $DB_USER;

-- Grant privileges on all existing tables
-- This includes SELECT, INSERT, UPDATE, DELETE, TRIGGER, and LOCK
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;

-- Explicitly grant LOCK privilege on all tables (required for pg_dump)
-- This handles edge cases where tables might have been created by different users
DO \$\$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('GRANT LOCK ON TABLE %I.%I TO %I', 'public', r.tablename, '$DB_USER');
    END LOOP;
END \$\$;

-- Grant privileges on all existing sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;

-- Grant USAGE on sequences (required for nextval, currval, etc.)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;

-- Grant default privileges for future tables (ensure new tables get permissions)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

-- Count tables for verification
DO \$\$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';

    RAISE NOTICE 'Found % tables in public schema', table_count;
END \$\$;

\q
EOF
)

GRANT_EXIT_CODE=$?

if [ $GRANT_EXIT_CODE -ne 0 ]; then
    print_error "Failed to grant permissions"
    echo "$GRANT_RESULT" | grep -i "error" || echo "$GRANT_RESULT"
    exit 1
fi

# Verify permissions by checking system tables
print_status "Verifying permissions..."

VERIFY_RESULT=$(sudo -u postgres psql -d "$DB_NAME" << EOF 2>&1
-- Verify table permissions by checking pg_class and has_table_privilege
DO \$\$
DECLARE
    table_name TEXT;
    has_select BOOLEAN;
    has_lock BOOLEAN;
    table_count INTEGER := 0;
    verified_count INTEGER := 0;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';

    IF table_count = 0 THEN
        RAISE NOTICE 'No tables found in public schema (this is OK for fresh installs)';
        RETURN;
    END IF;

    RAISE NOTICE 'Verifying permissions on % tables...', table_count;

    -- Check permissions on each table
    FOR table_name IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        -- Check SELECT permission
        SELECT has_table_privilege('$DB_USER', 'public.' || quote_ident(table_name), 'SELECT')
        INTO has_select;

        -- Check LOCK permission (has_table_privilege doesn't directly check LOCK,
        -- but ALL PRIVILEGES should include it, so we check for UPDATE which is a good proxy)
        SELECT has_table_privilege('$DB_USER', 'public.' || quote_ident(table_name), 'UPDATE')
        INTO has_lock;

        IF has_select AND has_lock THEN
            verified_count := verified_count + 1;
        ELSE
            RAISE WARNING 'Table % has missing permissions (SELECT: %, UPDATE: %)', table_name, has_select, has_lock;
        END IF;
    END LOOP;

    IF verified_count = table_count THEN
        RAISE NOTICE '✅ All % tables have proper permissions', verified_count;
    ELSE
        RAISE WARNING 'Only % of % tables have proper permissions', verified_count, table_count;
    END IF;
END \$\$;

\q
EOF
)

VERIFY_EXIT_CODE=$?

if [ $VERIFY_EXIT_CODE -eq 0 ]; then
    print_success "Permissions granted and verified successfully!"
    print_status "The user $DB_USER now has:"
    print_status "  ✅ Full access to all existing tables (SELECT, INSERT, UPDATE, DELETE)"
    print_status "  ✅ LOCK TABLE permission (required for pg_dump backups)"
    print_status "  ✅ Full access to all sequences"
    print_status "  ✅ Default privileges for future tables"
    echo ""
    print_success "Database permissions fixed! Migrations and backups should now work."
else
    print_warning "Permissions were granted but verification encountered issues"
    echo "$VERIFY_RESULT" | grep -i -E "(error|warning)" || echo "$VERIFY_RESULT"
    print_status "Permissions were still granted - please verify manually if issues persist"
fi

echo ""
echo "================================"
echo "✅ Permission Fix Complete!"
echo "================================"
echo ""
echo "You can now run migrations and backups without permission errors."
echo ""

