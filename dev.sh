#!/bin/bash

# Soft Robot App - Enhanced Development Script
# This script provides a robust development environment with health checks and error handling

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

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi

    # Check Python
    if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
        print_error "Python is not installed. Please install Python 3.8+ from https://python.org/"
        exit 1
    fi

    # Check Rust (for Tauri)
    if ! command -v cargo &> /dev/null; then
        print_warning "Rust/Cargo not found. Tauri development may not work properly."
        print_warning "Install Rust from https://rustup.rs/"
    fi

    # Check if dependencies are installed
    if [ ! -d "frontend/node_modules" ]; then
        print_warning "Frontend dependencies not found. Installing..."
        cd frontend && npm install && cd ..
    fi

    if [ ! -d "backend/.venv" ] && [ ! -f "backend/requirements.txt" ]; then
        print_warning "Backend virtual environment not found. Please set up Python environment."
    fi

    print_success "Prerequisites check completed"
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service_name to be ready..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi

        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done

    print_error "$service_name failed to start after $max_attempts seconds"
    return 1
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

# Function to start backend
start_backend() {
    print_status "Starting Python backend..."

    cd backend

    # Check if virtual environment exists
    if [ -d ".venv" ]; then
        print_status "Activating virtual environment..."
        source .venv/bin/activate
    elif [ -d "venv" ]; then
        print_status "Activating virtual environment..."
        source venv/bin/activate
    else
        print_warning "No virtual environment found. Using system Python."
    fi

    # Start backend with proper error handling
    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!

    cd ..

    # Wait for backend to be ready
    if wait_for_service "http://localhost:8000/health" "Backend API"; then
        print_success "Backend started successfully (PID: $BACKEND_PID)"
    else
        print_error "Failed to start backend"
        cleanup
        exit 1
    fi
}

# Function to start frontend
start_frontend() {
    print_status "Starting Tauri development..."

    cd frontend

    # Source Rust environment if available
    if [ -f "$HOME/.cargo/env" ]; then
        source "$HOME/.cargo/env"
    fi

    # Start Tauri development
    npx tauri dev &
    FRONTEND_PID=$!

    cd ..

    print_success "Frontend started successfully (PID: $FRONTEND_PID)"
}

# Function to show development info
show_dev_info() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}📊 Development Environment Info${NC}"
    echo -e "${CYAN}================================${NC}"
    echo -e "Backend API: ${GREEN}http://localhost:8000${NC}"
    echo -e "API Docs: ${GREEN}http://localhost:8000/docs${NC}"
    echo -e "Frontend: ${GREEN}http://localhost:3000${NC}"
    echo -e "Tauri Dev: ${GREEN}Running in desktop mode${NC}"
    echo -e "${CYAN}================================${NC}"
    echo -e "Press ${YELLOW}Ctrl+C${NC} to stop all services"
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
