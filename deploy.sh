#!/bin/bash

# BendBionics - Complete Deployment Workflow
# Handles build, upload, deploy, and cleanup in one script
# Feature-parity with GitHub Actions deployment workflow

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SERVER_USER="serveruser"
SERVER_HOST="${SERVER_HOST:-bendbionics}"
SERVER_PATH="/tmp"

# Deployment package tracking (replaces .last_deployment_package file)
DEPLOY_PACKAGE=""
PACKAGE_NAME=""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}🚀 Complete Deployment Workflow${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --skip-build     Skip the build step (use existing build)"
    echo "  --skip-upload    Skip the upload step (use existing package on server)"
    echo "  --skip-deploy    Skip the deploy step (just cleanup)"
    echo "  --skip-tests     Skip running tests (not recommended)"
    echo "  --cleanup-only   Only cleanup old deployment packages"
    echo "  --help           Show this help message"
    echo ""
    echo "Authentication:"
    echo "  This script uses SSH key authentication."
    echo "  Make sure you have SSH keys set up:"
    echo "    ssh-copy-id $SERVER_USER@$SERVER_HOST"
    echo ""
    echo "Sudo Configuration:"
    echo "  The deployment script requires sudo privileges on the server."
    echo "  Set up passwordless sudo for deployment:"
    echo "    ./setup-sudo.sh"
    echo ""
    echo "This script handles the complete deployment workflow:"
    echo "1. Install dependencies"
    echo "2. Run tests (frontend and backend)"
    echo "3. Build the application"
    echo "4. Create deployment package"
    echo "5. Validate Mailgun configuration"
    echo "6. Upload to server"
    echo "7. Deploy on server"
    echo "8. Health check"
    echo "9. Verify deployment"
    echo "10. Cleanup"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi

    # Check required commands
    local required_commands=("scp" "ssh" "curl" "tar")
    local missing_commands=()

    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_commands+=("$cmd")
        fi
    done

    if [ ${#missing_commands[@]} -ne 0 ]; then
        print_error "Missing required commands: ${missing_commands[*]}"
        exit 1
    fi

    # Check for bun
    if ! command -v bun &> /dev/null; then
        print_error "Bun is not installed. Install from https://bun.sh"
        exit 1
    fi
    print_status "Bun version: $(bun --version) ✓"

    # Check for uv
    if ! command -v uv &> /dev/null; then
        print_error "uv is not installed. Install from https://github.com/astral-sh/uv"
        exit 1
    fi
    print_status "uv version: $(uv --version) ✓"

    print_success "Prerequisites check completed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."

    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    bun install
    cd ..

    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    uv sync
    cd ..

    print_success "Dependencies installed"
}

# Function to setup test database
setup_test_database() {
    print_status "Setting up test database..."

    # Check if PostgreSQL is available
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client (psql) not found. Backend tests may fail."
        print_warning "Install PostgreSQL client or use --skip-tests to proceed"
        return 1
    fi

    # Detect PostgreSQL user (try system user first, then postgres)
    local pg_user=""
    local system_user=$(whoami)

    print_status "Detecting PostgreSQL user..."

    # Try connecting with system user first (macOS default)
    if psql -U "$system_user" -d postgres -c "SELECT 1" >/dev/null 2>&1; then
        pg_user="$system_user"
        print_status "Using system user: $pg_user"
    # Try postgres user (Linux default)
    elif psql -U postgres -d postgres -c "SELECT 1" >/dev/null 2>&1; then
        pg_user="postgres"
        print_status "Using postgres user"
    else
        print_error "Cannot connect to PostgreSQL with either '$system_user' or 'postgres' user"
        print_error "Please ensure PostgreSQL is running and accessible"
        return 1
    fi

    # Create test database if it doesn't exist
    print_status "Checking if test database exists..."
    if ! psql -U "$pg_user" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='bendbionics_test'" | grep -q 1; then
        print_status "Creating test database: bendbionics_test"
        if psql -U "$pg_user" -d postgres -c "CREATE DATABASE bendbionics_test" >/dev/null 2>&1; then
            print_success "Test database created"
        else
            print_error "Failed to create test database"
            return 1
        fi
    else
        print_status "Test database already exists"
    fi

    # Set TEST_DATABASE_URL with detected user
    # Use connection string without password (relies on peer authentication or .pgpass)
    local test_db_url="postgresql://${pg_user}@localhost:5432/bendbionics_test"

    # If TEST_DATABASE_URL is already set, use it (allows override)
    if [ -n "${TEST_DATABASE_URL:-}" ]; then
        test_db_url="$TEST_DATABASE_URL"
        print_status "Using provided TEST_DATABASE_URL: $test_db_url"
    else
        export TEST_DATABASE_URL="$test_db_url"
        print_status "Set TEST_DATABASE_URL: $test_db_url"
    fi

    # Verify connection works
    print_status "Verifying database connection..."
    if psql -U "$pg_user" -d bendbionics_test -c "SELECT 1" >/dev/null 2>&1; then
        print_success "Test database connection verified"
        return 0
    else
        print_error "Cannot connect to test database"
        return 1
    fi
}

# Function to run tests
run_tests() {
    print_status "Running tests..."

    # Run frontend tests
    print_status "Running frontend tests..."
    cd frontend
    if ! bun run test:run; then
        print_error "Frontend tests failed"
        cd ..
        exit 1
    fi
    cd ..
    print_success "Frontend tests passed"

    # Setup test database (optional, warn if fails)
    if ! setup_test_database; then
        print_warning "Test database setup failed, but continuing..."
        print_warning "Backend tests may fail. Use --skip-tests to skip testing."
    fi

    # Run backend tests
    print_status "Running backend tests..."
    cd backend
    if ! uv run pytest tests/ -v; then
        print_error "Backend tests failed"
        cd ..
        exit 1
    fi
    cd ..
    print_success "Backend tests passed"

    print_success "All tests passed"
}

# Function to build the application
build_application() {
    print_status "Building application..."

    if [ -f "./build.sh" ]; then
        ./build.sh
        print_success "Build completed"
    else
        print_error "build.sh not found"
        exit 1
    fi
}

# Function to create deployment package
create_deployment_package() {
    print_status "Creating deployment package..."

    # Create deployment directory (matching GitHub Actions)
    DEPLOY_DIR="deploy/web-build-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$DEPLOY_DIR"

    # Copy frontend build
    if [ ! -d "frontend/dist" ]; then
        print_error "Frontend build not found. Run build first."
        exit 1
    fi
    mkdir -p "$DEPLOY_DIR/frontend"
    cp -r frontend/dist/* "$DEPLOY_DIR/frontend/"

    # Copy backend files (exclude test files and cache)
    mkdir -p "$DEPLOY_DIR/backend"
    cp -r backend/app "$DEPLOY_DIR/backend/"

    # Copy database initialization and migration scripts
    cp backend/init_database.py "$DEPLOY_DIR/backend/"
    cp backend/migrate.py "$DEPLOY_DIR/backend/"

    # Copy pyproject.toml (needed for uv)
    cp backend/pyproject.toml "$DEPLOY_DIR/backend/"

    # Clean up any __pycache__ directories that might have been copied
    find "$DEPLOY_DIR/backend" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$DEPLOY_DIR/backend" -name "*.pyc" -delete 2>/dev/null || true
    # Exclude test files
    find "$DEPLOY_DIR/backend" -path "*/tests/*" -type f -delete 2>/dev/null || true
    find "$DEPLOY_DIR/backend" -name "*_test.py" -type f -delete 2>/dev/null || true
    find "$DEPLOY_DIR/backend" -name "test_*.py" -type f -delete 2>/dev/null || true

    # Copy deployment configurations
    cp -r config/nginx "$DEPLOY_DIR/"
    cp -r config/systemd "$DEPLOY_DIR/"

    # Copy deployment scripts
    cp scripts/deploy/server-deploy.sh "$DEPLOY_DIR/deploy.sh"
    cp scripts/deploy/start-backend.sh "$DEPLOY_DIR/start-backend.sh"
    chmod +x "$DEPLOY_DIR/deploy.sh"
    chmod +x "$DEPLOY_DIR/start-backend.sh"

    # Copy database permission fix script
    mkdir -p "$DEPLOY_DIR/scripts/deploy"
    cp scripts/deploy/fix-db-permissions.sh "$DEPLOY_DIR/scripts/deploy/fix-db-permissions.sh"
    chmod +x "$DEPLOY_DIR/scripts/deploy/fix-db-permissions.sh"

    # Copy PostgreSQL setup script
    if [ -f "scripts/deploy/setup-postgres.sh" ]; then
        cp scripts/deploy/setup-postgres.sh "$DEPLOY_DIR/setup-postgres.sh"
        chmod +x "$DEPLOY_DIR/setup-postgres.sh"
    fi

    # Copy DDNS scripts (optional, for dynamic DNS setup)
    if [ -d "scripts/ddns" ]; then
        mkdir -p "$DEPLOY_DIR/scripts/ddns"
        cp -r scripts/ddns/* "$DEPLOY_DIR/scripts/ddns/"
        # Make all shell scripts executable
        find "$DEPLOY_DIR/scripts/ddns" -name "*.sh" -type f -exec chmod +x {} \;
    fi

    # Store package name for later steps
    DEPLOY_PACKAGE="$DEPLOY_DIR"
    PACKAGE_NAME=$(basename "$DEPLOY_DIR")

    print_success "Deployment package created: $DEPLOY_DIR"
}

# Function to validate Mailgun secrets
validate_mailgun_secrets() {
    print_status "Validating Mailgun configuration..."

    local env_file="backend/.env.production"

    if [ ! -f "$env_file" ]; then
        print_error ".env.production file not found at $env_file"
        print_error "Please create it with MAILGUN_API_KEY and MAILGUN_DOMAIN"
        exit 1
    fi

    # Read Mailgun secrets from .env.production
    local mailgun_api_key=""
    local mailgun_domain=""

    # Source the file to read variables (handle comments and empty lines)
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip comments and empty lines
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "${line// }" ]] && continue

        # Extract MAILGUN_API_KEY
        if [[ "$line" =~ ^[[:space:]]*MAILGUN_API_KEY[[:space:]]*=[[:space:]]*(.+)$ ]]; then
            mailgun_api_key="${BASH_REMATCH[1]}"
            # Remove quotes if present
            mailgun_api_key="${mailgun_api_key%\"}"
            mailgun_api_key="${mailgun_api_key#\"}"
            mailgun_api_key="${mailgun_api_key%\'}"
            mailgun_api_key="${mailgun_api_key#\'}"
        fi

        # Extract MAILGUN_DOMAIN
        if [[ "$line" =~ ^[[:space:]]*MAILGUN_DOMAIN[[:space:]]*=[[:space:]]*(.+)$ ]]; then
            mailgun_domain="${BASH_REMATCH[1]}"
            # Remove quotes if present
            mailgun_domain="${mailgun_domain%\"}"
            mailgun_domain="${mailgun_domain#\"}"
            mailgun_domain="${mailgun_domain%\'}"
            mailgun_domain="${mailgun_domain#\'}"
        fi
    done < "$env_file"

    # Check if secrets are set
    if [ -z "$mailgun_api_key" ]; then
        print_error "MAILGUN_API_KEY not found in $env_file"
        print_error "Please add MAILGUN_API_KEY to your .env.production file"
        exit 1
    fi

    if [ -z "$mailgun_domain" ]; then
        print_error "MAILGUN_DOMAIN not found in $env_file"
        print_error "Please add MAILGUN_DOMAIN to your .env.production file"
        exit 1
    fi

    # Validate domain format (should not include protocol)
    if [[ "$mailgun_domain" == http* ]]; then
        print_error "MAILGUN_DOMAIN should not include protocol (http/https)"
        print_error "Use: mg.yourdomain.com"
        print_error "Not: https://mg.yourdomain.com"
        exit 1
    fi

    echo "✅ Mailgun secrets validation passed"
    echo "   Domain: $mailgun_domain"
    echo "   API Key: ${mailgun_api_key:0:8}..."

    # Export for use in create_production_env_file
    export MAILGUN_API_KEY="$mailgun_api_key"
    export MAILGUN_DOMAIN="$mailgun_domain"
}

# Function to create production environment file
create_production_env_file() {
    print_status "Creating production environment file..."

    if [ -z "$DEPLOY_PACKAGE" ] || [ ! -d "$DEPLOY_PACKAGE" ]; then
        print_error "Deployment package not found. Run create_deployment_package first."
        exit 1
    fi

    # Read Mailgun secrets (should be exported from validate_mailgun_secrets)
    local mailgun_api_key="${MAILGUN_API_KEY:-}"
    local mailgun_domain="${MAILGUN_DOMAIN:-}"

    # If not exported, read from .env.production again
    if [ -z "$mailgun_api_key" ] || [ -z "$mailgun_domain" ]; then
        local env_file="backend/.env.production"
        while IFS= read -r line || [ -n "$line" ]; do
            [[ "$line" =~ ^[[:space:]]*# ]] && continue
            [[ -z "${line// }" ]] && continue
            if [[ "$line" =~ ^[[:space:]]*MAILGUN_API_KEY[[:space:]]*=[[:space:]]*(.+)$ ]]; then
                mailgun_api_key="${BASH_REMATCH[1]}"
                mailgun_api_key="${mailgun_api_key%\"}"
                mailgun_api_key="${mailgun_api_key#\"}"
                mailgun_api_key="${mailgun_api_key%\'}"
                mailgun_api_key="${mailgun_api_key#\'}"
            fi
            if [[ "$line" =~ ^[[:space:]]*MAILGUN_DOMAIN[[:space:]]*=[[:space:]]*(.+)$ ]]; then
                mailgun_domain="${BASH_REMATCH[1]}"
                mailgun_domain="${mailgun_domain%\"}"
                mailgun_domain="${mailgun_domain#\"}"
                mailgun_domain="${mailgun_domain%\'}"
                mailgun_domain="${mailgun_domain#\'}"
            fi
        done < "$env_file"
    fi

    # Create .env.production with email configuration
    cat > "$DEPLOY_PACKAGE/backend/.env.production" << EOF
# BendBionics Production Environment Configuration
# Generated by deploy.sh during deployment

# Application Settings
APP_NAME=BendBionics API
DEBUG=false
LOG_LEVEL=INFO

# CORS Configuration
CORS_ORIGINS=["https://bendbionics.com", "https://www.bendbionics.com"]
CORS_ALLOW_ALL_ORIGINS=false

# Database Configuration
# Note: DATABASE_URL and SECRET_KEY are set by setup-postgres.sh on server
# This file will be merged with server settings during deployment

# Email Settings (Mailgun)
MAILGUN_API_KEY=${mailgun_api_key}
MAILGUN_DOMAIN=${mailgun_domain}
MAILGUN_REGION=eu
MAILGUN_FROM_EMAIL=noreply@bendbionics.com
MAILGUN_FROM_NAME=BendBionics

# Email Verification
EMAIL_VERIFICATION_ENABLED=true
EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS=24
EMAIL_VERIFICATION_URL=https://bendbionics.com/verify-email

# Password Reset
PASSWORD_RESET_TOKEN_EXPIRE_HOURS=1
PASSWORD_RESET_URL=https://bendbionics.com/reset-password

# Frontend/Backend URLs
FRONTEND_URL=https://bendbionics.com
BACKEND_URL=https://bendbionics.com
EOF

    print_success "Production environment file created with email configuration"
}

# Function to validate server configuration
validate_server_config() {
    print_status "Validating server configuration..."

    # Check if SERVER_HOST is set
    if [ -z "$SERVER_HOST" ] || [ "$SERVER_HOST" = "bendbionics" ]; then
        print_warning "SERVER_HOST not explicitly set, using default: $SERVER_HOST"
        print_warning "Set SERVER_HOST environment variable or update script config"
    fi

    # Test SSH connection
    print_status "Testing SSH connection..."
    if ssh -o ConnectTimeout=5 -o BatchMode=yes "$SERVER_USER@$SERVER_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
        print_success "SSH connection working"
    else
        print_warning "SSH connection test failed, but continuing..."
        print_status "If deployment fails, make sure SSH keys are set up:"
        print_status "Run: ssh-copy-id $SERVER_USER@$SERVER_HOST"
    fi

    # Test sudo configuration
    print_status "Testing sudo configuration..."
    if ssh -o ConnectTimeout=5 -o BatchMode=yes "$SERVER_USER@$SERVER_HOST" "sudo -n echo 'Sudo access working'" >/dev/null 2>&1; then
        print_success "Sudo configuration working"
    else
        print_warning "Sudo configuration test failed"
        print_status "If deployment fails, set up sudo configuration:"
        print_status "Run: ./setup-sudo.sh"
        print_status "This will configure passwordless sudo for deployment"
    fi

    print_success "Server configuration validation completed"
}

# Function to configure SSH known hosts
configure_ssh_known_hosts() {
    print_status "Configuring SSH known hosts..."

    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    # Add server host key to known_hosts to avoid "Host key verification failed"
    ssh-keyscan -H "$SERVER_HOST" >> ~/.ssh/known_hosts 2>/dev/null || true
    chmod 600 ~/.ssh/known_hosts

    print_success "SSH known hosts configured"
}

# Function to upload to server
upload_to_server() {
    print_status "Uploading to server..."

    if [ -z "$DEPLOY_PACKAGE" ] || [ ! -d "$DEPLOY_PACKAGE" ]; then
        print_error "No deployment package found. Run build and create_deployment_package first."
        exit 1
    fi

    print_status "Compressing deployment package..."
    tar -czf "${PACKAGE_NAME}.tar.gz" -C deploy "$PACKAGE_NAME"

    print_status "Uploading compressed package: ${PACKAGE_NAME}.tar.gz"
    scp "${PACKAGE_NAME}.tar.gz" "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"

    print_status "Extracting package on server..."
    ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && tar -xzf ${PACKAGE_NAME}.tar.gz && rm -f ${PACKAGE_NAME}.tar.gz"

    print_status "Cleaning up local compressed package..."
    rm -f "${PACKAGE_NAME}.tar.gz"

    print_success "Upload completed"
}

# Function to deploy on server
deploy_on_server() {
    print_status "Deploying on server..."

    if [ -z "$PACKAGE_NAME" ]; then
        print_error "Package name not found. Run create_deployment_package first."
        exit 1
    fi

    print_status "Deploying package: $PACKAGE_NAME"
    # Deploy with sudo (requires passwordless sudo setup)
    ssh -tt "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH/$PACKAGE_NAME && sudo ./deploy.sh"

    if [ $? -eq 0 ]; then
        print_success "Deployment completed successfully"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Function to perform health check
health_check() {
    print_status "Checking application health..."

    MAX_ATTEMPTS=12
    ATTEMPT=0
    SLEEP_INTERVAL=5

    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if curl -f -s https://bendbionics.com/health > /dev/null 2>&1; then
            print_success "Health check passed!"
            return 0
        fi

        ATTEMPT=$((ATTEMPT + 1))
        if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
            print_status "Attempt $ATTEMPT/$MAX_ATTEMPTS failed, retrying in ${SLEEP_INTERVAL}s..."
            sleep $SLEEP_INTERVAL
        fi
    done

    print_error "Health check failed after $MAX_ATTEMPTS attempts"
    exit 1
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment and cleanup results..."

    ssh "$SERVER_USER@$SERVER_HOST" "
        # Verify service is running
        echo '📊 Service Status:'
        sudo systemctl is-active bendbionics-api || echo '⚠️  Service check failed'

        # Check disk usage after cleanup
        echo '💾 Disk Usage:'
        df -h / | tail -1

        # Verify backup was created
        echo '💾 Backup Status:'
        ls -lht /mnt/data/backups/database/ 2>/dev/null | head -3 || echo '⚠️  Backup directory not found'

        # Check journal size
        echo '📝 Journal Size:'
        journalctl --disk-usage 2>/dev/null || echo '⚠️  Journal check failed'

        # Verify no old services running
        echo '🔧 Active Services:'
        systemctl list-units --type=service | grep -E 'robot|bendbionics' || echo 'Only bendbionics-api.service running ✅'
    "

    print_success "Deployment verification completed"
}

# Function to cleanup local deployment package
cleanup_local_package() {
    print_status "Cleaning up local deployment package..."

    if [ -n "$DEPLOY_PACKAGE" ] && [ -d "$DEPLOY_PACKAGE" ]; then
        print_status "Removing: $DEPLOY_PACKAGE"
        rm -rf "$DEPLOY_PACKAGE"
        print_success "Local package cleaned up"
    else
        print_warning "No deployment package to cleanup"
    fi
}

# Function to cleanup old packages
cleanup_old_packages() {
    print_status "Cleaning up old deployment packages..."

    # Clean up old deployment packages in deploy directory
    if [ -d "deploy" ]; then
        local old_packages=$(find deploy -name "web-build-*" -type d 2>/dev/null | wc -l)
        if [ "$old_packages" -gt 0 ]; then
            print_status "Found $old_packages old deployment packages"
            rm -rf deploy/web-build-*
            print_success "Old packages cleaned up"
        else
            print_status "No old packages found"
        fi
    fi

    # Also clean up old packages in builds directory (legacy)
    if [ -d "builds" ]; then
        local old_builds=$(find builds -name "web-build-*" -type d 2>/dev/null | wc -l)
        if [ "$old_builds" -gt 0 ]; then
            print_status "Found $old_builds old build packages"
            rm -rf builds/web-build-*
            print_success "Old build packages cleaned up"
        fi
    fi
}

# Function to cleanup server package
cleanup_server_package() {
    print_status "Cleaning up server deployment package..."

    if [ -n "$PACKAGE_NAME" ]; then
        ssh "$SERVER_USER@$SERVER_HOST" "rm -rf $SERVER_PATH/$PACKAGE_NAME" 2>/dev/null || true
        print_success "Server package cleaned up"
    else
        print_warning "No server package to cleanup"
    fi
}

# Function to show deployment results
show_results() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}🎉 Deployment Workflow Complete${NC}"
    echo -e "${CYAN}================================${NC}"

    echo -e "Server: ${GREEN}$SERVER_USER@$SERVER_HOST${NC}"
    echo -e "Application: ${GREEN}https://bendbionics.com${NC}"
    echo -e "API Documentation: ${GREEN}https://bendbionics.com/docs${NC}"
    echo -e "Health Check: ${GREEN}https://bendbionics.com/health${NC}"

    echo -e "\n${BLUE}Useful Commands:${NC}"
    echo -e "View logs: ${CYAN}ssh $SERVER_USER@$SERVER_HOST 'sudo journalctl -u bendbionics-api -f'${NC}"
    echo -e "Restart backend: ${CYAN}ssh $SERVER_USER@$SERVER_HOST 'sudo systemctl restart bendbionics-api'${NC}"

    echo -e "${CYAN}================================${NC}"
}

# Main execution
main() {
    local skip_build=false
    local skip_upload=false
    local skip_deploy=false
    local skip_tests=false
    local cleanup_only=false

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                skip_build=true
                shift
                ;;
            --skip-upload)
                skip_upload=true
                shift
                ;;
            --skip-deploy)
                skip_deploy=true
                shift
                ;;
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --cleanup-only)
                cleanup_only=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    print_header

    # Check prerequisites
    check_prerequisites

    if [ "$cleanup_only" = true ]; then
        cleanup_old_packages
        cleanup_local_package
        print_success "Cleanup completed"
        exit 0
    fi

    # Initialize deployment variables
    DEPLOY_PACKAGE=""
    PACKAGE_NAME=""

    # Install dependencies
    if [ "$skip_build" = false ]; then
        install_dependencies
    else
        print_status "Skipping dependency installation"
    fi

    # Run tests
    if [ "$skip_build" = false ] && [ "$skip_tests" = false ]; then
        run_tests
    else
        if [ "$skip_tests" = true ]; then
            print_warning "Skipping tests (not recommended)"
        else
            print_status "Skipping tests (build step skipped)"
        fi
    fi

    # Build application
    if [ "$skip_build" = false ]; then
        build_application
    else
        print_status "Skipping build step"
        # Try to find existing deployment package
        local latest_package=$(ls -td deploy/web-build-* 2>/dev/null | head -1)
        if [ -n "$latest_package" ]; then
            DEPLOY_PACKAGE="$latest_package"
            PACKAGE_NAME=$(basename "$latest_package")
            print_status "Using existing package: $DEPLOY_PACKAGE"
        else
            print_error "No existing deployment package found. Run build first."
            exit 1
        fi
    fi

    # Create deployment package (if not skipped)
    if [ "$skip_build" = false ]; then
        create_deployment_package
    fi

    # Validate Mailgun secrets
    if [ "$skip_build" = false ]; then
        validate_mailgun_secrets
        create_production_env_file
    fi

    # Validate server configuration
    if [ "$skip_upload" = false ]; then
        validate_server_config
        configure_ssh_known_hosts
    fi

    # Upload to server
    if [ "$skip_upload" = false ] && [ "$skip_build" = false ]; then
        upload_to_server
    else
        if [ "$skip_upload" = true ]; then
            print_status "Skipping upload step"
        else
            print_status "Skipping upload step (build step skipped)"
        fi
    fi

    # Deploy on server
    if [ "$skip_deploy" = false ] && [ "$skip_build" = false ]; then
        deploy_on_server
    else
        if [ "$skip_deploy" = true ]; then
            print_status "Skipping deploy step"
        else
            print_status "Skipping deploy step (build step skipped)"
        fi
    fi

    # Health check
    if [ "$skip_deploy" = false ]; then
        health_check
    fi

    # Verify deployment
    if [ "$skip_deploy" = false ]; then
        verify_deployment
    fi

    # Cleanup local package
    if [ "$cleanup_only" = false ]; then
        cleanup_local_package
    fi

    # Cleanup server package
    if [ "$skip_deploy" = false ]; then
        cleanup_server_package
    fi

    # Show results
    show_results
}

# Run main function
main "$@"

