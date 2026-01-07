#!/bin/bash

# BendBionics - Web Development Script
# Quick and agile development for web application

set -e  # Exit on any error

# Source shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/scripts/lib.sh"

# Function to check prerequisites (startup style - only essential checks)
check_dev_prerequisites() {
    print_status "Quick prerequisite check..."
    check_prerequisites true true true true
    print_success "Prerequisites ready"
}

# Function to run cleanup before development (light mode preserves node_modules)
run_dev_cleanup() {
    print_status "Running development cleanup..."
    ./scripts/cleanup.sh --light
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

    # Check if uv is installed
    if ! command -v uv &> /dev/null; then
        print_error "uv is not installed. Install from https://github.com/astral-sh/uv"
        exit 1
    fi

    # Unset VIRTUAL_ENV to avoid conflicts with root-level venv
    # uv manages its own virtual environment in the project directory
    unset VIRTUAL_ENV

    # Check if .venv exists and is valid (has Python executable)
    if [ -d ".venv" ] && [ ! -f ".venv/bin/python" ] && [ ! -f ".venv/bin/python3" ]; then
        print_warning "Corrupted virtual environment detected, removing..."
        rm -rf .venv
    fi

    # Ensure virtual environment exists and dependencies are installed
    if [ ! -d ".venv" ]; then
        print_status "Creating virtual environment with uv..."
        uv venv
    fi

    # Sync dependencies (install/update if needed)
    print_status "Syncing dependencies with uv..."
    uv sync

    # Initialize database and run migrations (we're already in backend directory)
    print_status "Initializing database and running migrations..."
    uv run python setup_dev.py
    DB_INIT_RESULT=$?

    if [ $DB_INIT_RESULT -eq 0 ]; then
        print_success "Database initialized and migrations applied"
    else
        print_warning "Database initialization had issues (continuing anyway)"
    fi

    # Start backend using uv run
    uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!

    cd ..

    # Quick health check (don't fail if it's not ready)
    wait_for_service "http://localhost:8000/api/health" "Backend API"
    print_success "Backend started (PID: $BACKEND_PID)"
}

# Function to start frontend (startup style - simple and fast)
start_frontend() {
    print_status "Starting frontend..."

    cd frontend

    # Start frontend (web development server)
    bun run dev &
    FRONTEND_PID=$!

    cd ..

    print_success "Frontend started (PID: $FRONTEND_PID)"
}

# Function to run quick health checks
run_health_checks() {
    print_status "Running quick health checks..."

    # Check if ports are available
    if lsof -i:8000 > /dev/null 2>&1; then
        print_warning "Port 8000 is already in use"
    fi

    if lsof -i:5173 > /dev/null 2>&1; then
        print_warning "Port 5173 is already in use"
    fi

    # Check dependencies
    if [ ! -d "frontend/node_modules" ]; then
        print_warning "Frontend dependencies not found"
    fi

    if [ ! -d "backend/.venv" ]; then
        print_warning "Backend virtual environment not found (will be created on first run)"
    fi

    print_success "Health checks completed"
}

# Function to show development info (startup style - essential info only)
show_dev_info() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}🌐 Web Development Ready${NC}"
    echo -e "${CYAN}================================${NC}"
    echo -e "Backend API: ${GREEN}http://localhost:8000${NC}"
    echo -e "API Docs: ${GREEN}http://localhost:8000/docs${NC}"
    echo -e "Frontend: ${GREEN}http://localhost:5173${NC}"
    echo -e "${CYAN}================================${NC}"
    echo -e "Press ${YELLOW}Ctrl+C${NC} to stop"
    echo -e "${CYAN}================================${NC}"
}

# Colors for local use (CYAN, YELLOW, GREEN already defined in lib.sh)
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Main execution
main() {
    print_header "🌐 BendBionics Development"

    # Set up cleanup trap
    trap cleanup EXIT INT TERM

    # Run checks
    check_directory
    ensure_bun_in_path
    check_dev_prerequisites
    run_health_checks

    # Light cleanup before starting development (preserves node_modules)
    run_dev_cleanup

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
