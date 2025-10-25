#!/bin/bash

# BendBionics - Web Build Script
# Builds the frontend for web deployment

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
    echo -e "${PURPLE}🌐 BendBionics Web Build${NC}"
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

    # Clean any old build artifacts
    if [ -d "frontend/src-tauri" ]; then
        print_warning "Legacy Tauri directory found. This is now a web-only application."
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

    # Copy production environment file
    if [ -f ".env.production" ]; then
        print_status "Using production environment configuration"
        cp .env.production .env.local
    else
        print_error ".env.production not found. Please create it from .env.production.example"
        exit 1
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

    # Check for any desktop-specific files that shouldn't be in web build
    if find frontend/dist -name "*desktop*" | grep -q .; then
        print_warning "Found desktop-specific files in web build. This may indicate build issues."
    fi

    print_success "Build validation completed"
}

# Function to create deployment package
create_deployment_package() {
    print_status "Creating deployment package..."

    # Create deployment directory
    local deploy_dir="builds/web-build-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$deploy_dir"

    # Copy frontend build
    mkdir -p "$deploy_dir/frontend"
    cp -r frontend/dist/* "$deploy_dir/frontend/"

    # Create backend directory and copy only necessary files
    mkdir -p "$deploy_dir/backend"

        # Copy essential backend files only
        cp -r backend/app "$deploy_dir/backend/"
        cp backend/requirements.txt "$deploy_dir/backend/"
        cp backend/init_database.py "$deploy_dir/backend/"
        cp backend/migrate.py "$deploy_dir/backend/"

    # Clean up any __pycache__ directories that might have been copied
    find "$deploy_dir/backend" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$deploy_dir/backend" -name "*.pyc" -delete 2>/dev/null || true

    # Note: Database is now PostgreSQL - no file to copy
    # Database will be initialized on the server using init_database.py

    # Copy deployment configurations
    cp -r config/nginx "$deploy_dir/"
    cp -r config/systemd "$deploy_dir/"

    # Copy deployment scripts
    cp scripts/deploy/server-deploy.sh "$deploy_dir/deploy.sh"
    chmod +x "$deploy_dir/deploy.sh"

    # Copy PostgreSQL setup script
    if [ -f "scripts/deploy/setup-postgres.sh" ]; then
        cp scripts/deploy/setup-postgres.sh "$deploy_dir/setup-postgres.sh"
        chmod +x "$deploy_dir/setup-postgres.sh"
        print_status "Included PostgreSQL setup script"
    fi

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
BendBionics - Web Deployment Package
Generated: $(date)
Build Version: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

Contents:
- frontend/          : Built React application (optimized for production)
- backend/           : Python FastAPI backend (production files only)
  - app/             : Application source code
  - requirements.txt : Python dependencies
  - init_database.py : Database initialization script
  - migrate.py       : Database migration script
- nginx/             : Nginx configuration
- systemd/           : Systemd service configuration
- deploy.sh          : Main deployment script
- setup-postgres.sh  : PostgreSQL setup script (first-time only)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIRST-TIME DEPLOYMENT INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If this is your first deployment, run these commands on your server:

1. Upload the package:
   scp -r web-build-YYYYMMDD-HHMMSS serveruser@your-server:/tmp/

2. SSH into your server:
   ssh serveruser@your-server

3. Set up PostgreSQL (FIRST-TIME ONLY):
   cd /tmp/web-build-YYYYMMDD-HHMMSS
   sudo bash setup-postgres.sh

   This will:
   • Install PostgreSQL
   • Create database and user with secure credentials
   • Generate .env.production file
   • Save credentials for reference

4. Deploy the application:
   sudo bash deploy.sh

   This will:
   • Install dependencies
   • Initialize database tables
   • Configure nginx and systemd
   • Start the application

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUBSEQUENT DEPLOYMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For updates after initial setup, just run:

1. Upload new package:
   scp -r web-build-YYYYMMDD-HHMMSS serveruser@your-server:/tmp/

2. Deploy:
   ssh serveruser@your-server
   cd /tmp/web-build-YYYYMMDD-HHMMSS
   sudo bash deploy.sh

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Database Configuration:
- PostgreSQL database: bendbionics
- User: bendbionics_user
- Credentials saved in /root/.bendbionics-db-credentials

Post-Deployment:
1. Update CORS_ORIGINS in .env.production with your domain(s)
2. Configure Mailgun credentials for email verification
3. Update FRONTEND_URL and BACKEND_URL with your actual URLs
4. Set up SSL certificates with certbot (optional)

Optimizations Applied:
- Excluded test files and development dependencies
- Removed __pycache__ directories and .pyc files
- Excluded virtual environment and development tools
- Only essential production files included

For detailed documentation, see README.md and DEVELOPMENT.md
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
    local latest_package=$(ls -td builds/web-build-* 2>/dev/null | head -1)
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

# Function to test build locally
test_build_locally() {
    print_status "Testing build locally..."

    # Clean test environment
    if [ -d "frontend/dist" ]; then
        rm -rf frontend/dist
        print_status "Removed previous frontend build"
    fi

    # Kill any existing processes on test ports
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true

    # Build frontend
    build_frontend_web

    # Start backend for testing
    print_status "Starting backend for testing..."
    cd backend
    if [ -d "venv" ]; then
        source venv/bin/activate
    elif [ -d ".venv" ]; then
        source .venv/bin/activate
    fi
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
    BACKEND_PID=$!
    cd ..

    # Wait for backend to start
    sleep 3

    # Test backend health
    if curl -s -f "http://127.0.0.1:8000/api/health" > /dev/null; then
        print_success "Backend is running and healthy"
    else
        print_error "Backend health check failed"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi

    # Start frontend preview server
    print_status "Starting frontend preview server..."
    cd frontend
    npm run preview &
    FRONTEND_PID=$!
    cd ..

    # Wait for frontend to start
    sleep 3

    # Test frontend
    if curl -s -f "http://127.0.0.1:4173" > /dev/null; then
        print_success "Frontend is running and accessible"
    else
        print_error "Frontend health check failed"
        kill $FRONTEND_PID 2>/dev/null || true
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi

    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}🧪 Local Build Test Results${NC}"
    echo -e "${CYAN}================================${NC}"
    echo -e "Frontend URL: ${GREEN}http://127.0.0.1:4173${NC}"
    echo -e "Backend URL: ${GREEN}http://127.0.0.1:8000${NC}"
    echo -e "API Docs: ${GREEN}http://127.0.0.1:8000/docs${NC}"
    echo -e "${CYAN}================================${NC}"
    echo -e "Test servers are running. Press Ctrl+C to stop."
    echo -e "${CYAN}================================${NC}"

    # Keep processes running for manual testing
    print_status "Test servers are running. Press Ctrl+C to stop."
    wait
}

# Function to run complete deployment workflow
run_deployment_workflow() {
    print_status "Running complete deployment workflow..."

    # Build the application
    build_frontend_web
    validate_build
    create_deployment_package

    # Find the latest deployment package
    local latest_package=$(ls -td builds/web-build-* 2>/dev/null | head -1)

    if [ -z "$latest_package" ]; then
        print_error "No deployment package found"
        exit 1
    fi

    print_status "Deployment package created: $latest_package"
    print_status "To deploy, run: ./deploy-workflow.sh"
}

# Main execution
main() {
    local test_mode=false
    local deploy_mode=false

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --test)
                test_mode=true
                shift
                ;;
            --deploy)
                deploy_mode=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --test           Test build locally before creating deployment package"
                echo "  --deploy         Complete deployment workflow (build + upload + deploy)"
                echo "  --help           Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0                # Build for production"
                echo "  $0 --test         # Test build locally"
                echo "  $0 --deploy       # Complete deployment"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    print_header

    if [ "$test_mode" = true ]; then
        test_build_locally
    elif [ "$deploy_mode" = true ]; then
        run_deployment_workflow
    else
        # Standard build process
        check_directory
        check_prerequisites
        clean_build
        build_frontend_web
        validate_build
        create_deployment_package
        show_build_results
    fi
}

# Run main function
main "$@"
