#!/bin/bash

# PostgreSQL Setup Script for BendBionics
# This script sets up the PostgreSQL database and user for production deployment

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
echo "🐘 PostgreSQL Setup for BendBionics"
echo "================================"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Please run with sudo: sudo $0"
    exit 1
fi

# Install PostgreSQL if not present
print_status "Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null; then
    print_status "Installing PostgreSQL..."
    apt update
    apt install -y postgresql postgresql-contrib
    print_success "PostgreSQL installed"
else
    print_success "PostgreSQL is already installed"
fi

# Start PostgreSQL service
print_status "Starting PostgreSQL service..."
systemctl start postgresql
systemctl enable postgresql
print_success "PostgreSQL service started"

# Generate a secure password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# Database configuration
DB_NAME="bendbionics"
DB_USER="bendbionics_user"

print_status "Creating PostgreSQL database and user..."

# Create database and user
sudo -u postgres psql << EOF
-- Create user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
  ELSE
    ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect to the database and grant schema privileges
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;

-- Grant default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

\q
EOF

print_success "Database and user created successfully"

# Configure PostgreSQL to allow password authentication
print_status "Configuring PostgreSQL authentication..."

PG_HBA_FILE=$(sudo -u postgres psql -t -P format=unaligned -c 'SHOW hba_file')

# Backup the original file
cp "$PG_HBA_FILE" "$PG_HBA_FILE.backup.$(date +%Y%m%d-%H%M%S)"

# Add or update the authentication rule for the bendbionics user
# This allows local connections with password authentication
if ! grep -q "local.*$DB_NAME.*$DB_USER.*md5" "$PG_HBA_FILE"; then
    # Add before the default local rules
    sed -i "/^local.*all.*all.*peer/i local   $DB_NAME    $DB_USER                                md5" "$PG_HBA_FILE"
    print_success "Added authentication rule"
else
    print_warning "Authentication rule already exists"
fi

# Reload PostgreSQL configuration
systemctl reload postgresql
print_success "PostgreSQL configuration reloaded"

# Create .env.production file
print_status "Creating .env.production file..."

ENV_FILE="/var/www/bendbionics-app/backend/.env.production"
mkdir -p "$(dirname "$ENV_FILE")"

cat > "$ENV_FILE" << EOF
# BendBionics Production Environment Configuration
# Generated: $(date)

# Application Settings
APP_NAME="BendBionics API"
DEBUG=false
LOG_LEVEL=INFO

# CORS Configuration
# Update with your actual production domains
CORS_ORIGINS=["https://bendbionics.com", "https://www.bendbionics.com"]
CORS_ALLOW_ALL_ORIGINS=false

# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# Authentication
SECRET_KEY=$SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Settings (Mailgun)
# Note: These are set by GitHub Actions during deployment
# If you need to update them manually, see EMAIL_SETUP.md
MAILGUN_API_KEY=PLACEHOLDER_SET_BY_GITHUB_ACTIONS
MAILGUN_DOMAIN=PLACEHOLDER_SET_BY_GITHUB_ACTIONS
MAILGUN_FROM_EMAIL=noreply@bendbionics.com
MAILGUN_FROM_NAME=BendBionics

# Email Verification
# This will be enabled once Mailgun credentials are deployed
EMAIL_VERIFICATION_ENABLED=false
EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS=24
EMAIL_VERIFICATION_URL=https://bendbionics.com/verify-email

# Password Reset
PASSWORD_RESET_TOKEN_EXPIRE_HOURS=1
PASSWORD_RESET_URL=https://bendbionics.com/reset-password

# Frontend/Backend URLs - UPDATE THESE!
FRONTEND_URL=https://bendbionics.com
BACKEND_URL=https://api.bendbionics.com
EOF

# Set proper permissions
chown www-data:www-data "$ENV_FILE"
chmod 600 "$ENV_FILE"

print_success ".env.production file created at $ENV_FILE"

# Save credentials to a secure location
CREDS_FILE="/root/.bendbionics-db-credentials"
cat > "$CREDS_FILE" << EOF
BendBionics Database Credentials
Generated: $(date)

Database: $DB_NAME
User: $DB_USER
Password: $DB_PASSWORD

Database URL: postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

Secret Key: $SECRET_KEY

IMPORTANT: Keep this file secure! Delete after noting the credentials.
EOF

chmod 600 "$CREDS_FILE"

echo ""
echo "================================"
echo "✅ PostgreSQL Setup Complete!"
echo "================================"
echo ""
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Password: $DB_PASSWORD"
echo ""
echo "Secret Key: $SECRET_KEY"
echo ""
print_warning "IMPORTANT: Save these credentials securely!"
print_warning "Credentials also saved to: $CREDS_FILE"
echo ""
echo "Next steps:"
echo "1. Update CORS_ORIGINS in $ENV_FILE with your actual domain(s)"
echo "2. Configure Mailgun settings in $ENV_FILE"
echo "3. Update FRONTEND_URL and BACKEND_URL in $ENV_FILE"
echo "4. Run the deployment script to initialize the database"
echo ""
print_success "PostgreSQL is now ready for BendBionics!"

