#!/bin/bash

# Soft Robot App - Development Environment Setup Script
# This script sets up the complete development environment

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
    echo -e "${PURPLE}🛠️  Soft Robot App Setup${NC}"
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

    # Check Python
    if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
        print_error "Python is not installed. Please install Python 3.8+ from https://python.org/"
        exit 1
    fi

    # Check Rust (optional but recommended)
    if ! command -v cargo &> /dev/null; then
        print_warning "Rust/Cargo not found. Tauri development will not work."
        print_warning "Install Rust from https://rustup.rs/ for desktop app development."
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

    # Check if virtual environment exists
    if [ ! -d ".venv" ] && [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python -m venv .venv
    fi

    # Activate virtual environment
    if [ -d ".venv" ]; then
        print_status "Activating virtual environment..."
        source .venv/bin/activate
    elif [ -d "venv" ]; then
        print_status "Activating virtual environment..."
        source venv/bin/activate
    fi

    # Install dependencies
    print_status "Installing backend dependencies..."
    pip install -r requirements.txt

    # Install development dependencies
    print_status "Installing development dependencies..."
    pip install black flake8 pylint mypy pytest pytest-cov isort

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
    echo -e "✅ Frontend dependencies installed"
    echo -e "✅ Backend dependencies installed"
    echo -e "✅ Git hooks configured"
    echo -e "✅ Playwright browsers installed"
    echo -e "✅ Initial checks passed"
    echo -e "${CYAN}================================${NC}"
    echo -e "🚀 Ready to start development!"
    echo -e "Run ${GREEN}./dev.sh${NC} to start the development server"
    echo -e "Run ${GREEN}./build.sh${NC} to build the application"
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
    run_initial_checks
    show_setup_summary
}

# Run main function
main
