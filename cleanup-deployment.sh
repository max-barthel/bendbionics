#!/bin/bash

# Soft Robot App - Local Deployment Cleanup Script
# Removes local deployment package after successful deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Function to show usage
show_usage() {
    echo "Usage: $0 <deployment-package-path>"
    echo ""
    echo "Examples:"
    echo "  $0 deploy/web-build-20241201-143022"
    echo "  $0 /path/to/web-build-20241201-143022"
    echo ""
    echo "This script removes the local deployment package after successful deployment."
}

# Function to cleanup deployment package
cleanup_deployment_package() {
    local package_path="$1"
    
    if [ -z "$package_path" ]; then
        print_error "No deployment package path provided"
        show_usage
        exit 1
    fi
    
    # Convert to absolute path if relative
    if [[ "$package_path" != /* ]]; then
        package_path="$(pwd)/$package_path"
    fi
    
    if [ ! -d "$package_path" ]; then
        print_error "Deployment package not found: $package_path"
        exit 1
    fi
    
    # Confirm deletion
    print_warning "This will permanently delete the deployment package: $package_path"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Removing deployment package: $package_path"
        rm -rf "$package_path"
        print_success "Deployment package removed successfully"
    else
        print_status "Cleanup cancelled"
        exit 0
    fi
}

# Main execution
main() {
    if [ $# -eq 0 ]; then
        print_error "No deployment package path provided"
        show_usage
        exit 1
    fi
    
    cleanup_deployment_package "$1"
}

# Run main function
main "$@"
