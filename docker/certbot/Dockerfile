# Custom Certbot image with docker CLI for nginx reload
FROM certbot/certbot:latest

# Install docker CLI (docker package provides docker CLI)
RUN apk add --no-cache docker

# Copy reload script
COPY reload-nginx.sh /usr/local/bin/reload-nginx.sh
RUN chmod +x /usr/local/bin/reload-nginx.sh

