#!/bin/bash

# BendBionics - Web Development Script
# Quick and agile development for web application

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
    echo -e "${PURPLE}🌐 BendBionics Development${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to ensure bun is available in PATH
ensure_bun_in_path() {
    # Check if bun is already in PATH
    if command -v bun &> /dev/null; then
        return 0
    fi

    # Simple fallback: add ~/.bun/bin to PATH if bun binary exists there
    if [ -f "$HOME/.bun/bin/bun" ]; then
        export PATH="$HOME/.bun/bin:$PATH"
        if command -v bun &> /dev/null; then
            return 0
        fi
    fi

    # If we get here, bun is not found
    print_error "Bun is not installed or not in PATH"
    print_error "Install from https://bun.sh"
    print_error "Quick install: curl -fsSL https://bun.sh/install | bash"
    print_error "If bun is installed, ensure ~/.zshenv includes: export PATH=\"\$HOME/.bun/bin:\$PATH\""
    exit 1
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

    # Check if Bun is installed
    if ! command -v bun &> /dev/null; then
        print_error "Bun is not installed. Install from https://bun.sh"
        print_error "Quick install: curl -fsSL https://bun.sh/install | bash"
        exit 1
    fi

    if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
        print_error "Python is required. Install from https://python.org/"
        exit 1
    fi

    # Check if uv is installed
    if ! command -v uv &> /dev/null; then
        print_error "uv is not installed. Install from https://github.com/astral-sh/uv"
        print_error "Quick install: curl -LsSf https://astral.sh/uv/install.sh | sh"
        exit 1
    fi

    # Quick dependency check - install if missing
    if [ ! -d "frontend/node_modules" ]; then
        print_status "Installing frontend dependencies with Bun..."
        cd frontend && bun install && cd ..
    fi

    print_success "Prerequisites ready"
}

# Function to run smart cleanup before development
smart_cleanup() {
    print_status "Running smart cleanup..."

    # Clean Python cache
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "*.pyc" -delete 2>/dev/null || true

    # Clean Bun cache (but preserve node_modules)
    rm -rf frontend/.vite 2>/dev/null || true
    rm -rf frontend/coverage 2>/dev/null || true

    # Clean build artifacts
    rm -rf frontend/dist 2>/dev/null || true

    # Clean logs
    find . -name "*.log" -delete 2>/dev/null || true

    # Clean test results
    rm -rf test-results playwright-report 2>/dev/null || true

    print_success "Smart cleanup completed"
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

# Main execution
main() {
    print_header

    # Set up cleanup trap
    trap cleanup EXIT INT TERM

    # Run checks
    check_directory
    ensure_bun_in_path
    check_prerequisites
    run_health_checks

    # Smart cleanup before starting development
    smart_cleanup

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
