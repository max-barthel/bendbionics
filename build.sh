#!/bin/bash

# Soft Robot App - Web Build Script
# Builds the frontend for web deployment (without Tauri)

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
    echo -e "${PURPLE}🌐 Soft Robot Web Build${NC}"
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

    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js 18+ required. Current: $(node --version)"
        exit 1
    fi
    print_status "Node.js version: $(node --version) ✓"

    # Check if frontend dependencies are installed
    if [ ! -d "frontend/node_modules" ]; then
        print_warning "Frontend dependencies not found. Installing..."
        cd frontend && npm install && cd ..
    fi

    print_success "Prerequisites check completed"
}

# Function to clean previous builds
clean_build() {
    print_status "Cleaning previous web builds..."

    # Clean frontend dist directory
    if [ -d "frontend/dist" ]; then
        rm -rf frontend/dist
        print_status "Removed previous frontend build"
    fi

    # Clean any Tauri build artifacts that might interfere
    if [ -d "frontend/src-tauri/target" ]; then
        print_warning "Tauri build artifacts found. These will be ignored for web build."
    fi

    # Note: Old deployment packages are now cleaned up after successful deployment
    # to avoid having obsolete build folders in the repo

    print_success "Clean completed"
}

# Function to build frontend for web
build_frontend_web() {
    print_status "Building frontend for web deployment..."

    cd frontend

    # Set production environment
    export NODE_ENV=production

    # Copy production environment file if it exists
    if [ -f ".env.production" ]; then
        print_status "Using production environment configuration"
        cp .env.production .env.local
    else
        print_warning "No .env.production found, using default settings"
    fi

    # Build with TypeScript check
    print_status "Running TypeScript compilation and web build..."
    npm run build

    if [ $? -ne 0 ]; then
        print_error "Frontend web build failed"
        exit 1
    fi

    # Verify build output
    if [ ! -d "dist" ]; then
        print_error "Build output directory not found"
        exit 1
    fi

    # Check for essential files
    if [ ! -f "dist/index.html" ]; then
        print_error "index.html not found in build output"
        exit 1
    fi

    print_success "Frontend web build completed"
    cd ..
}

