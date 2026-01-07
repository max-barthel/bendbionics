#!/bin/bash

# BendBionics - Web Build Script
# Builds the frontend for web deployment

set -e  # Exit on any error

# Source shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/scripts/lib.sh"

# Colors for local use
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test mode flag
TEST_MODE=false
BACKEND_PID=""
FRONTEND_PID=""

# Function to check prerequisites
check_build_prerequisites() {
    print_status "Checking build prerequisites..."
    if [ "$TEST_MODE" = "true" ]; then
        check_prerequisites true true false true
    else
        check_prerequisites true false false true
    fi
    print_status "Bun version: $(bun --version) ✓"
    print_success "Prerequisites check completed"
}

# Function to clean previous builds
clean_build() {
    print_status "Cleaning previous web builds..."

    # Clean frontend dist directory
    if [ -d "frontend/dist" ]; then
        rm -rf frontend/dist
        print_status "Removed previous frontend build"
    fi

    # Clean any old build artifacts
    if [ -d "frontend/src-tauri" ]; then
        print_warning "Legacy Tauri directory found. This is now a web-only application."
    fi

    print_success "Clean completed"
}

# Function to build frontend for web
build_frontend_web() {
    print_status "Building frontend for web deployment..."

    cd frontend

    # Set production environment
    export NODE_ENV=production

    # Copy production environment file
    if [ -f ".env.production" ]; then
        print_status "Using production environment configuration"
        cp .env.production .env.local
    else
        print_error ".env.production not found. Please create it from .env.production.example"
        exit 1
    fi

    # Build with TypeScript check
    print_status "Running TypeScript compilation and web build..."
    bun run build

    if [ $? -ne 0 ]; then
        print_error "Frontend web build failed"
        exit 1
    fi

    # Verify build output
    if [ ! -d "dist" ]; then
        print_error "Build output directory not found"
        exit 1
    fi

    # Check for essential files
    if [ ! -f "dist/index.html" ]; then
        print_error "index.html not found in build output"
        exit 1
    fi

    print_success "Frontend web build completed"
    cd ..
}

# Function to validate build output
validate_build() {
    print_status "Validating web build output..."

    # Check for required files
    local required_files=("index.html" "css" "js")
    local missing_files=()

    for file in "${required_files[@]}"; do
        if [ ! -e "frontend/dist/$file" ]; then
            missing_files+=("$file")
        fi
    done

    if [ ${#missing_files[@]} -ne 0 ]; then
        print_error "Missing required build files: ${missing_files[*]}"
        exit 1
    fi

    # Check build size
    local build_size=$(du -sh frontend/dist | cut -f1)
    print_status "Build size: $build_size"

    # Check for any desktop-specific files that shouldn't be in web build
    if find frontend/dist -name "*desktop*" | grep -q .; then
        print_warning "Found desktop-specific files in web build. This may indicate build issues."
    fi

    print_success "Build validation completed"
}


# Function to show build results
show_build_results() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}🌐 Web Build Results${NC}"
    echo -e "${CYAN}================================${NC}"

    # Show build timestamp
    echo -e "Build Time: ${GREEN}$(date)${NC}"

    # Show build location
    if [ -d "frontend/dist" ]; then
        echo -e "Web Build: ${GREEN}frontend/dist/${NC}"
        echo -e "Build Size: ${GREEN}$(du -sh frontend/dist | cut -f1)${NC}"
    fi

    echo -e "${CYAN}================================${NC}"
    print_success "Web build completed successfully!"
    echo -e "\n${YELLOW}🚀 For Docker deployment, see:${NC}"
    echo -e "${GREEN}scripts/docker/build-and-push.sh${NC} - Build and push Docker images"
    echo -e "${GREEN}docs/DOCKER_DEPLOYMENT.md${NC} - Deployment guide"
}

