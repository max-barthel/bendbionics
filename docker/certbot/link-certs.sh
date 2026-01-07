#!/bin/sh
# Link certificates from certbot's directory structure to nginx's expected paths
# Certbot stores certificates at /etc/letsencrypt/live/<domain>/
# Nginx expects them at /etc/nginx/ssl/certs/ and /etc/nginx/ssl/private/

set -e

CERTBOT_LIVE="/etc/letsencrypt/live"
NGINX_CERTS="/etc/nginx/ssl/certs"
NGINX_PRIVATE="/etc/nginx/ssl/private"

# Create directories if they don't exist
mkdir -p "$NGINX_CERTS"
mkdir -p "$NGINX_PRIVATE"

# Check if certbot certificates exist
if [ ! -d "$CERTBOT_LIVE" ]; then
    echo "No certbot certificates found at $CERTBOT_LIVE"
    exit 0
fi

# Find the first domain directory (certbot creates one per certificate)
DOMAIN_DIR=$(find "$CERTBOT_LIVE" -mindepth 1 -maxdepth 1 -type d | head -n 1)

if [ -z "$DOMAIN_DIR" ]; then
    echo "No domain directories found in $CERTBOT_LIVE"
    exit 0
fi

DOMAIN=$(basename "$DOMAIN_DIR")
echo "Linking certificates for domain: $DOMAIN"

# Link fullchain.pem
if [ -f "$DOMAIN_DIR/fullchain.pem" ]; then
    ln -sf "$DOMAIN_DIR/fullchain.pem" "$NGINX_CERTS/fullchain.pem"
    echo "Linked fullchain.pem"
else
    echo "Warning: fullchain.pem not found for domain $DOMAIN"
fi

# Link privkey.pem
if [ -f "$DOMAIN_DIR/privkey.pem" ]; then
    ln -sf "$DOMAIN_DIR/privkey.pem" "$NGINX_PRIVATE/privkey.pem"
    echo "Linked privkey.pem"
else
    echo "Warning: privkey.pem not found for domain $DOMAIN"
fi

# Link chain.pem (needed for OCSP stapling)
if [ -f "$DOMAIN_DIR/chain.pem" ]; then
    ln -sf "$DOMAIN_DIR/chain.pem" "$NGINX_CERTS/chain.pem"
    echo "Linked chain.pem"
else
    echo "Warning: chain.pem not found for domain $DOMAIN"
fi

echo "Certificate linking complete"

