#!/bin/bash

# BendBionics - Shared Script Library
# Common functions used across all scripts
# Source this file in scripts: source "$(dirname "$0")/lib.sh" or source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

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
    local title="${1:-BendBionics}"
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}${title}${NC}"
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

# Function to get bun path (useful for scripts that need the full path)
get_bun_path() {
    if ensure_bun_in_path; then
        command -v bun
    else
        if [ -f "$HOME/.bun/bin/bun" ]; then
            echo "$HOME/.bun/bin/bun"
        else
            return 1
        fi
    fi
}

# Function to check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
}

# Function to check prerequisites (basic checks)
check_prerequisites() {
    local check_bun="${1:-true}"
    local check_python="${2:-false}"
    local check_uv="${3:-false}"
    local install_deps="${4:-false}"

    if [ "$check_bun" = "true" ]; then
        if ! command -v bun &> /dev/null; then
            print_error "Bun is not installed. Install from https://bun.sh"
            print_error "Quick install: curl -fsSL https://bun.sh/install | bash"
            exit 1
        fi
    fi

    if [ "$check_python" = "true" ]; then
        if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
            print_error "Python is required. Install from https://python.org/"
            exit 1
        fi
    fi

    if [ "$check_uv" = "true" ]; then
        if ! command -v uv &> /dev/null; then
            print_error "uv is not installed. Install from https://github.com/astral-sh/uv"
            print_error "Quick install: curl -LsSf https://astral.sh/uv/install.sh | sh"
            exit 1
        fi
    fi

    if [ "$install_deps" = "true" ]; then
        if [ ! -d "frontend/node_modules" ]; then
            print_status "Installing frontend dependencies with Bun..."
            cd frontend && bun install && cd ..
        fi
    fi
}

