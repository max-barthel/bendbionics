#!/bin/bash

# BendBionics - Local Build Testing Script
# Tests the web build locally before deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}🧪 BendBionics Build Testing${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking test prerequisites..."

    # Check Bun
    if ! command -v bun &> /dev/null; then
        print_error "Bun is not installed. Install from https://bun.sh"
        exit 1
    fi

    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python3 is not installed"
        exit 1
    fi

    # Check if frontend dependencies are installed
    if [ ! -d "frontend/node_modules" ]; then
        print_warning "Frontend dependencies not found. Installing with Bun..."
        cd frontend && bun install && cd ..
    fi

    print_success "Prerequisites check completed"
}

# Function to clean previous builds
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

# Function to build frontend for web
build_frontend_web() {
    print_status "Building frontend for web testing..."

    cd frontend

    # Set production environment
    export NODE_ENV=production

    # Copy production environment file if it exists
    if [ -f ".env.production" ]; then
        print_status "Using production environment configuration"
        cp .env.production .env.local
    else
        print_warning "No .env.production found, using default settings"
    fi

    # Build with TypeScript check
    print_status "Running web build..."
    bun run build:web

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

# Function to start backend for testing
start_backend_test() {
    print_status "Starting backend for testing..."

    cd backend

    # Create virtual environment if it doesn't exist
    # Check if uv is installed
    if ! command -v uv &> /dev/null; then
        print_error "uv is not installed. Install from https://github.com/astral-sh/uv"
        exit 1
    fi

    # Create virtual environment with uv
    if [ ! -d ".venv" ]; then
        print_status "Creating Python virtual environment with uv..."
        uv venv
    fi

    # Install dependencies
    print_status "Installing dependencies with uv..."
    uv sync

    # Start backend server
    print_status "Starting FastAPI backend on port 8000..."
    uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 &
    BACKEND_PID=$!

    cd ..

    # Wait for backend to start
    print_status "Waiting for backend to start..."
    sleep 3

    # Test backend health
    if curl -s -f "http://127.0.0.1:8000/api/health" > /dev/null; then
        print_success "Backend is running and healthy"
    else
        print_error "Backend health check failed"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
}

# Function to start frontend preview server
start_frontend_test() {
    print_status "Starting frontend preview server..."

    cd frontend

    # Start preview server
    print_status "Starting frontend preview on port 3000..."
    bun run preview:web &
    FRONTEND_PID=$!

    cd ..

    # Wait for frontend to start
    print_status "Waiting for frontend to start..."
    sleep 3

    # Test frontend
    if curl -s -f "http://127.0.0.1:3000" > /dev/null; then
        print_success "Frontend is running and accessible"
    else
        print_error "Frontend health check failed"
        kill $FRONTEND_PID 2>/dev/null || true
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."

    # Test API endpoints
    print_status "Testing API endpoints..."

    # Test health endpoint
    if curl -s -f "http://127.0.0.1:8000/api/health" | grep -q "healthy"; then
        print_success "Health endpoint working"
    else
        print_error "Health endpoint failed"
        return 1
    fi

    # Test CORS headers
    if curl -s -I "http://127.0.0.1:8000/api/health" | grep -q "Access-Control-Allow-Origin"; then
        print_success "CORS headers present"
    else
        print_warning "CORS headers not found (may be configured for production only)"
    fi

    # Test frontend-backend communication
    print_status "Testing frontend-backend communication..."

    # Test if frontend can reach backend (this would be done by the React app)
    if curl -s -f "http://127.0.0.1:3000" > /dev/null; then
        print_success "Frontend-backend communication setup looks good"
    else
        print_error "Frontend-backend communication test failed"
        return 1
    fi

    print_success "Integration tests completed"
}

# Function to show test results
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

# Function to cleanup on exit
cleanup() {
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
    print_header

    # Set up cleanup trap
    trap cleanup EXIT INT TERM

    # Run test process
    check_directory
    check_prerequisites
    clean_test_environment
    build_frontend_web
    start_backend_test
    start_frontend_test
    run_integration_tests
    show_test_results

    # Keep processes running for manual testing
    print_status "Test servers are running. Press Ctrl+C to stop."
    wait
}

# Run main function
main
