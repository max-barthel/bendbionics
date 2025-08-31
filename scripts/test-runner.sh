#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status messages
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

# Function to run frontend tests
run_frontend_tests() {
    local test_type=$1
    cd frontend

    case $test_type in
        "quick")
            print_status "Running frontend quick tests..."
            npm run test:run
            ;;
        "coverage")
            print_status "Running frontend tests with coverage..."
            npm run test:coverage
            ;;
        "watch")
            print_status "Starting frontend tests in watch mode..."
            npm run test:watch
            ;;
        "pre-commit")
            print_status "Running frontend pre-commit tests..."
            npm run test:pre-commit
            ;;
        "ci")
            print_status "Running frontend CI tests..."
            npm run test:ci
            ;;
        *)
            print_error "Unknown frontend test type: $test_type"
            return 1
            ;;
    esac

    cd ..
}

# Function to run backend tests
run_backend_tests() {
    local test_type=$1
    cd backend

    case $test_type in
        "quick")
            print_status "Running backend quick tests..."
            python -m pytest -v
            ;;
        "coverage")
            print_status "Running backend tests with coverage..."
            python -m pytest --cov=app --cov-report=term-missing --cov-report=html
            ;;
        "watch")
            print_status "Starting backend tests in watch mode..."
            python -m pytest --watch
            ;;
        "pre-commit")
            print_status "Running backend pre-commit tests..."
            python -m pytest -v --tb=short
            ;;
        "ci")
            print_status "Running backend CI tests..."
            python -m pytest --cov=app --cov-report=xml
            ;;
        *)
            print_error "Unknown backend test type: $test_type"
            return 1
            ;;
    esac

    cd ..
}

# Function to run linting
run_lint() {
    print_status "Running linting..."

    # Frontend linting
    cd frontend
    print_status "Linting frontend..."
    npm run lint
    cd ..

    # Backend linting (if available)
    if command -v flake8 &> /dev/null; then
        cd backend
        print_status "Linting backend..."
        flake8 app/ tests/ --max-line-length=79 --ignore=E501,W503
        cd ..
    else
        print_warning "flake8 not found, skipping backend linting"
    fi
}

# Function to run pre-commit checks
run_pre_commit() {
    print_status "Running pre-commit checks..."

    # Run linting
    run_lint

    # Run tests
    run_frontend_tests "pre-commit"
    run_backend_tests "pre-commit"

    print_success "Pre-commit checks completed!"
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND] [TEST_TYPE]"
    echo ""
    echo "Commands:"
    echo "  frontend [TYPE]  Run frontend tests"
    echo "  backend [TYPE]   Run backend tests"
    echo "  all [TYPE]       Run both frontend and backend tests"
    echo "  lint             Run linting for both frontend and backend"
    echo "  pre-commit       Run full pre-commit checks"
    echo "  help             Show this help message"
    echo ""
    echo "Test Types:"
    echo "  quick            Quick test run (default)"
    echo "  coverage         Run tests with coverage report"
    echo "  watch            Run tests in watch mode"
    echo "  pre-commit       Run tests suitable for pre-commit"
    echo "  ci               Run tests suitable for CI/CD"
    echo ""
    echo "Examples:"
    echo "  $0 frontend quick"
    echo "  $0 backend coverage"
    echo "  $0 all pre-commit"
    echo "  $0 lint"
    echo "  $0 pre-commit"
}

# Main script logic
case $1 in
    "frontend")
        run_frontend_tests ${2:-quick}
        ;;
    "backend")
        run_backend_tests ${2:-quick}
        ;;
    "all")
        print_status "Running all tests..."
        run_frontend_tests ${2:-quick}
        run_backend_tests ${2:-quick}
        ;;
    "lint")
        run_lint
        ;;
    "pre-commit")
        run_pre_commit
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
