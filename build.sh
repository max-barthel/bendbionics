#!/bin/bash

# Soft Robot App - Enhanced Build Script
# This script provides a robust build process with error handling and validation

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
    echo -e "${PURPLE}🏗️  Soft Robot App Build${NC}"
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
    print_status "Checking build prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi

    # Check Rust (for Tauri)
    if ! command -v cargo &> /dev/null; then
        print_error "Rust/Cargo is required for Tauri builds. Install from https://rustup.rs/"
        exit 1
    fi

    # Check if dependencies are installed
    if [ ! -d "frontend/node_modules" ]; then
        print_warning "Frontend dependencies not found. Installing..."
        cd frontend && npm install && cd ..
    fi

    print_success "Prerequisites check completed"
}

# Function to run pre-build checks
pre_build_checks() {
    print_status "Running pre-build checks..."

    # Run linting
    print_status "Running linting checks..."
    ./toolkit.sh all quick
    if [ $? -ne 0 ]; then
        print_error "Linting checks failed. Please fix issues before building."
        exit 1
    fi

    # Run tests
    print_status "Running test suite..."
    ./toolkit.sh all test
    if [ $? -ne 0 ]; then
        print_error "Tests failed. Please fix failing tests before building."
        exit 1
    fi

    # Check bundle size
    print_status "Checking bundle size..."
    ./toolkit.sh frontend size-check
    if [ $? -ne 0 ]; then
        print_warning "Bundle size check failed, but continuing with build..."
    fi

    print_success "Pre-build checks completed"
}

# Function to build frontend
build_frontend() {
    print_status "Building frontend..."

    cd frontend

    # Clean previous build
    if [ -d "dist" ]; then
        print_status "Cleaning previous build..."
        rm -rf dist
    fi

    # Build with TypeScript check
    print_status "Running TypeScript compilation..."
    npm run build
    if [ $? -ne 0 ]; then
        print_error "Frontend build failed"
        exit 1
    fi

    # Verify build output
    if [ ! -d "dist" ]; then
        print_error "Build output directory not found"
        exit 1
    fi

    print_success "Frontend build completed"
    cd ..
}

# Function to build Tauri app
build_tauri() {
    print_status "Building Tauri desktop app..."

    cd frontend

    # Source Rust environment
    if [ -f "$HOME/.cargo/env" ]; then
        source "$HOME/.cargo/env"
    fi

    # Build Tauri app
    print_status "Compiling Tauri application..."
    npm run tauri build
    if [ $? -ne 0 ]; then
        print_error "Tauri build failed"
        exit 1
    fi

    print_success "Tauri build completed"
    cd ..
}

# Function to show build results
show_build_results() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}📦 Build Results${NC}"
    echo -e "${CYAN}================================${NC}"

    # Check for built files
    if [ -d "frontend/src-tauri/target/release" ]; then
        echo -e "Desktop App: ${GREEN}frontend/src-tauri/target/release/${NC}"

        # List executables
        if ls frontend/src-tauri/target/release/*.exe 2>/dev/null; then
            echo -e "Windows Executable: ${GREEN}Found${NC}"
        fi
        if ls frontend/src-tauri/target/release/*.app 2>/dev/null; then
            echo -e "macOS App: ${GREEN}Found${NC}"
        fi
        if ls frontend/src-tauri/target/release/* 2>/dev/null | grep -v "\.exe$" | grep -v "\.app$" | grep -v "\.dmg$" | grep -v "\.deb$" | grep -v "\.rpm$"; then
            echo -e "Linux Executable: ${GREEN}Found${NC}"
        fi
    fi

    if [ -d "frontend/dist" ]; then
        echo -e "Web Build: ${GREEN}frontend/dist/${NC}"
    fi

    echo -e "${CYAN}================================${NC}"
    print_success "Build completed successfully!"
}

# Function to cleanup on error
cleanup_on_error() {
    print_error "Build failed. Cleaning up..."
    # Add any cleanup logic here if needed
}

# Main execution
main() {
    print_header

    # Set up error cleanup
    trap cleanup_on_error ERR

    # Run build process
    check_directory
    check_prerequisites
    pre_build_checks
    build_frontend
    build_tauri
    show_build_results
}

# Run main function
main
