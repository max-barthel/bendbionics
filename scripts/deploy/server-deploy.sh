#!/bin/bash

# BendBionics - Server Deployment Script
# Automated deployment script for Ubuntu server

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
APP_DIR="/var/www/bendbionics-app"
SERVICE_NAME="bendbionics-api"
NGINX_SITE="bendbionics"
DOMAIN="bendbionics.com"

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
    echo -e "${PURPLE}🚀 BendBionics App Deployment${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Function to create pre-deployment backup
pre_deployment_backup() {
    print_status "Creating pre-deployment backup..."

    # Create backup directories if they don't exist
    mkdir -p /mnt/data/backups/{database,configs,deployments}

    # Database backup
    print_status "Backing up database..."
    sudo -u postgres pg_dump bendbionics | gzip > "/mnt/data/backups/database/bendbionics_predeploy_$(date +%Y%m%d_%H%M%S).sql.gz" 2>/dev/null || true

    # Config backup (if changed)
    if [ -f "$APP_DIR/backend/.env.production" ]; then
        print_status "Backing up environment configuration..."
        cp "$APP_DIR/backend/.env.production" "/mnt/data/backups/configs/env.production.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
    fi

    # Keep only last 5 pre-deploy backups
    find /mnt/data/backups/database -name "bendbionics_predeploy_*.sql.gz" -type f | sort -r | tail -n +6 | xargs -r rm 2>/dev/null || true
    find /mnt/data/backups/configs -name "env.production.*" -type f | sort -r | tail -n +6 | xargs -r rm 2>/dev/null || true

    print_success "Pre-deployment backup completed"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking server prerequisites..."

    # Check if running on Ubuntu
    if ! grep -q "Ubuntu" /etc/os-release; then
        print_warning "This script is designed for Ubuntu. Other distributions may work but are not tested."
    fi

    # Check required commands
    local required_commands=("python3" "nginx" "systemctl" "certbot")
    local missing_commands=()

    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_commands+=("$cmd")
        fi
    done

    if [ ${#missing_commands[@]} -ne 0 ]; then
        print_error "Missing required commands: ${missing_commands[*]}"
        print_status "Please install missing packages:"
        print_status "sudo apt update && sudo apt install -y python3 nginx certbot python3-certbot-nginx"
        exit 1
    fi

    print_success "Prerequisites check completed"
}

# Function to install system dependencies
install_dependencies() {
    print_status "Installing system dependencies..."

    # Update package list
    apt update

    # Install Python and development tools
    apt install -y python3 python3-venv python3-dev build-essential

    # Install nginx
    apt install -y nginx

    # Install certbot for SSL
    apt install -y certbot python3-certbot-nginx

    # Install additional Python dependencies
    apt install -y libpq-dev  # For PostgreSQL support (optional)

    print_success "System dependencies installed"
}

# Function to create application directory
setup_app_directory() {
    print_status "Setting up application directory..."

    # Create application directory
    mkdir -p "$APP_DIR"
    chown -R www-data:www-data "$APP_DIR"

    # Create subdirectories
    mkdir -p "$APP_DIR"/{backend,frontend,logs}
    chown -R www-data:www-data "$APP_DIR"

    print_success "Application directory created: $APP_DIR"
}

# Function to copy application files
copy_application_files() {
    print_status "Copying application files..."

    # Get the directory where this script is located
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    # Copy backend files
    if [ -d "$SCRIPT_DIR/backend" ]; then
        cp -r "$SCRIPT_DIR/backend"/* "$APP_DIR/backend/"
        # Copy hidden files (but exclude .env files - those are managed by setup_environment)
        # Loop through hidden files and copy them, excluding .env* files
        for hidden_file in "$SCRIPT_DIR/backend"/.*; do
            # Skip .env* files and the . and .. entries
            if [[ "$(basename "$hidden_file")" =~ ^\.env ]] || [[ "$(basename "$hidden_file")" == "." ]] || [[ "$(basename "$hidden_file")" == ".." ]]; then
                continue
            fi
            if [ -e "$hidden_file" ]; then
                if [ -d "$hidden_file" ]; then
                    cp -r "$hidden_file" "$APP_DIR/backend/"
                else
                    cp "$hidden_file" "$APP_DIR/backend/"
                fi
            fi
        done 2>/dev/null || true
        print_status "Backend files copied (excluding .env files - managed separately)"
    else
        print_error "Backend directory not found in deployment package"
        exit 1
    fi

    # Copy startup script
    if [ -f "$SCRIPT_DIR/start-backend.sh" ]; then
        # Create scripts/deploy directory if it doesn't exist
        mkdir -p "$APP_DIR/scripts/deploy"
        cp "$SCRIPT_DIR/start-backend.sh" "$APP_DIR/scripts/deploy/"
        chmod +x "$APP_DIR/scripts/deploy/start-backend.sh"
        print_status "Startup script copied and made executable"
    else
        print_error "Startup script not found in deployment package"
        exit 1
    fi

    # Copy DDNS scripts (preserve source files for setup)
    if [ -d "$SCRIPT_DIR/scripts/ddns" ]; then
        mkdir -p "$APP_DIR/scripts/ddns"
        cp -r "$SCRIPT_DIR/scripts/ddns"/* "$APP_DIR/scripts/ddns/"
        # Make all shell scripts executable
        find "$APP_DIR/scripts/ddns" -name "*.sh" -type f -exec chmod +x {} \;
        print_status "DDNS scripts copied to application directory"
    fi

    # Copy frontend files
    if [ -d "$SCRIPT_DIR/frontend" ]; then
        # Create frontend directory if it doesn't exist
        mkdir -p "$APP_DIR/frontend"
        # Copy all frontend files including hidden ones
        cp -r "$SCRIPT_DIR/frontend"/* "$APP_DIR/frontend/" 2>/dev/null || true
        cp -r "$SCRIPT_DIR/frontend"/.* "$APP_DIR/frontend/" 2>/dev/null || true

        # Verify essential frontend files exist (flattened build)
        if [ ! -f "$APP_DIR/frontend/index.html" ]; then
            print_error "Frontend index.html not found after copy"
            exit 1
        fi

        print_status "Frontend files copied"
    else
        print_error "Frontend directory not found in deployment package"
        exit 1
    fi

    # Copy pyproject.toml (needed for uv)
    if [ -f "$SCRIPT_DIR/backend/pyproject.toml" ]; then
        cp "$SCRIPT_DIR/backend/pyproject.toml" "$APP_DIR/backend/"
        print_status "pyproject.toml copied"
    else
        print_error "pyproject.toml not found in deployment package"
        exit 1
    fi

    # Set proper permissions
    chown -R www-data:www-data "$APP_DIR"

    print_success "Application files copied successfully"
}

# Function to setup Python virtual environment
setup_python_environment() {
    print_status "Setting up Python virtual environment..."

    cd "$APP_DIR/backend"

    # Check if uv is installed, install if not
    if ! command -v uv &> /dev/null; then
        print_status "Installing uv..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        # Add uv's installation directory to PATH
        export PATH="$HOME/.local/bin:$PATH"
        # Source uv's env file if available (created by installer)
        if [ -f "$HOME/.local/bin/env" ]; then
            source "$HOME/.local/bin/env"
        fi
        # Verify uv is now available
        if ! command -v uv &> /dev/null; then
            print_error "uv installation failed or not in PATH"
            exit 1
        fi
    fi

    # Create virtual environment with uv
    print_status "Creating virtual environment with uv..."
    uv venv --clear

    # Install Python dependencies from pyproject.toml
    print_status "Installing Python dependencies with uv..."
    if [ -f "pyproject.toml" ]; then
        uv sync
    else
        print_error "pyproject.toml not found in backend directory"
        exit 1
    fi

    print_success "Python environment setup completed"
}

# Function to configure environment variables
setup_environment() {
    print_status "Configuring environment variables..."

    # Get the directory where this script is located
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    # Path to the new .env.production from deployment package
    NEW_ENV_FILE="$SCRIPT_DIR/backend/.env.production"
    # Path to existing .env.production on server (has DATABASE_URL and SECRET_KEY)
    EXISTING_ENV_FILE="$APP_DIR/backend/.env.production"
    # Path to setup-postgres.sh in deployment package
    SETUP_POSTGRES_SCRIPT="$SCRIPT_DIR/setup-postgres.sh"

    # Check if environment file exists and has required values
    NEEDS_SETUP=false
    if [ ! -f "$EXISTING_ENV_FILE" ]; then
        print_status "Environment file not found - first-time deployment detected"
        NEEDS_SETUP=true
    else
        # Backup existing environment file before checking
        cp "$EXISTING_ENV_FILE" "$EXISTING_ENV_FILE.backup.$(date +%Y%m%d-%H%M%S)"
        print_status "Backed up existing environment file"

        # Extract critical server settings (DATABASE_URL and SECRET_KEY)
        # Handle various formats: with/without quotes, with/without spaces
        DATABASE_URL=$(grep -E "^[[:space:]]*DATABASE_URL[[:space:]]*=" "$EXISTING_ENV_FILE" | grep -v "^[[:space:]]*#" | head -1 | sed -E 's/^[[:space:]]*DATABASE_URL[[:space:]]*=[[:space:]]*//' | sed -E 's/^["'\'']|["'\'']$//g')
        SECRET_KEY=$(grep -E "^[[:space:]]*SECRET_KEY[[:space:]]*=" "$EXISTING_ENV_FILE" | grep -v "^[[:space:]]*#" | head -1 | sed -E 's/^[[:space:]]*SECRET_KEY[[:space:]]*=[[:space:]]*//' | sed -E 's/^["'\'']|["'\'']$//g')

        if [ -z "$DATABASE_URL" ] || [ -z "$SECRET_KEY" ]; then
            print_warning "Environment file exists but is missing DATABASE_URL or SECRET_KEY"
            NEEDS_SETUP=true
        fi
    fi

    # If setup is needed, try to run setup-postgres.sh automatically
    if [ "$NEEDS_SETUP" = true ]; then
        if [ -f "$SETUP_POSTGRES_SCRIPT" ]; then
            print_status "Running PostgreSQL setup script automatically..."
            print_status "This will install PostgreSQL (if needed) and create database configuration"

            # Run setup-postgres.sh
            bash "$SETUP_POSTGRES_SCRIPT"
            SETUP_RESULT=$?

            if [ $SETUP_RESULT -ne 0 ]; then
                print_error "PostgreSQL setup script failed with exit code $SETUP_RESULT"
                exit 1
            fi

            print_success "PostgreSQL setup completed successfully"

            # Verify the environment file was created and has required values
            if [ ! -f "$EXISTING_ENV_FILE" ]; then
                print_error "Environment file was not created by setup-postgres.sh"
                exit 1
            fi

            # Re-extract values after setup
            DATABASE_URL=$(grep -E "^[[:space:]]*DATABASE_URL[[:space:]]*=" "$EXISTING_ENV_FILE" | grep -v "^[[:space:]]*#" | head -1 | sed -E 's/^[[:space:]]*DATABASE_URL[[:space:]]*=[[:space:]]*//' | sed -E 's/^["'\'']|["'\'']$//g')
            SECRET_KEY=$(grep -E "^[[:space:]]*SECRET_KEY[[:space:]]*=" "$EXISTING_ENV_FILE" | grep -v "^[[:space:]]*#" | head -1 | sed -E 's/^[[:space:]]*SECRET_KEY[[:space:]]*=[[:space:]]*//' | sed -E 's/^["'\'']|["'\'']$//g')

            if [ -z "$DATABASE_URL" ] || [ -z "$SECRET_KEY" ]; then
                print_error "Environment file still missing DATABASE_URL or SECRET_KEY after setup"
                print_status "Current environment file location: $EXISTING_ENV_FILE"
                print_status "First 10 lines of environment file:"
                head -10 "$EXISTING_ENV_FILE" | sed 's/^/  /'
                exit 1
            fi
        else
            # setup-postgres.sh not found - show error message
            print_error "PostgreSQL setup required but setup-postgres.sh not found in deployment package"
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            if [ ! -f "$EXISTING_ENV_FILE" ]; then
                echo "📋 First-Time PostgreSQL Setup Required"
            else
                echo "📋 PostgreSQL Database Setup Required"
            fi
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "The environment file is missing or incomplete, but setup-postgres.sh"
            echo "was not found in the deployment package."
            echo ""
            if [ -f "$EXISTING_ENV_FILE" ]; then
                print_status "Current environment file location: $EXISTING_ENV_FILE"
                print_status "First 10 lines of environment file:"
                head -10 "$EXISTING_ENV_FILE" | sed 's/^/  /'
            fi
            exit 1
        fi
    fi

    # Check if deployment package has new .env.production with email config
    if [ -f "$NEW_ENV_FILE" ]; then
        print_status "Merging new email configuration with existing server settings..."

        # Copy new env file as base
        cp "$NEW_ENV_FILE" "$EXISTING_ENV_FILE.tmp"

        # Add server-specific settings (DATABASE_URL and SECRET_KEY)
        # Remove any placeholder database settings and add real ones
        sed -i '/^DATABASE_URL=/d' "$EXISTING_ENV_FILE.tmp"
        sed -i '/^SECRET_KEY=/d' "$EXISTING_ENV_FILE.tmp"

        # Append server settings
        echo "" >> "$EXISTING_ENV_FILE.tmp"
        echo "# Server-specific settings (from server setup)" >> "$EXISTING_ENV_FILE.tmp"
        echo "DATABASE_URL=$DATABASE_URL" >> "$EXISTING_ENV_FILE.tmp"
        echo "SECRET_KEY=$SECRET_KEY" >> "$EXISTING_ENV_FILE.tmp"

        # Replace existing file
        mv "$EXISTING_ENV_FILE.tmp" "$EXISTING_ENV_FILE"

        print_success "Environment configuration merged successfully"
        print_status "✅ Email configuration updated"
        print_status "✅ Database credentials preserved"
        print_status "✅ Secret key preserved"
    else
        print_status "No new environment file in deployment package - using existing config"
    fi

    # Set proper permissions
    chown www-data:www-data "$EXISTING_ENV_FILE"
    chmod 600 "$EXISTING_ENV_FILE"

    print_success "Environment configuration completed"
}

# Function to preserve DDNS installation
preserve_ddns() {
    print_status "Checking for existing DDNS installation..."

    # Check if DDNS is installed
    if [ -f "/usr/local/bin/update-dns.sh" ] && [ -f "/etc/systemd/system/update-dns.timer" ]; then
        print_status "DDNS installation found - preserving configuration"

        # Check if timer is enabled
        if systemctl is-enabled update-dns.timer >/dev/null 2>&1; then
            print_status "DDNS timer is enabled - will continue running after deployment"
        else
            print_warning "DDNS timer exists but is not enabled"
        fi

        # Verify service files are intact
        if [ ! -f "/etc/systemd/system/update-dns.service" ]; then
            print_warning "DDNS service file missing - timer may need reconfiguration"
        fi

        print_success "DDNS installation preserved"
    else
        print_status "No existing DDNS installation found"
    fi
}

# Function to setup systemd service
setup_systemd_service() {
    print_status "Setting up systemd service..."

    # Copy service file
    if [ -f "$SCRIPT_DIR/systemd/bendbionics-api.service" ]; then
        cp "$SCRIPT_DIR/systemd/bendbionics-api.service" "/etc/systemd/system/$SERVICE_NAME.service"
    else
        print_error "systemd service file not found at $SCRIPT_DIR/systemd/bendbionics-api.service"
        exit 1
    fi

    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"

    print_success "Systemd service configured"
}

# Function to setup nginx
setup_nginx() {
    print_status "Setting up nginx configuration..."

    # Copy nginx configuration
    if [ -f "$SCRIPT_DIR/nginx/bendbionics.conf" ]; then
        cp "$SCRIPT_DIR/nginx/bendbionics.conf" "/etc/nginx/sites-available/$NGINX_SITE"
    else
        print_error "nginx configuration file not found at $SCRIPT_DIR/nginx/bendbionics.conf"
        exit 1
    fi

    # Enable site
    ln -sf "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-enabled/"

    # Remove default nginx site if it exists
    if [ -f "/etc/nginx/sites-enabled/default" ]; then
        rm "/etc/nginx/sites-enabled/default"
    fi

    # Test nginx configuration
    nginx -t
    if [ $? -ne 0 ]; then
        print_error "nginx configuration test failed"
        exit 1
    fi

    # Reload nginx
    systemctl reload nginx

    print_success "nginx configuration completed"
}

# Function to setup SSL with Porkbun certificate
setup_ssl() {
    print_status "Setting up SSL certificate with Porkbun certificate..."

    # Check if domain is configured
    if [ "$DOMAIN" = "yourdomain.com" ]; then
        print_warning "Domain not configured. Please update the DOMAIN variable in this script."
        print_status "Skipping SSL setup. You can configure it manually later."
        return 0
    fi

    # Create SSL directory if it doesn't exist
    mkdir -p "/etc/ssl/$DOMAIN"

    # Check if Porkbun certificate files exist
    if [ -f "/etc/ssl/$DOMAIN/domain.cert.pem" ] && [ -f "/etc/ssl/$DOMAIN/private.key.pem" ]; then
        print_status "Found Porkbun certificate files for $DOMAIN"

        # Update nginx configuration to use SSL
        if [ -f "/etc/nginx/sites-available/$NGINX_SITE" ]; then
            # Create SSL-enabled nginx configuration
            cat > "/etc/nginx/sites-available/$NGINX_SITE" << EOF
# Default HTTP server for LAN/IP access (no redirect)
server {
    listen 80 default_server;
    server_name _;

    # Serve frontend static files
    location / {
        root /var/www/bendbionics-app/frontend;
        try_files \$uri \$uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Proxy all requests to backend (backend handles routing)
    location ~ ^/(api|kinematics|auth|presets|tendons|docs|openapi\.json|redoc) {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/api/health;
        proxy_set_header Host \$host;
        access_log off;
    }
}

# HTTP to HTTPS redirect for domain only
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL Configuration
    ssl_certificate /etc/ssl/$DOMAIN/domain.cert.pem;
    ssl_certificate_key /etc/ssl/$DOMAIN/private.key.pem;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # Frontend
    location / {
        root /var/www/bendbionics-app/frontend;
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy all API requests to backend (backend handles routing)
    location ~ ^/(api|kinematics|auth|presets|tendons|docs|openapi\.json|redoc) {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

            # Test nginx configuration
            nginx -t
            if [ $? -eq 0 ]; then
                systemctl reload nginx
                print_success "SSL certificate configured successfully"
            else
                print_error "nginx configuration test failed"
                exit 1
            fi
        else
            print_error "nginx configuration file not found"
            exit 1
        fi
    else
        print_warning "Porkbun certificate files not found at /etc/ssl/$DOMAIN/"
        print_status "Creating HTTP-only configuration for now..."

        # Create HTTP-only nginx configuration
        cat > "/etc/nginx/sites-available/$NGINX_SITE" << EOF
# HTTP server (no SSL)
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Serve frontend static files
    location / {
        root /var/www/bendbionics-app/frontend;
        try_files \$uri \$uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Proxy all API requests to backend (backend handles routing)
    location ~ ^/(api|kinematics|auth|presets|tendons|docs|openapi\.json|redoc) {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:8000/api/health;
        proxy_set_header Host \$host;
        access_log off;
    }
}
EOF

        # Test nginx configuration
        nginx -t
        if [ $? -eq 0 ]; then
            systemctl reload nginx
            print_success "HTTP-only configuration applied"
            print_warning "SSL certificates not configured. Site will be accessible via HTTP only."
            print_status "To add SSL later, copy your certificate files to:"
            print_status "  /etc/ssl/$DOMAIN/domain.cert.pem"
            print_status "  /etc/ssl/$DOMAIN/private.key.pem"
            print_status "Then run: sudo systemctl reload nginx"
        else
            print_error "nginx configuration test failed"
            exit 1
        fi
    fi
}

# Function to install PostgreSQL
install_postgresql() {
    print_status "Installing PostgreSQL..."

    # Check if PostgreSQL is already installed
    if command -v psql &> /dev/null; then
        print_success "PostgreSQL is already installed"
        return 0
    fi

    # Update package list
    apt-get update

    # Install PostgreSQL
    print_status "Installing PostgreSQL server and client..."
    apt-get install -y postgresql postgresql-contrib

    # Start PostgreSQL service
    print_status "Starting PostgreSQL service..."
    systemctl start postgresql
    systemctl enable postgresql

    # Check if PostgreSQL is running
    if ! systemctl is-active --quiet postgresql; then
        print_error "Failed to start PostgreSQL service"
        exit 1
    fi

    print_success "PostgreSQL installed and started successfully"
}

# Function to initialize database
initialize_database() {
    print_status "Setting up PostgreSQL database..."

    # Install PostgreSQL if not present
    install_postgresql

    # Check if database exists (setup-postgres.sh should have created it)
    if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw bendbionics; then
        print_warning "Database 'bendbionics' not found!"
        print_error "Please run setup-postgres.sh first to create the database and user"
        exit 1
    else
        print_success "Database already exists - preserving user data"
    fi

    # Initialize database tables and run migrations (safe to run multiple times)
    print_status "Setting up database tables and running migrations..."
    cd "$APP_DIR/backend"

    # Use virtual environment's Python to ensure dependencies are available
    # Venv is created at project root ($APP_DIR/.venv) by uv sync
    source ../.venv/bin/activate
    python init_database.py
    INIT_RESULT=$?
    deactivate

    if [ $INIT_RESULT -eq 0 ]; then
        print_success "Database setup completed successfully"
        print_status "✅ User data preserved"
        print_status "✅ Tables created/updated safely"
        print_status "✅ Migrations applied if needed"
    else
        print_error "Database setup failed"
        exit 1
    fi
}

# Function to start services
start_services() {
    print_status "Starting services..."

    # Start backend service
    systemctl start "$SERVICE_NAME"

    # Wait a moment for service to start
    sleep 3

    # Check if backend service is running
    if ! systemctl is-active --quiet "$SERVICE_NAME"; then
        print_error "Backend service failed to start"
        print_status "Service status:"
        systemctl status "$SERVICE_NAME" --no-pager
        print_status "Service logs:"
        journalctl -u "$SERVICE_NAME" --no-pager -n 20
        exit 1
    fi

    print_success "Backend service started successfully"

    # Start nginx
    systemctl start nginx

    # Check if nginx is running
    if ! systemctl is-active --quiet nginx; then
        print_error "Nginx failed to start"
        print_status "Nginx status:"
        systemctl status nginx --no-pager
        exit 1
    fi

    print_success "Nginx started successfully"
    print_success "All services started"
}

# Function to test deployment
test_deployment() {
    print_status "Testing deployment..."

    # Test backend API
    print_status "Testing backend API..."
    if curl -s -f "http://127.0.0.1:8000/api/health" > /dev/null; then
        print_success "Backend API is responding"
    else
        print_warning "Backend API health check failed"
        print_status "Trying to get more info..."
        curl -v "http://127.0.0.1:8000/api/health" || true
    fi

    # Test nginx
    print_status "Testing nginx..."
    if curl -s -f "http://127.0.0.1/health" > /dev/null; then
        print_success "Nginx is serving the application"
    else
        print_warning "Nginx health check failed"
        print_status "Trying to get more info..."
        curl -v "http://127.0.0.1/health" || true
    fi

    # Test frontend files (flattened)
    if [ -f "$APP_DIR/frontend/index.html" ]; then
        print_success "Frontend files are in place"
    else
        print_error "Frontend index.html not found"
    fi
}

# Function to cleanup temp files and perform post-deployment maintenance
cleanup_temp_files() {
    print_status "Performing post-deployment cleanup and maintenance..."

    # Get the directory where this script is located (temp folder)
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    # 1. Clean up old deployment packages in /tmp
    OLD_PACKAGES=$(find /tmp -name "web-build-*" -type d 2>/dev/null | wc -l)
    if [ "$OLD_PACKAGES" -gt 0 ]; then
        print_status "Cleaning up $OLD_PACKAGES old deployment packages from /tmp..."
        rm -rf /tmp/web-build-*
        print_status "Removed old deployment packages from /tmp"
    fi

    # 2. Clean Python cache files from the application
    print_status "Cleaning Python cache files..."
    find "$APP_DIR/backend" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find "$APP_DIR/backend" -type f -name "*.pyc" -delete 2>/dev/null || true
    print_status "Python cache cleaned"

    # 3. Archive current deployment package to HDD for 7 days
    if [ -d "$SCRIPT_DIR" ] && [[ "$SCRIPT_DIR" == /tmp/web-build-* ]]; then
        ARCHIVE_DIR="/mnt/data/backups/deployments"
        mkdir -p "$ARCHIVE_DIR"
        ARCHIVE_NAME="$(basename "$SCRIPT_DIR").tar.gz"
        print_status "Archiving deployment package to HDD: $ARCHIVE_NAME"
        tar -czf "$ARCHIVE_DIR/$ARCHIVE_NAME" -C /tmp "$(basename "$SCRIPT_DIR")" 2>/dev/null || true

        # Clean old deployment archives (keep last 7 days)
        find "$ARCHIVE_DIR" -name "web-build-*.tar.gz" -mtime +7 -delete 2>/dev/null || true
        print_status "Deployment package archived to HDD"

        # Remove current deployment package from /tmp
        print_status "Removing current deployment package: $SCRIPT_DIR"
        rm -rf "$SCRIPT_DIR"
        print_status "Deployment package removed from server"
    fi

    # 4. Trim journal logs if over 100MB
    JOURNAL_SIZE=$(journalctl --disk-usage | grep -oP '\d+\.\d+M' | grep -oP '\d+' | head -1)
    if [ "${JOURNAL_SIZE:-0}" -gt 100 ]; then
        print_status "Journal size is ${JOURNAL_SIZE}MB, trimming to 100MB..."
        journalctl --vacuum-size=100M 2>/dev/null || true
        print_status "Journal trimmed"
    fi

    # 5. Clean apt cache weekly (check last clean date)
    LAST_CLEAN="/var/log/last-apt-clean"
    if [ ! -f "$LAST_CLEAN" ] || [ $(find "$LAST_CLEAN" -mtime +7 2>/dev/null) ]; then
        print_status "Running weekly apt cleanup..."
        apt-get autoremove -y >/dev/null 2>&1 || true
        apt-get clean >/dev/null 2>&1 || true
        touch "$LAST_CLEAN"
        print_status "Apt cache cleaned"
    fi

    print_success "Post-deployment cleanup completed"
}


# Function to show deployment results
show_deployment_results() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}🎉 Deployment Results${NC}"
    echo -e "${CYAN}================================${NC}"

    echo -e "Application Directory: ${GREEN}$APP_DIR${NC}"
    echo -e "Backend Service: ${GREEN}$SERVICE_NAME${NC}"
    echo -e "Nginx Site: ${GREEN}$NGINX_SITE${NC}"

    # Show service status
    echo -e "\n${BLUE}Service Status:${NC}"
    systemctl is-active --quiet "$SERVICE_NAME" && echo -e "Backend: ${GREEN}Running${NC}" || echo -e "Backend: ${RED}Not Running${NC}"
    systemctl is-active --quiet nginx && echo -e "Nginx: ${GREEN}Running${NC}" || echo -e "Nginx: ${RED}Not Running${NC}"

    # Show URLs
    echo -e "\n${BLUE}Access URLs:${NC}"
    echo -e "Application: ${GREEN}https://$DOMAIN${NC}"
    echo -e "API Documentation: ${GREEN}https://$DOMAIN/docs${NC}"
    echo -e "Health Check: ${GREEN}https://$DOMAIN/health${NC}"

    echo -e "\n${BLUE}Useful Commands:${NC}"
    echo -e "View logs: ${CYAN}sudo journalctl -u $SERVICE_NAME -f${NC}"
    echo -e "Restart backend: ${CYAN}sudo systemctl restart $SERVICE_NAME${NC}"
    echo -e "Reload nginx: ${CYAN}sudo systemctl reload nginx${NC}"

    echo -e "${CYAN}================================${NC}"
    print_success "Deployment completed!"
}


# Main execution
main() {
    print_header

    # Check if running as root
    check_root

    # Run deployment process
    check_prerequisites
    pre_deployment_backup
    preserve_ddns  # Preserve DDNS before deployment
    install_dependencies
    setup_app_directory
    copy_application_files
    setup_python_environment
    setup_environment
    initialize_database
    setup_systemd_service
    setup_nginx
    setup_ssl
    start_services
    test_deployment
    cleanup_temp_files
    show_deployment_results
}

# Run main function
main
