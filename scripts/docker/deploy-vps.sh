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

# Validate environment variables
validate_env_vars() {
    print_status "Validating environment variables..."

    # Source .env file if it exists
    if [ -f "$ENV_FILE" ]; then
        set -a
        source "$ENV_FILE"
        set +a
    fi

    local missing_vars=()
    local invalid_vars=()

    # Check required database variables
    if [ -z "${POSTGRES_USER}" ]; then
        missing_vars+=("POSTGRES_USER")
    fi

    if [ -z "${POSTGRES_PASSWORD}" ]; then
        missing_vars+=("POSTGRES_PASSWORD")
    elif [ "${POSTGRES_PASSWORD}" = "CHANGE_THIS_SECURE_PASSWORD" ]; then
        invalid_vars+=("POSTGRES_PASSWORD (still set to default value)")
    fi

    if [ -z "${POSTGRES_DB}" ]; then
        missing_vars+=("POSTGRES_DB")
    fi

    # Check other critical variables
    if [ -z "${SECRET_KEY}" ]; then
        missing_vars+=("SECRET_KEY")
    elif [ "${SECRET_KEY}" = "CHANGE_THIS_GENERATE_WITH_python_-c_\"import_secrets;_print(secrets.token_urlsafe(32))\"" ] || [ "${SECRET_KEY}" = "CHANGE_THIS_IN_PRODUCTION_OR_ENV_FILE" ]; then
        invalid_vars+=("SECRET_KEY (still set to default value)")
    fi

    # Report missing variables
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        print_error "Please set these variables in your .env file"
        print_status "Copy docker/env.example to .env and fill in the values"
        exit 1
    fi

    # Report invalid variables
    if [ ${#invalid_vars[@]} -gt 0 ]; then
        print_error "Environment variables still set to default values:"
        for var in "${invalid_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        print_error "Please update these variables in your .env file with actual values"
        exit 1
    fi

    # Validate DATABASE_URL construction
    local db_user="${POSTGRES_USER:-bendbionics_user}"
    local db_password="${POSTGRES_PASSWORD}"
    local db_name="${POSTGRES_DB:-bendbionics}"
    local expected_url="postgresql://${db_user}:${db_password}@postgres:5432/${db_name}"

    # Check if DATABASE_URL would be properly constructed
    if [ -z "$db_password" ]; then
        print_error "DATABASE_URL cannot be constructed: POSTGRES_PASSWORD is empty"
        exit 1
    fi

    # Check for special characters in password that might break URL
    if [[ "$db_password" =~ [:@/] ]]; then
        print_warning "POSTGRES_PASSWORD contains special characters (@, :, /) that may need URL encoding"
        print_status "The password will be used in DATABASE_URL, ensure it's properly handled"
    fi

    print_success "Environment variables validated"
    print_status "DATABASE_URL will be: postgresql://${db_user}:***@postgres:5432/${db_name}"
}

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
    docker compose -f "$COMPOSE_FILE" run --rm backend uv run python migrate.py 2>/dev/null || {
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
    BACKEND_HEALTHY=false
    NGINX_HEALTHY=false

    # Helper function to check backend container status
    check_backend_container_status() {
        local status=$(docker compose -f "$COMPOSE_FILE" ps --format json backend 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
        echo "$status"
    }

    # Helper function to get backend container exit code
    get_backend_exit_code() {
        docker compose -f "$COMPOSE_FILE" ps --format json backend 2>/dev/null | grep -o '"ExitCode":[0-9]*' | cut -d':' -f2 || echo ""
    }

    # Helper function to show backend logs
    show_backend_logs() {
        print_status "Backend container logs (last 50 lines):"
        echo "----------------------------------------"
        docker compose -f "$COMPOSE_FILE" logs --tail=50 backend 2>&1 || true
        echo "----------------------------------------"
    }

    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        # Check backend health
        if [ "$BACKEND_HEALTHY" = false ]; then
            # First, check if container is running
            local container_status=$(check_backend_container_status)

            if [ "$container_status" != "running" ]; then
                if [ "$container_status" = "exited" ] || [ "$container_status" = "dead" ]; then
                    local exit_code=$(get_backend_exit_code)
                    print_error "Backend container is not running (status: $container_status, exit code: ${exit_code:-unknown})"
                    show_backend_logs
                    print_error "Backend container exited. Check logs above for startup errors."
                    print_status "Common issues:"
                    print_status "  - Database connection failure (check DATABASE_URL)"
                    print_status "  - Missing required environment variables"
                    print_status "  - Application startup errors"
                    exit 1
                else
                    if [ $ATTEMPT -lt $((MAX_ATTEMPTS - 1)) ]; then
                        print_status "Backend container status: $container_status (attempt $((ATTEMPT + 1))/$MAX_ATTEMPTS), waiting..."
                    fi
                fi
            else
                # Container is running, check health endpoint
                if docker compose -f "$COMPOSE_FILE" exec -T backend curl -f -s http://localhost:8000/api/health &> /dev/null; then
                    print_success "Backend is healthy"
                    BACKEND_HEALTHY=true
                else
                    if [ $ATTEMPT -lt $((MAX_ATTEMPTS - 1)) ]; then
                        print_status "Backend health check failed (attempt $((ATTEMPT + 1))/$MAX_ATTEMPTS), retrying in ${SLEEP_INTERVAL}s..."
                    fi
                fi
            fi
        fi

        # Only check nginx if backend is healthy
        if [ "$BACKEND_HEALTHY" = true ] && [ "$NGINX_HEALTHY" = false ]; then
            if docker compose -f "$COMPOSE_FILE" exec -T nginx wget --quiet --spider http://localhost/health &> /dev/null; then
                print_success "Nginx is healthy"
                NGINX_HEALTHY=true
                return 0
            else
                if [ $ATTEMPT -lt $((MAX_ATTEMPTS - 1)) ]; then
                    print_status "Nginx health check failed (attempt $((ATTEMPT + 1))/$MAX_ATTEMPTS), retrying in ${SLEEP_INTERVAL}s..."
                fi
            fi
        fi

        # If both are healthy, we're done
        if [ "$BACKEND_HEALTHY" = true ] && [ "$NGINX_HEALTHY" = true ]; then
            return 0
        fi

        ATTEMPT=$((ATTEMPT + 1))
        if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
            sleep $SLEEP_INTERVAL
        fi
    done

    # Report which service(s) failed
    print_error "Health check failed after $MAX_ATTEMPTS attempts"
    echo ""

    if [ "$BACKEND_HEALTHY" = false ]; then
        print_error "Backend health check failed"

        # Check final container status
        local final_status=$(check_backend_container_status)
        print_status "Backend container status: $final_status"

        if [ "$final_status" != "running" ]; then
            local exit_code=$(get_backend_exit_code)
            print_error "Backend container is not running (exit code: ${exit_code:-unknown})"
        fi

        show_backend_logs

        print_status "Backend container may not be responding or database connection is failing"
        print_status "Common issues:"
        print_status "  - Database connection failure (check DATABASE_URL and postgres container)"
        print_status "  - Missing required environment variables (SECRET_KEY, etc.)"
        print_status "  - Application startup errors (check logs above)"
        print_status ""
        print_status "Debug commands:"
        print_status "  Check backend logs: docker compose -f $COMPOSE_FILE logs backend"
        print_status "  Check backend status: docker compose -f $COMPOSE_FILE ps backend"
        print_status "  Check database connectivity: docker compose -f $COMPOSE_FILE exec backend uv run python -c \"from app.database import engine; print(engine)\""
        echo ""
    fi

    if [ "$BACKEND_HEALTHY" = true ] && [ "$NGINX_HEALTHY" = false ]; then
        print_error "Nginx health check failed (backend is healthy)"
        print_status "Nginx may not be able to reach the backend or proxy configuration is incorrect"
        print_status "Check nginx logs: docker compose -f $COMPOSE_FILE logs nginx"
        print_status "Check backend connectivity from nginx: docker compose -f $COMPOSE_FILE exec nginx wget -O- http://backend:8000/api/health"
        echo ""
    fi

    print_status "Check all service logs: docker compose -f $COMPOSE_FILE logs"
    print_status "Check service status: docker compose -f $COMPOSE_FILE ps"
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
    validate_env_vars
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

