#!/bin/bash

# Setup Passwordless Sudo for BendBionics Deployment
# Run this once before your first deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SERVER_USER="serveruser"
SERVER_HOST="bendbionics"

echo "================================"
echo "🔐 Setup Passwordless Sudo"
echo "================================"
echo ""

# Check SSH connection
print_status "Testing SSH connection..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$SERVER_USER@$SERVER_HOST" "echo 'OK'" >/dev/null 2>&1; then
    print_error "Cannot connect to server. Set up SSH keys first:"
    echo "  ssh-copy-id $SERVER_USER@$SERVER_HOST"
    exit 1
fi
print_success "SSH connection working"

print_warning "You'll be prompted for your server password once"
echo ""

# Create and upload the sudoers configuration directly
ssh -t "$SERVER_USER@$SERVER_HOST" bash << 'ENDSSH'
SUDOERS_FILE="/etc/sudoers.d/bendbionics-deploy"
TEMP_FILE=$(mktemp)

# Write sudoers configuration
cat > "$TEMP_FILE" << 'EOF'
# BendBionics Deployment - Passwordless sudo
Cmnd_Alias DEPLOYMENT_CMDS = /usr/bin/apt, /usr/bin/apt-get, \
                              /bin/systemctl, /usr/bin/systemctl, \
                              /usr/sbin/nginx, \
                              /usr/bin/psql, /usr/bin/createdb, /usr/bin/createuser, \
                              /bin/chown, /usr/bin/chown, \
                              /bin/chmod, /usr/bin/chmod, \
                              /bin/mkdir, /usr/bin/mkdir, \
                              /bin/cp, /usr/bin/cp, \
                              /bin/mv, /usr/bin/mv, \
                              /bin/rm, /usr/bin/rm, \
                              /usr/sbin/certbot, \
                              /usr/bin/journalctl

serveruser ALL=(ALL) NOPASSWD: DEPLOYMENT_CMDS
serveruser ALL=(postgres) NOPASSWD: ALL
EOF

# Install configuration
sudo install -m 0440 "$TEMP_FILE" "$SUDOERS_FILE"
rm "$TEMP_FILE"

# Verify
if sudo visudo -cf "$SUDOERS_FILE"; then
    echo "✓ Configuration valid"

    # Remove old config if exists
    if [ -f "/etc/sudoers.d/soft-robot-deploy" ]; then
        sudo rm -f /etc/sudoers.d/soft-robot-deploy
        echo "✓ Old configuration removed"
    fi
else
    echo "✗ Configuration invalid"
    exit 1
fi
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    print_success "Passwordless sudo configured!"
    echo ""
    print_warning "Log out and back in for changes to take effect:"
    echo "  ssh $SERVER_USER@$SERVER_HOST"
    echo "  sudo -n echo 'Working!'"
    echo "  exit"
else
    print_error "Setup failed"
    exit 1
fi

echo ""
echo "================================"
print_success "Setup complete!"
echo "================================"
