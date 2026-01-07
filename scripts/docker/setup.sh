#!/bin/bash

# BendBionics Docker Setup Script
# Initial VPS setup for Docker deployment

set -e

# Source shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib.sh"

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Install Docker
install_docker() {
    print_status "Installing Docker..."

    if command -v docker &> /dev/null; then
        print_success "Docker is already installed: $(docker --version)"
        return 0
    fi

    # Install Docker using official script
    curl -fsSL https://get.docker.com | sh

    # Add current user to docker group (if not root)
    if [ -n "$SUDO_USER" ]; then
        usermod -aG docker "$SUDO_USER"
        print_status "Added $SUDO_USER to docker group"
    fi

    print_success "Docker installed successfully"
}

# Install Docker Compose
install_docker_compose() {
    print_status "Installing Docker Compose..."

    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        print_success "Docker Compose is already installed"
        return 0
    fi

    # Docker Compose v2 is included with Docker Desktop and newer Docker installations
    # Check if it's available as plugin
    if docker compose version &> /dev/null; then
        print_success "Docker Compose plugin is available"
        return 0
    fi

    # Install Docker Compose standalone (fallback)
    DOCKER_COMPOSE_VERSION="v2.24.0"
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    print_success "Docker Compose installed successfully"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."

    mkdir -p /opt/bendbionics/{data,backups,ssl}
    mkdir -p /opt/bendbionics/data/postgres
    mkdir -p /opt/bendbionics/ssl/{certs,private}
    mkdir -p /opt/bendbionics/backups/{database,volumes}

    # Set permissions
    chmod -R 755 /opt/bendbionics

    print_success "Directories created"
}

# Configure firewall
configure_firewall() {
    print_status "Configuring firewall..."

    if command -v ufw &> /dev/null; then
        # Allow SSH
        ufw allow 22/tcp

        # Allow HTTP and HTTPS
        ufw allow 80/tcp
        ufw allow 443/tcp

        # Enable firewall if not already enabled
        if ! ufw status | grep -q "Status: active"; then
            print_warning "Firewall is not active. Enable it with: ufw enable"
        else
            print_success "Firewall configured"
        fi
    else
        print_warning "UFW not found. Please configure your firewall manually"
    fi
}

# Generate initial SSL certificates (optional, can be done later with certbot)
setup_ssl() {
    print_status "SSL certificate setup..."
    print_warning "SSL certificates will be generated using certbot after deployment"
    print_status "Make sure your domain DNS is pointing to this server"
    print_status "Run certbot initialization after deployment:"
    print_status "  docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d yourdomain.com"
}

# Main execution
main() {
    print_header "🐳 BendBionics Docker Setup"

    check_root

    print_status "Starting Docker setup for BendBionics..."

    install_docker
    install_docker_compose
    create_directories
    configure_firewall
    setup_ssl

    print_success "Setup completed!"
    echo ""
    print_status "Next steps:"
    echo "1. Copy your project files to the server"
    echo "2. Copy docker/env.example to .env and configure it"
    echo "3. Run: docker compose up -d"
    echo "4. Initialize SSL certificates with certbot"
    echo ""
    print_status "For detailed instructions, see docs/DOCKER_DEPLOYMENT.md"
}

main "$@"

