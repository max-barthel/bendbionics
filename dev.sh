#!/bin/bash

# Soft Robot App - Startup Development Script
# Quick and agile development - steering a car, not a rocket

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
    echo -e "${PURPLE}🚀 Soft Robot App Development${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
}

# Function to check prerequisites (startup style - only essential checks)
check_prerequisites() {
    print_status "Quick prerequisite check..."

    # Only check what's absolutely essential
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required. Install from https://nodejs.org/"
        exit 1
    fi

    if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
        print_error "Python is required. Install from https://python.org/"
        exit 1
    fi

    # Quick dependency check - install if missing
    if [ ! -d "frontend/node_modules" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend && npm install && cd ..
    fi

    print_success "Prerequisites ready"
}

# Function to wait for service (startup style - quick check)
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=10  # Reduced from 30 to 10
    local attempt=1

    print_status "Quick check for $service_name..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            print_success "$service_name ready!"
            return 0
        fi

        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done

    print_warning "$service_name not responding, but continuing..."
    return 0  # Don't fail, just continue
}

# Function to cleanup processes
cleanup() {
    print_status "Cleaning up processes..."

    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        print_status "Backend process terminated"
    fi

    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        print_status "Frontend process terminated"
    fi

    # Kill any remaining processes on our ports
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true

    print_success "Cleanup completed"
}

# Function to start backend (startup style - simple and fast)
start_backend() {
    print_status "Starting backend..."

    cd backend

    # Quick virtual environment check
    if [ -d ".venv" ]; then
        source .venv/bin/activate
    elif [ -d "venv" ]; then
        source venv/bin/activate
    fi

    # Start backend
    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!

    cd ..

    # Quick health check (don't fail if it's not ready)
    wait_for_service "http://localhost:8000/health" "Backend API"
    print_success "Backend started (PID: $BACKEND_PID)"
}

# Function to start frontend (startup style - simple and fast)
start_frontend() {
    print_status "Starting frontend..."

    cd frontend

    # Quick Rust environment check
    if [ -f "$HOME/.cargo/env" ]; then
        source "$HOME/.cargo/env"
    fi

    # Start frontend
    npm run dev &
    FRONTEND_PID=$!

    cd ..

    print_success "Frontend started (PID: $FRONTEND_PID)"
}

# Function to show development info (startup style - essential info only)
show_dev_info() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}🚀 Development Ready${NC}"
    echo -e "${CYAN}================================${NC}"
    echo -e "Backend API: ${GREEN}http://localhost:8000${NC}"
    echo -e "API Docs: ${GREEN}http://localhost:8000/docs${NC}"
    echo -e "Frontend: ${GREEN}Running in desktop mode${NC}"
    echo -e "${CYAN}================================${NC}"
    echo -e "Press ${YELLOW}Ctrl+C${NC} to stop"
    echo -e "${CYAN}================================${NC}"
}

# Main execution
main() {
    print_header

    # Set up cleanup trap
    trap cleanup EXIT INT TERM

    # Run checks
    check_directory
    check_prerequisites

    # Start services
    start_backend
    start_frontend

    # Show info
    show_dev_info

    # Wait for user interrupt
    print_status "Development environment is running..."
    print_status "Press Ctrl+C to stop all services"

    # Wait for processes
    wait
}

# Run main function
main
