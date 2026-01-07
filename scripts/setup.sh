#!/bin/bash

# BendBionics - First-Time Setup Script
# Installs dependencies and configures the development environment

set -e

# Source shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

print_header "🔧 BendBionics Setup"

check_directory

# Check prerequisites
print_status "Checking prerequisites..."
check_prerequisites true true true false

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    bun install
    print_success "Frontend dependencies installed"
else
    print_status "Frontend dependencies already installed"
fi
cd ..

# Setup backend environment
print_status "Setting up backend environment..."
cd backend
if ! command -v uv &> /dev/null; then
    print_error "uv is not installed. Install from https://github.com/astral-sh/uv"
    exit 1
fi

if [ ! -d ".venv" ]; then
    print_status "Creating Python virtual environment..."
    uv venv
fi

print_status "Installing backend dependencies..."
uv sync

print_status "Initializing database..."
uv run python setup_dev.py || print_warning "Database initialization had issues (continuing anyway)"

cd ..

print_success "Setup completed!"
print_status "Run './dev.sh' to start the development environment"

