#!/bin/bash

# Soft Robot App - Complete Deployment Workflow
# Handles build, upload, deploy, and cleanup in one script

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SERVER_USER="serveruser"
SERVER_HOST="bendbionics"
SERVER_PATH="/tmp"

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
    echo -e "${PURPLE}🚀 Complete Deployment Workflow${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --skip-build     Skip the build step (use existing build)"
    echo "  --skip-upload    Skip the upload step (use existing package on server)"
    echo "  --skip-deploy     Skip the deploy step (just cleanup)"
    echo "  --cleanup-only    Only cleanup old deployment packages"
    echo "  --help            Show this help message"
    echo ""
    echo "Authentication:"
    echo "  This script uses SSH key authentication."
    echo "  Make sure you have SSH keys set up:"
    echo "    ssh-copy-id $SERVER_USER@$SERVER_HOST"
    echo ""
    echo "Sudo Configuration:"
    echo "  The deployment script requires sudo privileges on the server."
    echo "  Set up passwordless sudo for deployment:"
    echo "    ./setup-sudo.sh"
    echo ""
    echo "This script handles the complete deployment workflow:"
    echo "1. Build the application"
    echo "2. Upload to server"
    echo "3. Deploy on server"
    echo "4. Cleanup local deployment package"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi

    # Check required commands
    local required_commands=("scp" "ssh")
    local missing_commands=()

    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_commands+=("$cmd")
        fi
    done

    if [ ${#missing_commands[@]} -ne 0 ]; then
        print_error "Missing required commands: ${missing_commands[*]}"
        exit 1
    fi

    # Test SSH connection
    print_status "Testing SSH connection..."
    if ssh -o ConnectTimeout=5 -o BatchMode=yes "$SERVER_USER@$SERVER_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
        print_success "SSH connection working"
    else
        print_warning "SSH connection test failed, but continuing..."
        print_status "If deployment fails, make sure SSH keys are set up:"
        print_status "Run: ssh-copy-id $SERVER_USER@$SERVER_HOST"
    fi

    # Test sudo configuration
    print_status "Testing sudo configuration..."
    if ssh -o ConnectTimeout=5 -o BatchMode=yes "$SERVER_USER@$SERVER_HOST" "sudo -n echo 'Sudo access working'" >/dev/null 2>&1; then
        print_success "Sudo configuration working"
    else
        print_warning "Sudo configuration test failed"
        print_status "If deployment fails, set up sudo configuration:"
        print_status "Run: ./setup-sudo.sh"
        print_status "This will configure passwordless sudo for deployment"
    fi

    print_success "Prerequisites check completed"
}

# Function to build the application
build_application() {
    print_status "Building application..."

    if [ -f "./build.sh" ]; then
        ./build.sh
        print_success "Build completed"
    else
        print_error "build.sh not found"
        exit 1
    fi
}

# Function to upload to server
upload_to_server() {
    print_status "Uploading to server..."

    # Find the latest deployment package
    local latest_package=$(ls -td builds/web-build-* 2>/dev/null | head -1)

    if [ -z "$latest_package" ]; then
        print_error "No deployment package found. Run build first."
        exit 1
    fi

    print_status "Uploading package: $latest_package"
    scp -r "$latest_package" "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"

    if [ $? -eq 0 ]; then
        print_success "Upload completed"
        echo "$latest_package" > .last_deployment_package
    else
        print_error "Upload failed"
        exit 1
    fi
}

# Function to deploy on server
deploy_on_server() {
    print_status "Deploying on server..."

    # Get the package name from the last deployment
    if [ -f ".last_deployment_package" ]; then
        local package_name=$(basename "$(cat .last_deployment_package)")
        print_status "Deploying package: $package_name"
        ssh -tt "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH/$package_name && sudo ./deploy.sh"

        if [ $? -eq 0 ]; then
            print_success "Deployment completed successfully"
        else
            print_error "Deployment failed"
            exit 1
        fi
    else
        print_error "No deployment package information found"
        exit 1
    fi
}

# Function to cleanup local deployment package
cleanup_local_package() {
    print_status "Cleaning up local deployment package..."

    if [ -f ".last_deployment_package" ]; then
        local package_path=$(cat .last_deployment_package)

        if [ -d "$package_path" ]; then
            print_status "Removing: $package_path"
            rm -rf "$package_path"
            rm -f ".last_deployment_package"
            print_success "Local package cleaned up"
        else
            print_warning "Package already removed: $package_path"
            rm -f ".last_deployment_package"
        fi
    else
        print_warning "No deployment package to cleanup"
    fi
}

# Function to cleanup old packages
cleanup_old_packages() {
    print_status "Cleaning up old deployment packages..."

    # Clean up old deployment packages in builds directory
    if [ -d "builds" ]; then
        local old_packages=$(find builds -name "web-build-*" -type d 2>/dev/null | wc -l)
        if [ "$old_packages" -gt 0 ]; then
            print_status "Found $old_packages old deployment packages"
            rm -rf builds/web-build-*
            print_success "Old packages cleaned up"
        else
            print_status "No old packages found"
        fi
    fi
}

# Function to show deployment results
show_results() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}🎉 Deployment Workflow Complete${NC}"
    echo -e "${CYAN}================================${NC}"

    echo -e "Server: ${GREEN}$SERVER_USER@$SERVER_HOST${NC}"
    echo -e "Application: ${GREEN}https://bendbionics.com${NC}"
    echo -e "API Documentation: ${GREEN}https://bendbionics.com/docs${NC}"
    echo -e "Health Check: ${GREEN}https://bendbionics.com/health${NC}"

    echo -e "\n${BLUE}Useful Commands:${NC}"
    echo -e "View logs: ${CYAN}ssh $SERVER_USER@$SERVER_HOST 'sudo journalctl -u bendbionics-api -f'${NC}"
    echo -e "Restart backend: ${CYAN}ssh $SERVER_USER@$SERVER_HOST 'sudo systemctl restart bendbionics-api'${NC}"

    echo -e "${CYAN}================================${NC}"
}

# Main execution
main() {
    local skip_build=false
    local skip_upload=false
    local skip_deploy=false
    local cleanup_only=false

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                skip_build=true
                shift
                ;;
            --skip-upload)
                skip_upload=true
                shift
                ;;
            --skip-deploy)
                skip_deploy=true
                shift
                ;;
            --cleanup-only)
                cleanup_only=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    print_header

    # Check prerequisites
    check_prerequisites

    if [ "$cleanup_only" = true ]; then
        cleanup_old_packages
        cleanup_local_package
        print_success "Cleanup completed"
        exit 0
    fi

    # Build application
    if [ "$skip_build" = false ]; then
        build_application
    else
        print_status "Skipping build step"
    fi

    # Upload to server
    if [ "$skip_upload" = false ]; then
        upload_to_server
    else
        print_status "Skipping upload step"
    fi

    # Deploy on server
    if [ "$skip_deploy" = false ]; then
        deploy_on_server
    else
        print_status "Skipping deploy step"
    fi

    # Cleanup local package
    cleanup_local_package

    # Show results
    show_results
}

# Run main function
main "$@"
