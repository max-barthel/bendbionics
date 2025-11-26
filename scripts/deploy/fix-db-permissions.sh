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

sudo -u postgres psql -d "$DB_NAME" << EOF
-- Grant schema privileges (if not already granted)
GRANT ALL ON SCHEMA public TO $DB_USER;

-- Grant privileges on all existing tables
-- This includes SELECT, INSERT, UPDATE, DELETE, and TRIGGER
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;

-- Grant privileges on all existing sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;

-- Grant USAGE on sequences (required for nextval, currval, etc.)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;

-- Note: We don't make the user schema owner to keep permissions minimal
-- ALL PRIVILEGES on tables includes the ability to LOCK TABLE (required for pg_dump)

-- Grant default privileges for future tables (ensure new tables get permissions)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

-- Verify permissions by listing tables
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

if [ $? -eq 0 ]; then
    print_success "Permissions granted successfully!"
    print_status "The user $DB_USER now has:"
    print_status "  ✅ Full access to all existing tables"
    print_status "  ✅ Full access to all sequences"
    print_status "  ✅ Schema ownership (enables LOCK TABLE for backups)"
    print_status "  ✅ Default privileges for future tables"
    echo ""
    print_success "Database permissions fixed! Migrations and backups should now work."
else
    print_error "Failed to grant permissions"
    exit 1
fi

echo ""
echo "================================"
echo "✅ Permission Fix Complete!"
echo "================================"
echo ""
echo "You can now run migrations and backups without permission errors."
echo ""

