#!/bin/sh
# Nginx entrypoint script with conditional SSL support
# Enables HTTPS only when SSL certificates are available

set -e

SSL_CERT_PATH="/etc/nginx/ssl/certs/fullchain.pem"
SSL_KEY_PATH="/etc/nginx/ssl/private/privkey.pem"
NGINX_CONF="/etc/nginx/nginx.conf"
NGINX_CONF_TEMPLATE="/etc/nginx/nginx.conf.template"

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

