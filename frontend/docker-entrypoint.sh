#!/bin/sh

# Generate runtime configuration with cache bust
# Get API URL from environment variable or use default
API_URL=${RAILWAY_STATIC_URL:-http://localhost:8000}

cat > /usr/share/nginx/html/config.js << EOF
// Cache bust: $(date +%s)
window.APP_CONFIG = {
  API_URL: '${API_URL}'
};
console.log('Config loaded:', window.APP_CONFIG);
EOF

# Start nginx
exec nginx -g 'daemon off;'