# Function to validate build output
validate_build() {
    print_status "Validating web build output..."

    # Check for required files
    local required_files=("index.html" "css" "js")
    local missing_files=()

    for file in "${required_files[@]}"; do
        if [ ! -e "frontend/dist/$file" ]; then
            missing_files+=("$file")
        fi
    done

    if [ ${#missing_files[@]} -ne 0 ]; then
        print_error "Missing required build files: ${missing_files[*]}"
        exit 1
    fi

    # Check build size
    local build_size=$(du -sh frontend/dist | cut -f1)
    print_status "Build size: $build_size"

    # Check for Tauri-specific files that shouldn't be in web build
    if find frontend/dist -name "*tauri*" -o -name "*desktop*" | grep -q .; then
        print_warning "Found Tauri-specific files in web build. This is normal if they're just assets."
    fi

    print_success "Build validation completed"
}

# Function to create deployment package
create_deployment_package() {
    print_status "Creating deployment package..."

    # Create deployment directory
    local deploy_dir="deploy/web-build-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$deploy_dir"

    # Copy frontend build
    mkdir -p "$deploy_dir/frontend"
    cp -r frontend/dist/* "$deploy_dir/frontend/"

    # Create backend directory and copy only necessary files
    mkdir -p "$deploy_dir/backend"

    # Copy essential backend files only
    cp -r backend/app "$deploy_dir/backend/"
    cp backend/requirements.txt "$deploy_dir/backend/"

    # Clean up any __pycache__ directories that might have been copied
    find "$deploy_dir/backend" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$deploy_dir/backend" -name "*.pyc" -delete 2>/dev/null || true

    # Copy database if it exists
    if [ -f "backend/soft_robot.db" ]; then
        cp backend/soft_robot.db "$deploy_dir/backend/"
        print_status "Copied database file"
    fi

    # Copy deployment configurations
    cp -r deploy/nginx "$deploy_dir/"
    cp -r deploy/systemd "$deploy_dir/"

    # Copy deployment script
    cp deploy.sh "$deploy_dir/"
    chmod +x "$deploy_dir/deploy.sh"

    # Copy environment templates
    if [ -f "backend/.env.production.example" ]; then
        cp backend/.env.production.example "$deploy_dir/backend/.env.production.template"
    fi

    # Copy production environment file if it exists
    if [ -f "backend/.env.production" ]; then
        cp backend/.env.production "$deploy_dir/backend/.env.production"
        print_status "Copied production environment file"
    else
        print_warning "No .env.production found, using template"
    fi

    # Create deployment info file
    cat > "$deploy_dir/DEPLOYMENT_INFO.txt" << 'INFO_EOF'
Soft Robot App - Web Deployment Package
Generated: $(date)
Build Version: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

Contents:
- frontend/     : Built React application (optimized for production)
- backend/     : Python FastAPI backend (production files only)
  - app/       : Application source code
  - requirements.txt : Python dependencies
  - soft_robot.db : Database (if exists)
- nginx/       : Nginx configuration
- systemd/     : Systemd service configuration

Optimizations Applied:
- Excluded test files and development dependencies
- Removed __pycache__ directories and .pyc files
- Excluded virtual environment and development tools
- Only essential production files included

Next Steps:
1. Upload this package to your server
2. Run the deployment script
3. Configure environment variables
4. Setup SSL certificates
5. Start services

See README.md deployment section for detailed instructions.
INFO_EOF

    print_success "Deployment package created: $deploy_dir"
    print_status "Package size: $(du -sh "$deploy_dir" | cut -f1)"
}

# Function to show build results
show_build_results() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}🌐 Web Build Results${NC}"
    echo -e "${CYAN}================================${NC}"

    # Show build timestamp
    echo -e "Build Time: ${GREEN}$(date)${NC}"

    # Show build location
    if [ -d "frontend/dist" ]; then
        echo -e "Web Build: ${GREEN}frontend/dist/${NC}"
        echo -e "Build Size: ${GREEN}$(du -sh frontend/dist | cut -f1)${NC}"
    fi

    # Show deployment package
    local latest_package=$(ls -td deploy/web-build-* 2>/dev/null | head -1)
    if [ -n "$latest_package" ]; then
        echo -e "Deployment Package: ${GREEN}$latest_package${NC}"
    fi

    echo -e "${CYAN}================================${NC}"
    print_success "Web build completed successfully!"

    # Show deployment options
    if [ -n "$latest_package" ]; then
        PACKAGE_NAME=$(basename "$latest_package")
        echo -e "\n${YELLOW}🚀 Deployment Options:${NC}"
        echo -e "${CYAN}Option 1 - Complete Workflow (Recommended):${NC}"
        echo -e "${GREEN}./deploy-workflow.sh${NC}"
        echo -e "\n${CYAN}Option 2 - Manual Steps:${NC}"
        echo -e "${GREEN}scp -r $latest_package serveruser@217.236.9.232:/tmp/${NC}"
        echo -e "${GREEN}ssh serveruser@217.236.9.232${NC}"
        echo -e "${GREEN}cd /tmp/$PACKAGE_NAME${NC}"
        echo -e "${GREEN}sudo ./deploy.sh${NC}"
        echo -e "\n${CYAN}Option 3 - Cleanup Only:${NC}"
        echo -e "${GREEN}./deploy-workflow.sh --cleanup-only${NC}"
    fi
}

# Main execution
main() {
    print_header

    # Run build process
    check_directory
    check_prerequisites
    clean_build
    build_frontend_web
    validate_build
    create_deployment_package
    show_build_results
}

# Run main function
main
