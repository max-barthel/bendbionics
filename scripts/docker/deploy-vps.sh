#!/bin/bash

# BendBionics VPS Deployment Script
#
# PRIMARY DEPLOYMENT METHOD FOR HETZNER VPS
#
# This script is the recommended way to deploy to production VPS servers.
# It pulls pre-built Docker images from a registry (GHCR or Docker Hub),
# so no source code or build tools are needed on the VPS.
#
# Prerequisites:
# - Docker and Docker Compose installed (run scripts/docker/setup.sh)
# - docker-compose.pull.yml and docker-compose.prod.yml files
# - .env file configured with your environment variables
#
# Workflow:
# 1. Build images locally: scripts/docker/build-and-push.sh
# 2. Images are pushed to registry (ghcr.io or docker.io)
# 3. On VPS: Run this script to pull and deploy
#
# For local development/testing, use scripts/docker/deploy.sh instead

set -e

# Source shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

COMPOSE_FILE="docker-compose.yml"
COMPOSE_PROD_FILE="docker-compose.prod.yml"
ENV_FILE=".env"

# Set image variables for registry-based deployment
export USE_REGISTRY_IMAGES=true
export BACKEND_IMAGE="${DOCKER_REGISTRY:-ghcr.io}/${DOCKER_IMAGE_PREFIX:-max-barthel/bendbionics}-backend:${VERSION:-latest}"
export FRONTEND_IMAGE="${DOCKER_REGISTRY:-ghcr.io}/${DOCKER_IMAGE_PREFIX:-max-barthel/bendbionics}-frontend:${VERSION:-latest}"
export NGINX_IMAGE="${DOCKER_REGISTRY:-ghcr.io}/${DOCKER_IMAGE_PREFIX:-max-barthel/bendbionics}-nginx:${VERSION:-latest}"

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Run: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi

    if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi

    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "$COMPOSE_FILE not found. Make sure you have the docker-compose files."
        exit 1
    fi

    if [ ! -f "$ENV_FILE" ]; then
        print_error ".env file not found. Create it from docker/env.example"
        exit 1
    fi

    print_success "Prerequisites check completed"
}

# Pull images
pull_images() {
    print_status "Pulling Docker images from registry..."

    # Login to registry if needed
    if [ -n "${DOCKER_REGISTRY}" ] && [ "${DOCKER_REGISTRY}" != "docker.io" ]; then
        print_status "Make sure you're logged in to ${DOCKER_REGISTRY}"
        print_status "Run: docker login ${DOCKER_REGISTRY}"
    fi

    docker compose -f "$COMPOSE_FILE" pull

    print_success "Images pulled successfully"
}

# Start services
start_services() {
    print_status "Starting services..."

    docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_PROD_FILE" up -d

    print_success "Services started"
}

# Run migrations
run_migrations() {
    print_status "Running database migrations..."

    # Wait for database
    print_status "Waiting for database to be ready..."
    timeout=30
    while ! docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U "${POSTGRES_USER:-bendbionics_user}" &> /dev/null; do
        sleep 1
        timeout=$((timeout - 1))
        if [ $timeout -eq 0 ]; then
            print_error "Database is not ready"
            exit 1
        fi
    done

    # Run migrations (if migrate.py is available in the image, otherwise skip)
    docker compose -f "$COMPOSE_FILE" run --rm backend python migrate.py 2>/dev/null || {
        print_warning "Migrations may not be available in image, or already applied"
    }

    print_success "Migrations completed"
}

# Health check
health_check() {
    print_status "Performing health checks..."

    MAX_ATTEMPTS=30
    ATTEMPT=0
    SLEEP_INTERVAL=2

    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if docker compose -f "$COMPOSE_FILE" exec -T backend python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" &> /dev/null; then
            print_success "Backend is healthy"

            if docker compose -f "$COMPOSE_FILE" exec -T nginx wget --quiet --spider http://localhost/health &> /dev/null; then
                print_success "Nginx is healthy"
                return 0
            fi
        fi

        ATTEMPT=$((ATTEMPT + 1))
        if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
            print_status "Attempt $ATTEMPT/$MAX_ATTEMPTS failed, retrying in ${SLEEP_INTERVAL}s..."
            sleep $SLEEP_INTERVAL
        fi
    done

    print_error "Health check failed"
    print_status "Check logs: docker compose logs"
    exit 1
}

# Show status
show_status() {
    print_status "Deployment status:"
    docker compose -f "$COMPOSE_FILE" ps

    echo ""
    print_status "Service URLs:"
    echo "  Frontend: http://$(hostname -I | awk '{print $1}')"
    echo "  Backend API: http://$(hostname -I | awk '{print $1}')/api"
    echo "  API Docs: http://$(hostname -I | awk '{print $1}')/docs"
    echo ""
    print_status "Useful commands:"
    echo "  View logs: docker compose -f $COMPOSE_FILE logs -f"
    echo "  Stop: docker compose -f $COMPOSE_FILE down"
    echo "  Restart: docker compose -f $COMPOSE_FILE restart"
}

# Main
main() {
    local skip_migrations=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-migrations)
                skip_migrations=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --skip-migrations  Skip database migrations"
                echo "  --help             Show this help"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    print_header "🚀 BendBionics VPS Deployment"

    check_prerequisites
    pull_images
    start_services

    if [ "$skip_migrations" = false ]; then
        run_migrations
    fi

    health_check
    show_status

    print_success "Deployment completed!"
    echo ""
    print_status "Next: Set up SSL certificates with certbot"
}

main "$@"

