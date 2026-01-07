#!/bin/sh
# Nginx entrypoint script with conditional SSL support
# Enables HTTPS only when SSL certificates are available

set -e

SSL_CERT_PATH="/etc/nginx/ssl/certs/fullchain.pem"
SSL_KEY_PATH="/etc/nginx/ssl/private/privkey.pem"
NGINX_CERTS="/etc/nginx/ssl/certs"
NGINX_PRIVATE="/etc/nginx/ssl/private"
NGINX_CONF="/etc/nginx/nginx.conf"
NGINX_CONF_TEMPLATE="/etc/nginx/nginx.conf.template"

# Create directories if they don't exist
mkdir -p "$NGINX_CERTS"
mkdir -p "$NGINX_PRIVATE"

# Check if certificates exist in certbot's directory structure and link them
# Certbot stores certificates at /etc/letsencrypt/live/<domain>/
# In nginx container, the same volume is mounted at /etc/nginx/ssl/certs/
# Certbot creates symlinks that point to /etc/letsencrypt/archive/<domain>/
# In nginx container, archive is mounted at /etc/nginx/ssl/private/
if [ ! -f "$SSL_CERT_PATH" ] || [ ! -f "$SSL_KEY_PATH" ]; then
    # Find domain directories in the certbot structure
    DOMAIN_DIR=$(find "$NGINX_CERTS" -mindepth 1 -maxdepth 1 -type d | head -n 1)

    if [ -n "$DOMAIN_DIR" ] && [ -d "$DOMAIN_DIR" ]; then
        DOMAIN=$(basename "$DOMAIN_DIR")
        echo "Found certbot certificates for domain: $DOMAIN"

        # Resolve symlinks and create new symlinks pointing to archive location in nginx container
        # Certbot symlinks point to /etc/letsencrypt/archive/<domain>/<file>
        # We need to point to /etc/nginx/ssl/private/<domain>/<file>

        # Link fullchain.pem (resolve symlink to get actual filename)
        if [ -e "$DOMAIN_DIR/fullchain.pem" ]; then
            # Read the symlink target to get the actual filename (e.g., fullchain1.pem)
            TARGET=$(readlink "$DOMAIN_DIR/fullchain.pem" 2>/dev/null || echo "")
            if [ -n "$TARGET" ]; then
                # Extract filename from path (e.g., fullchain1.pem from /etc/letsencrypt/archive/domain/fullchain1.pem)
                FILENAME=$(basename "$TARGET")
                # Create symlink to archive location in nginx container
                if [ -f "$NGINX_PRIVATE/$DOMAIN/$FILENAME" ]; then
                    ln -sf "$NGINX_PRIVATE/$DOMAIN/$FILENAME" "$SSL_CERT_PATH"
                    echo "Linked fullchain.pem to archive file"
                else
                    # Fallback: link directly (may not work if symlink target path doesn't exist)
                    ln -sf "$DOMAIN_DIR/fullchain.pem" "$SSL_CERT_PATH"
                    echo "Linked fullchain.pem (direct)"
                fi
            else
                # Not a symlink, link directly
                ln -sf "$DOMAIN_DIR/fullchain.pem" "$SSL_CERT_PATH"
                echo "Linked fullchain.pem"
            fi
        fi

        # Link privkey.pem
        if [ -e "$DOMAIN_DIR/privkey.pem" ]; then
            TARGET=$(readlink "$DOMAIN_DIR/privkey.pem" 2>/dev/null || echo "")
            if [ -n "$TARGET" ]; then
                FILENAME=$(basename "$TARGET")
                if [ -f "$NGINX_PRIVATE/$DOMAIN/$FILENAME" ]; then
                    ln -sf "$NGINX_PRIVATE/$DOMAIN/$FILENAME" "$SSL_KEY_PATH"
                    echo "Linked privkey.pem to archive file"
                else
                    ln -sf "$DOMAIN_DIR/privkey.pem" "$SSL_KEY_PATH"
                    echo "Linked privkey.pem (direct)"
                fi
            else
                ln -sf "$DOMAIN_DIR/privkey.pem" "$SSL_KEY_PATH"
                echo "Linked privkey.pem"
            fi
        fi

        # Link chain.pem (needed for OCSP stapling)
        if [ -e "$DOMAIN_DIR/chain.pem" ]; then
            TARGET=$(readlink "$DOMAIN_DIR/chain.pem" 2>/dev/null || echo "")
            if [ -n "$TARGET" ]; then
                FILENAME=$(basename "$TARGET")
                if [ -f "$NGINX_PRIVATE/$DOMAIN/$FILENAME" ]; then
                    ln -sf "$NGINX_PRIVATE/$DOMAIN/$FILENAME" "$NGINX_CERTS/chain.pem"
                    echo "Linked chain.pem to archive file"
                else
                    ln -sf "$DOMAIN_DIR/chain.pem" "$NGINX_CERTS/chain.pem"
                    echo "Linked chain.pem (direct)"
                fi
            else
                ln -sf "$DOMAIN_DIR/chain.pem" "$NGINX_CERTS/chain.pem"
                echo "Linked chain.pem"
            fi
        fi
    fi
fi

# Check if SSL certificates exist
if [ -f "$SSL_CERT_PATH" ] && [ -f "$SSL_KEY_PATH" ]; then
    echo "SSL certificates found - enabling HTTPS"
    # Use the full nginx.conf template with SSL enabled
    if [ -f "$NGINX_CONF_TEMPLATE" ]; then
        cp "$NGINX_CONF_TEMPLATE" "$NGINX_CONF"
    else
        echo "Warning: nginx.conf.template not found, using default config"
    fi
else
    echo "SSL certificates not found - running in HTTP-only mode"
    # Generate nginx.conf without HTTPS server block
    # We'll modify the HTTP server block to serve content instead of redirecting

    # Create a temporary config without SSL
    cat > "$NGINX_CONF" << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

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

    # HTTP server (no HTTPS redirect when SSL not available)
    server {
        listen 80;
        server_name _;

        # Let's Encrypt challenge
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        # Health check endpoint
        location /health {
            proxy_pass http://backend:8000/api/health;
            proxy_set_header Host $host;
            access_log off;
        }

        # Serve frontend static files (proxy to frontend container)
        location / {
            proxy_pass http://frontend:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Handle SPA routing - frontend nginx handles this
            proxy_intercept_errors off;
        }

        # Proxy API requests to backend
        location ~ ^/(api|auth|presets|tendons|kinematics|docs|openapi\.json|redoc) {
            # Handle preflight requests
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*';
                add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
                add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept';
                add_header 'Access-Control-Max-Age' 86400;
                add_header 'Content-Type' 'text/plain; charset=utf-8';
                add_header 'Content-Length' 0;
                return 204;
            }

            proxy_pass http://backend:8000;
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

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://frontend:80;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF
fi

# Test nginx configuration
nginx -t

# Start nginx
exec nginx -g "daemon off;"

