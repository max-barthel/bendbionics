# BendBionics Nginx Reverse Proxy
# Custom nginx image with SSL support

FROM nginx:alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Copy nginx configuration template (with SSL support)
COPY nginx.conf /etc/nginx/nginx.conf.template
COPY ssl.conf /etc/nginx/conf.d/ssl.conf

# Copy entrypoint script
COPY entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create directories for SSL certificates
RUN mkdir -p /etc/nginx/ssl/certs /etc/nginx/ssl/private

# Expose ports
EXPOSE 80 443

# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

