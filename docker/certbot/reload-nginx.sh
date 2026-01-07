#!/bin/sh
# Certbot deploy hook to reload nginx after certificate renewal
# This script is called by certbot after successful certificate renewal

echo "Certificate renewed, reloading nginx..."

# Reload nginx using docker exec (nginx container must be accessible)
# We use docker exec to send reload signal to nginx process
if command -v docker >/dev/null 2>&1; then
    # Try to reload nginx container (graceful reload)
    if docker exec bendbionics-nginx nginx -s reload 2>/dev/null; then
        echo "Nginx reloaded successfully"
        exit 0
    fi

    # If reload fails, try restart
    echo "Failed to reload nginx via docker exec, trying restart..."
    if docker restart bendbionics-nginx 2>/dev/null; then
        echo "Nginx restarted successfully"
        exit 0
    fi

    # If both fail, log warning but don't fail (certbot will continue)
    echo "Warning: Could not reload/restart nginx. Please restart manually: docker restart bendbionics-nginx"
    exit 0
else
    echo "Warning: docker command not found. Please restart nginx manually."
    exit 0
fi