# Test mode functions
clean_test_environment() {
    print_status "Cleaning test environment..."

    # Clean frontend dist directory
    if [ -d "frontend/dist" ]; then
        rm -rf frontend/dist
        print_status "Removed previous frontend build"
    fi

    # Kill any existing processes on test ports
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true

    print_success "Test environment cleaned"
}

start_backend_test() {
    print_status "Starting backend for testing..."

    cd backend

    if ! command -v uv &> /dev/null; then
        print_error "uv is not installed. Install from https://github.com/astral-sh/uv"
        exit 1
    fi

    if [ ! -d ".venv" ]; then
        uv venv
    fi
    uv sync

    uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 &
    BACKEND_PID=$!
    cd ..

    sleep 3
    curl -s -f "http://127.0.0.1:8000/api/health" > /dev/null || {
        print_error "Backend health check failed"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    }

    print_success "Backend is running"
}

start_frontend_test() {
    print_status "Starting frontend preview..."

    cd frontend
    bun run preview:web &
    FRONTEND_PID=$!
    cd ..

    sleep 3
    curl -s -f "http://127.0.0.1:3000" > /dev/null || {
        print_error "Frontend health check failed"
        kill $FRONTEND_PID 2>/dev/null || true
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    }

    print_success "Frontend is running"
}

run_integration_tests() {
    print_status "Running integration tests..."

    curl -s -f "http://127.0.0.1:8000/api/health" | grep -q "healthy" || {
        print_error "Health endpoint failed"
        return 1
    }

    print_success "Integration tests completed"
}

show_test_results() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}🧪 Test Results${NC}"
    echo -e "${CYAN}================================${NC}"

    echo -e "Frontend URL: ${GREEN}http://127.0.0.1:3000${NC}"
    echo -e "Backend URL: ${GREEN}http://127.0.0.1:8000${NC}"
    echo -e "API Docs: ${GREEN}http://127.0.0.1:8000/docs${NC}"
    echo -e "Health Check: ${GREEN}http://127.0.0.1:8000/api/health${NC}"

    echo -e "\n${BLUE}Manual Testing:${NC}"
    echo -e "1. Open ${GREEN}http://127.0.0.1:3000${NC} in your browser"
    echo -e "2. Test the application functionality"
    echo -e "3. Check browser console for errors"
    echo -e "4. Verify API calls are working"

    echo -e "\n${BLUE}To stop test servers:${NC}"
    echo -e "Press ${YELLOW}Ctrl+C${NC} or run:"
    echo -e "kill $BACKEND_PID $FRONTEND_PID"

    echo -e "${CYAN}================================${NC}"
    print_success "Web build testing completed!"
}

cleanup_test() {
    print_status "Cleaning up test processes..."

    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        print_status "Backend process terminated"
    fi

    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        print_status "Frontend process terminated"
    fi

    # Kill any remaining processes on test ports
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true

    print_success "Cleanup completed"
}

# Main execution
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --test)
                TEST_MODE=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --test           Test build locally (builds and starts test servers)"
                echo "  --help           Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0                # Build for production"
                echo "  $0 --test         # Build and test locally"
                echo ""
                echo "For Docker deployment, see:"
                echo "  scripts/docker/build-and-push.sh  # Build and push Docker images"
                echo "  docs/DOCKER_DEPLOYMENT.md        # Deployment guide"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    if [ "$TEST_MODE" = "true" ]; then
        print_header "🧪 BendBionics Build Testing"
        trap cleanup_test EXIT INT TERM
    else
        print_header "🌐 BendBionics Web Build"
    fi

    # Ensure bun is available before any operations
    ensure_bun_in_path

    # Standard build process
    check_directory
    check_build_prerequisites

    if [ "$TEST_MODE" = "true" ]; then
        clean_test_environment
    else
        clean_build
    fi

    build_frontend_web
    validate_build

    if [ "$TEST_MODE" = "true" ]; then
        start_backend_test
        start_frontend_test
        run_integration_tests
        show_test_results
        print_status "Test servers are running. Press Ctrl+C to stop."
        wait
    else
        show_build_results
    fi
}

# Run main function
main "$@"
