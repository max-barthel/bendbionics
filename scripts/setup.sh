#!/bin/bash

# BendBionics - Development Environment Setup Script
# Consolidated setup with health checks and environment validation

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
    echo -e "${PURPLE}🛠️  BendBionics Environment Setup${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
}

# Function to check system requirements
check_system_requirements() {
    print_status "Checking system requirements..."

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
    print_success "Node.js: $(node --version)"

    # Check Python
    if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
        print_error "Python is not installed. Please install Python 3.11+ from https://python.org/"
        exit 1
    fi

    if command -v python3 &> /dev/null; then
        print_success "Python: $(python3 --version)"
    else
        print_success "Python: $(python --version)"
    fi

    # Check uv
    if ! command -v uv &> /dev/null; then
        print_error "uv is not installed. Install from https://github.com/astral-sh/uv"
        print_error "Quick install: curl -LsSf https://astral.sh/uv/install.sh | sh"
        exit 1
    fi
    print_success "uv: $(uv --version)"

    # Check Rust (optional but recommended)
    if ! command -v cargo &> /dev/null; then
        print_warning "Rust/Cargo not found. Desktop app development will not work."
        print_warning "Install Rust from https://rustup.rs/ for desktop app development."
    else
        print_success "Rust: $(cargo --version)"
    fi

    print_success "System requirements check completed"
}

# Function to setup frontend
setup_frontend() {
    print_status "Setting up frontend..."

    cd frontend

    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install

    # Install Playwright browsers
    print_status "Installing Playwright browsers..."
    npx playwright install

    # Setup git hooks
    print_status "Setting up git hooks..."
    npm run prepare

    cd ..

    print_success "Frontend setup completed"
}

# Function to setup backend
setup_backend() {
    print_status "Setting up backend..."

    cd backend

    # Create virtual environment with uv
    print_status "Creating Python virtual environment with uv..."
    uv venv

    # Sync dependencies (installs all dependencies from pyproject.toml)
    print_status "Installing backend dependencies with uv..."
    uv sync

    # Install development dependencies
    print_status "Installing development dependencies..."
    uv sync --extra dev

    cd ..

    print_success "Backend setup completed"
}

# Function to setup git hooks
setup_git_hooks() {
    print_status "Setting up git hooks..."

    # Install husky
    npm install

    # Setup husky
    npx husky install

    print_success "Git hooks setup completed"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."

    # Check frontend dependencies
    if [ -d "frontend/node_modules" ]; then
        print_success "Frontend dependencies: Installed"
    else
        print_error "Frontend dependencies: Missing"
        return 1
    fi

    # Check backend dependencies
    if [ -d "backend/.venv" ]; then
        print_success "Backend virtual environment: Found"
    else
        print_warning "Backend virtual environment: Not found"
    fi

    # Check if pyproject.toml exists
    if [ -f "pyproject.toml" ]; then
        print_success "Backend dependencies: Found (pyproject.toml)"
    else
        print_error "Backend dependencies: Missing (pyproject.toml)"
        return 1
    fi

    # Run quick linting check
    print_status "Running quick code quality check..."
    if ./toolkit.sh all quick > /dev/null 2>&1; then
        print_success "Code Quality: Passing"
    else
        print_warning "Code Quality: Issues found"
    fi

    print_success "Health checks completed"
}

# Function to run initial checks
run_initial_checks() {
    print_status "Running initial checks..."

    # Run linting
    print_status "Running linting checks..."
    ./toolkit.sh all quick

    # Run tests
    print_status "Running test suite..."
    ./toolkit.sh all test

    print_success "Initial checks completed"
}

# Function to show setup summary
show_setup_summary() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}📋 Setup Summary${NC}"
    echo -e "${CYAN}================================${NC}"
    echo -e "✅ System requirements verified"
    echo -e "✅ Frontend dependencies installed"
    echo -e "✅ Backend dependencies installed"
    echo -e "✅ Git hooks configured"
    echo -e "✅ Health checks passed"
    echo -e "✅ Initial checks passed"
    echo -e "${CYAN}================================${NC}"
    echo -e "🚀 Ready to start development!"
    echo -e "Run ${GREEN}./dev.sh${NC} to start the development server"
    echo -e "Run ${GREEN}./build.sh${NC} to build the application"
    echo -e "Run ${GREEN}./toolkit.sh${NC} for development tools"
    echo -e "${CYAN}================================${NC}"
}

# Main execution
main() {
    print_header

    check_directory
    check_system_requirements
    setup_frontend
    setup_backend
    setup_git_hooks
    run_health_checks
    run_initial_checks
    show_setup_summary
}

# Run main function
main
