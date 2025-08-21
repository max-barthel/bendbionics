#!/bin/sh

# Generate runtime configuration with cache bust
cat > /usr/share/nginx/html/config.js << EOF
// Cache bust: $(date +%s)
window.APP_CONFIG = {
  API_URL: 'http://localhost:8000'
};
console.log('Config loaded:', window.APP_CONFIG);
EOF

# Start nginx
exec nginx -g 'daemon off;'
