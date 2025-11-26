#!/bin/bash

# PostgreSQL Permission Fix Script for BendBionics
# This script transfers ownership and grants necessary privileges to the database user
# for migrations and backups. Ownership is required for ALTER TABLE statements in migrations.
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

# Transfer ownership of all tables and sequences to bendbionics_user
# This is required for migrations to run ALTER TABLE statements
print_status "Transferring ownership of tables and sequences to $DB_USER..."

OWNERSHIP_RESULT=$(sudo -u postgres psql -d "$DB_NAME" << EOF 2>&1
-- Transfer ownership of all tables in public schema
DO \$\$
DECLARE
    r RECORD;
    table_count INTEGER := 0;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM pg_tables
    WHERE schemaname = 'public';

    IF table_count = 0 THEN
        RAISE NOTICE 'No tables found in public schema (this is OK for fresh installs)';
        RETURN;
    END IF;

    RAISE NOTICE 'Transferring ownership of % tables...', table_count;

    -- Transfer ownership of each table
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I OWNER TO %I', 'public', r.tablename, '$DB_USER');
    END LOOP;

    RAISE NOTICE '✅ All tables ownership transferred';
END \$\$;

-- Transfer ownership of all sequences in public schema
DO \$\$
DECLARE
    r RECORD;
    sequence_count INTEGER := 0;
BEGIN
    -- Count sequences
    SELECT COUNT(*) INTO sequence_count
    FROM pg_sequences
    WHERE schemaname = 'public';

    IF sequence_count = 0 THEN
        RAISE NOTICE 'No sequences found in public schema';
        RETURN;
    END IF;

    RAISE NOTICE 'Transferring ownership of % sequences...', sequence_count;

    -- Transfer ownership of each sequence
    FOR r IN
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE format('ALTER SEQUENCE %I.%I OWNER TO %I', 'public', r.sequence_name, '$DB_USER');
    END LOOP;

    RAISE NOTICE '✅ All sequences ownership transferred';
END \$\$;

\q
EOF
)

OWNERSHIP_EXIT_CODE=$?

if [ $OWNERSHIP_EXIT_CODE -ne 0 ]; then
    print_error "Failed to transfer ownership"
    echo "$OWNERSHIP_RESULT" | grep -i "error" || echo "$OWNERSHIP_RESULT"
    exit 1
fi

print_success "Ownership transferred successfully"

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

# Verify ownership and permissions by checking system tables
print_status "Verifying ownership and permissions..."

VERIFY_RESULT=$(sudo -u postgres psql -d "$DB_NAME" << EOF 2>&1
-- Verify table ownership and permissions
DO \$\$
DECLARE
    table_name TEXT;
    table_owner TEXT;
    has_select BOOLEAN;
    has_lock BOOLEAN;
    table_count INTEGER := 0;
    ownership_verified_count INTEGER := 0;
    permission_verified_count INTEGER := 0;
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

    RAISE NOTICE 'Verifying ownership and permissions on % tables...', table_count;

    -- Check ownership and permissions on each table
    FOR table_name IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        -- Check ownership
        SELECT pg_get_userbyid(c.relowner) INTO table_owner
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = table_name;

        IF table_owner = '$DB_USER' THEN
            ownership_verified_count := ownership_verified_count + 1;
        ELSE
            RAISE WARNING 'Table % is owned by % (expected: $DB_USER)', table_name, table_owner;
        END IF;

        -- Check SELECT permission
        SELECT has_table_privilege('$DB_USER', 'public.' || quote_ident(table_name), 'SELECT')
        INTO has_select;

        -- Check UPDATE permission (proxy for LOCK)
        SELECT has_table_privilege('$DB_USER', 'public.' || quote_ident(table_name), 'UPDATE')
        INTO has_lock;

        IF has_select AND has_lock THEN
            permission_verified_count := permission_verified_count + 1;
        ELSE
            RAISE WARNING 'Table % has missing permissions (SELECT: %, UPDATE: %)', table_name, has_select, has_lock;
        END IF;
    END LOOP;

    IF ownership_verified_count = table_count THEN
        RAISE NOTICE '✅ All % tables are owned by $DB_USER', ownership_verified_count;
    ELSE
        RAISE WARNING 'Only % of % tables are owned by $DB_USER', ownership_verified_count, table_count;
    END IF;

    IF permission_verified_count = table_count THEN
        RAISE NOTICE '✅ All % tables have proper permissions', permission_verified_count;
    ELSE
        RAISE WARNING 'Only % of % tables have proper permissions', permission_verified_count, table_count;
    END IF;
END \$\$;

-- Verify sequence ownership
DO \$\$
DECLARE
    sequence_name TEXT;
    sequence_owner TEXT;
    sequence_count INTEGER := 0;
    ownership_verified_count INTEGER := 0;
BEGIN
    -- Count sequences
    SELECT COUNT(*) INTO sequence_count
    FROM information_schema.sequences
    WHERE sequence_schema = 'public';

    IF sequence_count = 0 THEN
        RAISE NOTICE 'No sequences found in public schema';
        RETURN;
    END IF;

    RAISE NOTICE 'Verifying ownership of % sequences...', sequence_count;

    -- Check ownership of each sequence
    FOR sequence_name IN
        SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
    LOOP
        -- Check ownership
        SELECT pg_get_userbyid(c.relowner) INTO sequence_owner
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = sequence_name;

        IF sequence_owner = '$DB_USER' THEN
            ownership_verified_count := ownership_verified_count + 1;
        ELSE
            RAISE WARNING 'Sequence % is owned by % (expected: $DB_USER)', sequence_name, sequence_owner;
        END IF;
    END LOOP;

    IF ownership_verified_count = sequence_count THEN
        RAISE NOTICE '✅ All % sequences are owned by $DB_USER', ownership_verified_count;
    ELSE
        RAISE WARNING 'Only % of % sequences are owned by $DB_USER', ownership_verified_count, sequence_count;
    END IF;
END \$\$;

\q
EOF
)

VERIFY_EXIT_CODE=$?

if [ $VERIFY_EXIT_CODE -eq 0 ]; then
    print_success "Ownership transferred and permissions granted successfully!"
    print_status "The user $DB_USER now has:"
    print_status "  ✅ Ownership of all existing tables (required for ALTER TABLE in migrations)"
    print_status "  ✅ Ownership of all existing sequences"
    print_status "  ✅ Full access to all existing tables (SELECT, INSERT, UPDATE, DELETE)"
    print_status "  ✅ LOCK TABLE permission (required for pg_dump backups)"
    print_status "  ✅ Full access to all sequences"
    print_status "  ✅ Default privileges for future tables"
    echo ""
    print_success "Database permissions fixed! Migrations and backups should now work."
else
    print_warning "Ownership and permissions were set but verification encountered issues"
    echo "$VERIFY_RESULT" | grep -i -E "(error|warning)" || echo "$VERIFY_RESULT"
    print_status "Ownership and permissions were still set - please verify manually if issues persist"
fi

echo ""
echo "================================"
echo "✅ Permission Fix Complete!"
echo "================================"
echo ""
echo "You can now run migrations and backups without permission errors."
echo ""

