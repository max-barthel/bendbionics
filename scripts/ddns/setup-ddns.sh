#!/bin/bash

# BendBionics - Dynamic DNS Setup Script
# Installs and configures DDNS update service

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_FILE="$SCRIPT_DIR/update-dns.sh"
INSTALL_DIR="/usr/local/bin"
ENV_DIR="/etc/porkbun-dns"
ENV_FILE="$ENV_DIR/.env"
SERVICE_FILE="/etc/systemd/system/update-dns.service"
TIMER_FILE="/etc/systemd/system/update-dns.timer"

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

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Check if script exists
check_script() {
    if [ ! -f "$SCRIPT_FILE" ]; then
        print_error "Update script not found: $SCRIPT_FILE"
        exit 1
    fi
}

# Install update script
install_script() {
    print_status "Installing DDNS update script..."

    cp "$SCRIPT_FILE" "$INSTALL_DIR/update-dns.sh"
    chmod +x "$INSTALL_DIR/update-dns.sh"

    print_success "Script installed to $INSTALL_DIR/update-dns.sh"
}

# Setup environment file
setup_env_file() {
    print_status "Setting up environment file..."

    mkdir -p "$ENV_DIR"

    if [ -f "$ENV_FILE" ]; then
        print_warning "Environment file already exists: $ENV_FILE"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Keeping existing environment file"
            return 0
        fi
    fi

    print_status "Please enter your Porkbun API credentials:"
    read -p "Porkbun API Key: " api_key
    read -p "Porkbun Secret API Key: " secret_key

    cat > "$ENV_FILE" <<EOF
# Porkbun API Credentials
# Generated: $(date)
PORKBUN_API_KEY="$api_key"
PORKBUN_SECRET_KEY="$secret_key"
EOF

    chmod 600 "$ENV_FILE"
    chown root:root "$ENV_FILE"

    print_success "Environment file created: $ENV_FILE"
}

# Create systemd service
create_service() {
    print_status "Creating systemd service..."

    # Use standalone file if it exists, otherwise create inline
    local service_template="$SCRIPT_DIR/update-dns.service"
    if [ -f "$service_template" ]; then
        cp "$service_template" "$SERVICE_FILE"
        print_success "Service file copied from template: $SERVICE_FILE"
    else
        cat > "$SERVICE_FILE" <<'EOF'
[Unit]
Description=BendBionics Dynamic DNS Update Service
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/update-dns.sh
StandardOutput=journal
StandardError=journal
SyslogIdentifier=update-dns

# Security settings
PrivateTmp=true
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/var/log /var/run
ProtectHome=true

[Install]
WantedBy=multi-user.target
EOF
        print_success "Service file created: $SERVICE_FILE"
    fi
}

# Create systemd timer
create_timer() {
    print_status "Creating systemd timer..."

    # Use standalone file if it exists, otherwise create inline
    local timer_template="$SCRIPT_DIR/update-dns.timer"
    if [ -f "$timer_template" ]; then
        cp "$timer_template" "$TIMER_FILE"
        print_success "Timer file copied from template: $TIMER_FILE"
    else
        cat > "$TIMER_FILE" <<'EOF'
[Unit]
Description=BendBionics Dynamic DNS Update Timer
Requires=update-dns.service

[Timer]
# Run every 10 minutes
OnCalendar=*:0/10
# Run immediately on boot (after 2 minutes)
OnBootSec=2min
# Run immediately if missed
Persistent=true
# Randomize by 30 seconds to avoid thundering herd
RandomizedDelaySec=30s

[Install]
WantedBy=timers.target
EOF
        print_success "Timer file created: $TIMER_FILE"
    fi
}

# Enable and start services
enable_services() {
    print_status "Enabling and starting services..."

    systemctl daemon-reload
    systemctl enable update-dns.timer
    systemctl start update-dns.timer

    print_success "Timer enabled and started"
}

# Test script
test_script() {
    print_status "Testing DDNS update script..."

    if "$INSTALL_DIR/update-dns.sh"; then
        print_success "Script test successful"
    else
        print_error "Script test failed"
        print_warning "Check logs: journalctl -u update-dns.service -n 50"
        return 1
    fi
}

# Show status
show_status() {
    echo ""
    print_status "DDNS Setup Complete!"
    echo ""
    echo "Service Status:"
    systemctl status update-dns.timer --no-pager -l || true
    echo ""
    echo "✓ Timer will automatically start on server boot"
    echo "✓ Timer runs every 10 minutes"
    echo "✓ Script installed to /usr/local/bin/ (won't be overwritten by deployment)"
    echo "✓ Configuration stored in /etc/porkbun-dns/ (preserved across deployments)"
    echo ""
    echo "View logs:"
    echo "  journalctl -u update-dns.service -f"
    echo ""
    echo "Check timer:"
    echo "  systemctl status update-dns.timer"
    echo ""
    echo "Manual run:"
    echo "  sudo systemctl start update-dns.service"
    echo ""
    echo "Verify auto-start on boot:"
    echo "  systemctl is-enabled update-dns.timer"
    echo ""
}

# Main execution
main() {
    echo "=========================================="
    echo "BendBionics Dynamic DNS Setup"
    echo "=========================================="
    echo ""

    check_root
    check_script

    install_script
    setup_env_file
    create_service
    create_timer
    enable_services

    echo ""
    print_status "Running initial test..."
    test_script || print_warning "Initial test had issues, but service is installed"

    show_status
}

# Run main function
main "$@"

