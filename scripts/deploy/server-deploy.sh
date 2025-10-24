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

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking server prerequisites..."

    # Check if running on Ubuntu
    if ! grep -q "Ubuntu" /etc/os-release; then
        print_warning "This script is designed for Ubuntu. Other distributions may work but are not tested."
    fi

    # Check required commands
    local required_commands=("python3" "pip3" "nginx" "systemctl" "certbot")
    local missing_commands=()

    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_commands+=("$cmd")
        fi
    done

    if [ ${#missing_commands[@]} -ne 0 ]; then
        print_error "Missing required commands: ${missing_commands[*]}"
        print_status "Please install missing packages:"
        print_status "sudo apt update && sudo apt install -y python3 python3-pip nginx certbot python3-certbot-nginx"
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
    apt install -y python3 python3-pip python3-venv python3-dev build-essential

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
        # Copy hidden files (like .env files)
        cp -r "$SCRIPT_DIR/backend"/.* "$APP_DIR/backend/" 2>/dev/null || true
        print_status "Backend files copied"
    else
        print_error "Backend directory not found in deployment package"
        exit 1
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

    # Set proper permissions
    chown -R www-data:www-data "$APP_DIR"

    print_success "Application files copied successfully"
}

# Function to setup Python virtual environment
setup_python_environment() {
    print_status "Setting up Python virtual environment..."

    cd "$APP_DIR/backend"

    # Create virtual environment
    python3 -m venv venv
    source venv/bin/activate

    # Upgrade pip
    pip install --upgrade pip

    # Install Python dependencies
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    else
        print_error "requirements.txt not found in backend directory"
        exit 1
    fi

    print_success "Python environment setup completed"
}

# Function to configure environment variables
setup_environment() {
    print_status "Configuring environment variables..."

    # Debug: Check what files exist in backend directory
    print_status "Files in backend directory:"
    ls -la "$APP_DIR/backend/" || print_error "Failed to list backend directory"
    print_status "Looking for .env files:"
    find "$APP_DIR/backend/" -name "*.env*" -o -name "*.production*" || print_error "No .env files found"

    # Check if .env.production exists
    if [ ! -f "$APP_DIR/backend/.env.production" ]; then
        if [ -f "$APP_DIR/backend/.env.production.template" ]; then
            print_status "Creating .env.production from template..."
            cp "$APP_DIR/backend/.env.production.template" "$APP_DIR/backend/.env.production"
            print_warning "Please edit $APP_DIR/backend/.env.production with your production values"
        else
            print_error ".env.production not found. Please create it manually."
            exit 1
        fi
    fi

    # Set proper permissions
    chown www-data:www-data "$APP_DIR/backend/.env.production"
    chmod 600 "$APP_DIR/backend/.env.production"

    print_success "Environment configuration completed"
}

# Function to setup systemd service
setup_systemd_service() {
    print_status "Setting up systemd service..."

    # Copy service file
    if [ -f "$SCRIPT_DIR/systemd/soft-robot-api.service" ]; then
        cp "$SCRIPT_DIR/systemd/soft-robot-api.service" "/etc/systemd/system/$SERVICE_NAME.service"
    else
        print_error "systemd service file not found at $SCRIPT_DIR/systemd/soft-robot-api.service"
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
    if [ -f "$SCRIPT_DIR/nginx/soft-robot.conf" ]; then
        cp "$SCRIPT_DIR/nginx/soft-robot.conf" "/etc/nginx/sites-available/$NGINX_SITE"
    else
        print_error "nginx configuration file not found at $SCRIPT_DIR/nginx/soft-robot.conf"
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
        root /var/www/soft-robot-app/frontend;
        try_files \$uri \$uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Proxy API requests to backend
    location /api {
        rewrite ^/api/(.*) /$1 break;
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
        root /var/www/soft-robot-app/frontend;
        try_files \$uri \$uri/ /index.html;
    }

    # API
    location /api {
        rewrite ^/api/(.*) /\$1 break;
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
        root /var/www/soft-robot-app/frontend;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Proxy API requests to backend
    location /api {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API documentation
    location /docs {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /openapi.json {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:8000/api/health;
        proxy_set_header Host $host;
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

    # Check if database exists
    if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw bendbionics.db; then
        print_status "Creating bendbionics.db database..."
        sudo -u postgres createdb bendbionics.db
        print_success "Database created successfully"
    else
        print_success "Database already exists - preserving user data"
    fi

    # Initialize database tables and run migrations (safe to run multiple times)
    print_status "Setting up database tables and running migrations..."
    cd "$APP_DIR/backend"
    python3 init_database.py

    if [ $? -eq 0 ]; then
        print_success "Database setup completed successfully"
        print_info "✅ User data preserved"
        print_info "✅ Tables created/updated safely"
        print_info "✅ Migrations applied if needed"
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
    if curl -s -f "http://127.0.0.1:8000/health" > /dev/null; then
        print_success "Backend API is responding"
    else
        print_warning "Backend API health check failed"
        print_status "Trying to get more info..."
        curl -v "http://127.0.0.1:8000/health" || true
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

# Function to cleanup temp files
cleanup_temp_files() {
    print_status "Cleaning up temporary files..."

    # Get the directory where this script is located (temp folder)
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    # Clean up old deployment packages in /tmp
    OLD_PACKAGES=$(find /tmp -name "web-build-*" -type d 2>/dev/null | wc -l)
    if [ "$OLD_PACKAGES" -gt 0 ]; then
        print_status "Cleaning up $OLD_PACKAGES old deployment packages from /tmp..."
        rm -rf /tmp/web-build-*
        print_status "Removed old deployment packages from /tmp"
    fi

    # Clean up current deployment package after successful deployment
    if [ -d "$SCRIPT_DIR" ] && [[ "$SCRIPT_DIR" == /tmp/web-build-* ]]; then
        print_status "Removing current deployment package: $SCRIPT_DIR"
        rm -rf "$SCRIPT_DIR"
        print_status "Deployment package removed from server"
    fi

    print_success "Cleanup completed"
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
