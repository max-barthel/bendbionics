#!/bin/bash

# BendBionics Docker Deployment Script
#
# DEVELOPMENT/TESTING DEPLOYMENT METHOD
#
# This script builds Docker images locally and runs them. It's useful for:
# - Local development and testing
# - Building on the server when registry isn't available
# - Testing Docker setup before using registry-based deployment
#
# For production VPS deployment, use scripts/docker/deploy-vps.sh instead.
# That method pulls pre-built images from a registry and is more efficient.
#
# This script builds images from source code, so you need:
# - Source code on the machine
# - Docker and Docker Compose installed
# - .env file configured

set -e

# Source shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib.sh"

# Configuration
COMPOSE_FILE="docker-compose.yml"
COMPOSE_PROD_FILE="docker-compose.prod.yml"
ENV_FILE=".env"

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Run scripts/docker/setup.sh first"
        exit 1
    fi

    # Check if Docker Compose is available
    if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Run scripts/docker/setup.sh first"
        exit 1
    fi

    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        print_error ".env file not found. Copy docker/env.example to .env and configure it"
        exit 1
    fi

    print_success "Prerequisites check completed"
}

# Build images
build_images() {
    print_status "Building Docker images..."

    docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_PROD_FILE" build --no-cache

    print_success "Images built successfully"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."

    # Wait for database to be ready
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

    # Run migrations
    docker compose -f "$COMPOSE_FILE" run --rm backend uv run python migrate.py || {
        print_warning "Migrations may have failed or already applied"
    }

    print_success "Migrations completed"
}

# Start services
start_services() {
    print_status "Starting services..."

    docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_PROD_FILE" up -d

    print_success "Services started"
}

# Health check
health_check() {
    print_status "Performing health checks..."

    MAX_ATTEMPTS=30
    ATTEMPT=0
    SLEEP_INTERVAL=2
    INITIAL_NGINX_WAIT=5

    # Give nginx a moment to start up before checking
    print_status "Waiting ${INITIAL_NGINX_WAIT}s for nginx to initialize..."
    sleep $INITIAL_NGINX_WAIT

    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        BACKEND_HEALTHY=false
        NGINX_HEALTHY=false

        # Check backend
        if docker compose -f "$COMPOSE_FILE" exec -T backend python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" &> /dev/null; then
            BACKEND_HEALTHY=true
        fi

        # Check nginx (only if backend is healthy)
        if [ "$BACKEND_HEALTHY" = true ]; then
            # First, try to use Docker's built-in healthcheck status (most reliable)
            NGINX_HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' bendbionics-nginx 2>/dev/null || echo "none")

            if [ "$NGINX_HEALTH_STATUS" = "healthy" ]; then
                NGINX_HEALTHY=true
            elif [ "$NGINX_HEALTH_STATUS" = "none" ] || [ "$NGINX_HEALTH_STATUS" = "starting" ]; then
                # Healthcheck not ready yet or not configured, fall back to direct HTTP check from host
                # Check if nginx is responding on port 80 from the host
                if command -v curl &> /dev/null; then
                    if curl -sf http://localhost/health &> /dev/null; then
                        NGINX_HEALTHY=true
                    fi
                elif command -v wget &> /dev/null; then
                    if wget --quiet --spider --timeout=2 http://localhost/health &> /dev/null; then
                        NGINX_HEALTHY=true
                    fi
                else
                    # Last resort: check from inside container (original method)
                    if docker compose -f "$COMPOSE_FILE" exec -T nginx wget --quiet --spider --timeout=2 http://localhost/health &> /dev/null; then
                        NGINX_HEALTHY=true
                    fi
                fi
            fi
            # If health_status is "unhealthy", NGINX_HEALTHY stays false
        fi

        # Both services healthy - success
        if [ "$BACKEND_HEALTHY" = true ] && [ "$NGINX_HEALTHY" = true ]; then
            print_success "Backend is healthy"
            print_success "Nginx is healthy"
            return 0
        fi

        # Increment attempt and retry
        ATTEMPT=$((ATTEMPT + 1))
        if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
            if [ "$BACKEND_HEALTHY" = false ]; then
                print_status "Attempt $ATTEMPT/$MAX_ATTEMPTS: Backend not ready, retrying in ${SLEEP_INTERVAL}s..."
            else
                NGINX_STATUS_MSG=""
                if [ "$NGINX_HEALTH_STATUS" != "none" ] && [ "$NGINX_HEALTH_STATUS" != "" ]; then
                    NGINX_STATUS_MSG=" (Docker healthcheck: $NGINX_HEALTH_STATUS)"
                fi
                print_status "Attempt $ATTEMPT/$MAX_ATTEMPTS: Nginx not ready${NGINX_STATUS_MSG}, retrying in ${SLEEP_INTERVAL}s..."
            fi
            sleep $SLEEP_INTERVAL
        fi
    done

    print_error "Health check failed after $MAX_ATTEMPTS attempts"
    if [ "$BACKEND_HEALTHY" = false ]; then
        print_error "Backend health check failed - backend container may not be responding"
    fi
    if [ "$NGINX_HEALTHY" = false ] && [ "$BACKEND_HEALTHY" = true ]; then
        NGINX_STATUS_MSG=""
        NGINX_HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' bendbionics-nginx 2>/dev/null || echo "unknown")
        if [ "$NGINX_HEALTH_STATUS" != "none" ] && [ "$NGINX_HEALTH_STATUS" != "" ]; then
            NGINX_STATUS_MSG=" (Docker healthcheck status: $NGINX_HEALTH_STATUS)"
        fi
        print_error "Nginx health check failed (backend is healthy)${NGINX_STATUS_MSG}"
        print_status "Nginx container status:"
        docker compose -f "$COMPOSE_FILE" ps nginx
    fi
    print_status "Check logs with: docker compose logs nginx backend"
    exit 1
}

# Show deployment status
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
    echo "  View logs: docker compose logs -f"
    echo "  Stop services: docker compose down"
    echo "  Restart services: docker compose restart"
}

# Main execution
main() {
    local skip_build=false
    local skip_migrations=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                skip_build=true
                shift
                ;;
            --skip-migrations)
                skip_migrations=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --skip-build       Skip building images"
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

    print_header "🐳 BendBionics Docker Deploy"

    check_prerequisites

    if [ "$skip_build" = false ]; then
        build_images
    else
        print_status "Skipping build step"
    fi

    start_services

    if [ "$skip_migrations" = false ]; then
        run_migrations
    else
        print_status "Skipping migrations"
    fi

    health_check
    show_status

    print_success "Deployment completed successfully!"
}

main "$@"

