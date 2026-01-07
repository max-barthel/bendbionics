#!/bin/bash

# BendBionics Docker Build and Push Script
# Builds images locally and pushes to registry (Docker Hub, GitHub Container Registry, etc.)
# Then you just pull and run on VPS - no source code needed!

set -e

# Source shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib.sh"

# Configuration
REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"  # or docker.io for Docker Hub
IMAGE_PREFIX="${DOCKER_IMAGE_PREFIX:-max-barthel/bendbionics}"
VERSION="${VERSION:-latest}"

# Check prerequisites
check_prerequisites() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        exit 1
    fi
}

# Build images
build_images() {
    local no_cache_flag=""
    if [ "$NO_CACHE" = "true" ]; then
        no_cache_flag="--no-cache"
        print_status "Building without cache..."
    fi

    print_status "Building Docker images..."

    # Build backend
    print_status "Building backend image..."
    docker build --platform linux/amd64 $no_cache_flag \
        -t "${REGISTRY}/${IMAGE_PREFIX}-backend:${VERSION}" \
        -t "${REGISTRY}/${IMAGE_PREFIX}-backend:latest" \
        ./backend

    # Build frontend
    print_status "Building frontend image..."
    docker build --platform linux/amd64 $no_cache_flag \
        -t "${REGISTRY}/${IMAGE_PREFIX}-frontend:${VERSION}" \
        -t "${REGISTRY}/${IMAGE_PREFIX}-frontend:latest" \
        ./frontend

    # Build nginx
    print_status "Building nginx image..."
    docker build --platform linux/amd64 $no_cache_flag \
        -t "${REGISTRY}/${IMAGE_PREFIX}-nginx:${VERSION}" \
        -t "${REGISTRY}/${IMAGE_PREFIX}-nginx:latest" \
        ./docker/nginx

    print_success "All images built successfully"
}

# Push images
push_images() {
    print_status "Pushing images to registry..."

    # Login check
    if [ "$REGISTRY" = "ghcr.io" ]; then
        print_status "Make sure you're logged in: docker login ghcr.io"
    elif [ "$REGISTRY" = "docker.io" ]; then
        print_status "Make sure you're logged in: docker login"
    fi

    read -p "Press Enter to continue with push..."

    docker push "${REGISTRY}/${IMAGE_PREFIX}-backend:${VERSION}"
    docker push "${REGISTRY}/${IMAGE_PREFIX}-backend:latest"

    docker push "${REGISTRY}/${IMAGE_PREFIX}-frontend:${VERSION}"
    docker push "${REGISTRY}/${IMAGE_PREFIX}-frontend:latest"

    docker push "${REGISTRY}/${IMAGE_PREFIX}-nginx:${VERSION}"
    docker push "${REGISTRY}/${IMAGE_PREFIX}-nginx:latest"

    print_success "All images pushed successfully"
}

# Show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --build-only    Only build images, don't push"
    echo "  --push-only     Only push images (assumes already built)"
    echo "  --no-cache      Build without using cache"
    echo "  --version VER   Set image version (default: latest)"
    echo "  --registry REG  Set registry (default: ghcr.io, or docker.io)"
    echo "  --help          Show this help"
    echo ""
    echo "Environment variables:"
    echo "  DOCKER_REGISTRY        Registry URL (default: ghcr.io)"
    echo "  DOCKER_IMAGE_PREFIX     Image prefix (default: max-barthel/bendbionics)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Build and push to ghcr.io"
    echo "  $0 --build-only                       # Just build"
    echo "  $0 --version v1.0.0                   # Build with version tag"
    echo "  DOCKER_REGISTRY=docker.io $0          # Use Docker Hub"
}

# Main
main() {
    local build_only=false
    local push_only=false
    NO_CACHE="false"

    while [[ $# -gt 0 ]]; do
        case $1 in
            --build-only)
                build_only=true
                shift
                ;;
            --push-only)
                push_only=true
                shift
                ;;
            --no-cache)
                NO_CACHE="true"
                shift
                ;;
            --version)
                VERSION="$2"
                shift 2
                ;;
            --registry)
                REGISTRY="$2"
                shift 2
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    print_header "🐳 Build and Push Docker Images"

    check_prerequisites

    if [ "$push_only" = false ]; then
        build_images
    fi

    if [ "$build_only" = false ]; then
        push_images
    fi

    print_success "Done!"
    echo ""
    print_status "Images available at:"
    echo "  ${REGISTRY}/${IMAGE_PREFIX}-backend:${VERSION}"
    echo "  ${REGISTRY}/${IMAGE_PREFIX}-frontend:${VERSION}"
    echo "  ${REGISTRY}/${IMAGE_PREFIX}-nginx:${VERSION}"
    echo ""
    print_status "On your VPS, use docker-compose.pull.yml to pull and run these images"
}

main "$@"

