#!/bin/bash

# BendBionics - Development Toolkit

set -e

# Source shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/scripts/lib.sh"

# Core functions - leveraging existing Bun scripts
run_frontend() {
    local cmd="$1"
    print_status "Running frontend: $cmd"
    cd frontend
    bun run "$cmd"
    cd ..
    print_success "Frontend $cmd completed"
}

run_backend() {
    local cmd="$1"
    print_status "Running backend: $cmd"
    cd backend
    export PYTHONPATH="${PWD}:${PYTHONPATH}"
    eval "$cmd"
    cd ..
    print_success "Backend $cmd completed"
}

# Essential operations
lint_all() {
    print_status "Running all linting checks..."
    bun run lint
    cd backend && ruff check app/ && cd ..
    print_success "All linting completed"
}

test_all() {
    print_status "Running all tests..."
    bun run test
    cd backend && uv run pytest && cd ..
    print_success "All tests completed"
}

fix_all() {
    print_status "Auto-fixing all issues..."
    bun run lint:fix
    cd frontend && bun run format && cd ..
    cd backend && ruff check --fix . && cd ..
    print_success "All fixes completed"
}

quick_check() {
    print_status "Running quick checks..."
    bun run lint
    cd backend && ruff check app/ && cd ..
    print_success "Quick checks completed"
}

# Quality and CI operations (removed - scripts don't exist in package.json)
# These functions were removed as they referenced non-existent scripts
# Use individual commands instead: lint, test, build

# Documentation
docs_storybook() {
    print_status "Starting Storybook..."
    cd frontend && bun run storybook
}

# Git operations
git_commit_check() {
    if [ -n "$1" ]; then
        echo "$1" | bunx --bun commitlint
        print_success "Commit message validation passed"
    else
        print_error "No commit message provided"
        exit 1
    fi
}

# Cleanup operations
cleanup_all() {
    print_status "Running comprehensive cleanup..."
    ./scripts/cleanup.sh
}

# Productivity operations
productivity_stats() {
    print_status "Generating productivity statistics..."

    echo "📱 Frontend:"
    echo "  Files: $(find frontend/src -name "*.ts" -o -name "*.tsx" | wc -l)"
    echo "  Lines: $(find frontend/src -name "*.ts" -o -name "*.tsx" -exec wc -l {} + | tail -1 | awk '{print $1}')"

    echo ""
    echo "🐍 Backend:"
    echo "  Files: $(find backend/app -name "*.py" | wc -l)"
    echo "  Lines: $(find backend/app -name "*.py" -exec wc -l {} + | tail -1 | awk '{print $1}')"

    print_success "Statistics complete"
}

productivity_todos() {
    print_status "Finding TODO comments..."

    echo "📝 TODO comments found:"
    grep -r "TODO" --include="*.ts" --include="*.tsx" --include="*.py" . | head -10

    print_success "TODO search complete"
}

# Health check operations
health_check_system() {
    print_status "Checking system health..."

    # Check Bun (required)
    if command -v bun &> /dev/null; then
        BUN_VERSION=$(bun --version)
        print_success "Bun: $BUN_VERSION"
    else
        print_error "Bun not found (required)"
        return 1
    fi

    # Check Node.js (optional, informational only - Bun includes Node.js compatibility)
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js: $NODE_VERSION (optional, for compatibility)"
    fi

    # Check Python
    if command -v python &> /dev/null; then
        PYTHON_VERSION=$(python --version)
        print_success "Python: $PYTHON_VERSION"
    elif command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        print_success "Python: $PYTHON_VERSION"
    else
        print_error "Python not found"
        return 1
    fi

    return 0
}

health_check_dependencies() {
    print_status "Checking dependencies..."

    # Check frontend dependencies
    if [ -d "frontend/node_modules" ]; then
        print_success "Frontend dependencies: Installed"
    else
        print_error "Frontend dependencies: Missing"
        return 1
    fi

    # Check backend dependencies
    if [ -d "backend/.venv" ]; then
        print_success "Backend virtual environment: Found (.venv)"
    else
        print_warning "Backend virtual environment: Not found (will be created on first run)"
    fi

    # Check if pyproject.toml exists
    if [ -f "backend/pyproject.toml" ]; then
        print_success "Backend dependencies: Found (pyproject.toml)"
    else
        print_error "Backend dependencies: Missing (pyproject.toml)"
        return 1
    fi

    return 0
}

health_check_services() {
    print_status "Checking services..."

    # Check backend API
    if curl -s -f "http://localhost:8000/health" > /dev/null 2>&1; then
        print_success "Backend API: Running"
    else
        print_warning "Backend API: Not running"
    fi

    # Check frontend dev server
    if curl -s -f "http://localhost:3000" > /dev/null 2>&1; then
        print_success "Frontend Dev Server: Running"
    else
        print_warning "Frontend Dev Server: Not running"
    fi

    # Check if ports are in use
    if lsof -i:8000 > /dev/null 2>&1; then
        print_success "Port 8000: In use"
    else
        print_warning "Port 8000: Available"
    fi

    if lsof -i:3000 > /dev/null 2>&1; then
        print_success "Port 3000: In use"
    else
        print_warning "Port 3000: Available"
    fi
}

health_check_code_quality() {
    print_status "Checking code quality..."

    cd frontend && bun run lint > /dev/null 2>&1 && cd ../backend && ruff check app/ --quiet > /dev/null 2>&1 && cd .. && {
        print_success "Code Quality: Passing"
    } || {
        print_warning "Code Quality: Issues found"
    }
}

health_check_build_status() {
    print_status "Checking build status..."

    if [ -d "frontend/dist" ] && [ -f "frontend/dist/index.html" ]; then
        print_success "Build Output: Available"
    else
        print_warning "Build Output: Not found (run './build.sh' to build)"
    fi
}

health_check_test_status() {
    print_status "Checking test status..."

    if [ -d "frontend/coverage" ] || [ -d "backend/htmlcov" ]; then
        print_success "Test Coverage: Available (run tests to update)"
    else
        print_warning "Test Coverage: Not found (run './toolkit.sh test all' to generate)"
    fi
}

health_check_all() {
    print_header "🏥 BendBionics Health Check"

    check_directory
    ensure_bun_in_path
    health_check_system
    health_check_dependencies
    health_check_services
    health_check_code_quality
    health_check_build_status
    health_check_test_status

    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}📊 Health Check Summary${NC}"
    echo -e "${CYAN}================================${NC}"
    echo -e "Run './dev.sh' to start development environment"
    echo -e "Run './toolkit.sh test all' to run all tests"
    echo -e "${CYAN}================================${NC}"
}

# Main script logic
check_directory
ensure_bun_in_path

# Normalize legacy arg order (e.g., "./toolkit.sh all test")
if [ "${1:-}" = "all" ] && [ -n "${2:-}" ]; then
    set -- "${2}" "${1}" "${3}" "${4}"
fi

case "${1:-help}" in
    "lint")
        case "${2:-all}" in
            "all") lint_all ;;
            "frontend") run_frontend "lint" ;;
            "backend") run_backend "ruff check app/" ;;
            *) print_error "Unknown lint command: $2" ;;
        esac
        ;;
    "test")
        case "${2:-all}" in
            "all") test_all ;;
            "frontend") run_frontend "test:run" ;;
            "backend") run_backend "pytest" ;;
            "coverage") run_frontend "test:coverage" ;;
            *) print_error "Unknown test command: $2" ;;
        esac
        ;;
    "fix")
        case "${2:-all}" in
            "all") fix_all ;;
            "frontend") run_frontend "lint:fix" ;;
            "backend") cd backend && ruff check --fix . && cd .. ;;
            *) print_error "Unknown fix command: $2" ;;
        esac
        ;;
    "format")
        case "${2:-all}" in
            "all") run_frontend "format" ;;
            "frontend") run_frontend "format" ;;
            "backend") print_warning "Backend uses ruff for formatting" ;;
            *) print_error "Unknown format command: $2" ;;
        esac
        ;;
    "quality")
        print_warning "Quality command removed - use 'lint', 'test', or 'build' instead"
        print_status "Available alternatives:"
        echo "  ./toolkit.sh lint all     - Run linting checks"
        echo "  ./toolkit.sh test all     - Run all tests"
        echo "  ./toolkit.sh fix all      - Auto-fix issues"
        ;;
    "ci")
        print_warning "CI command removed - use individual commands instead"
        print_status "Available alternatives:"
        echo "  ./toolkit.sh lint all     - Run linting"
        echo "  ./toolkit.sh test all     - Run tests"
        echo "  ./build.sh                - Build for production"
        ;;
    "docs")
        case "${2:-storybook}" in
            "storybook") docs_storybook ;;
            "build") run_frontend "storybook:build" ;;
            *) print_error "Unknown docs command: $2" ;;
        esac
        ;;
    "git")
        case "${2:-help}" in
            "commit-check") git_commit_check "$3" ;;
            "changelog") print_warning "Changelog command not available" ;;
            *) print_error "Unknown git command: $2" ;;
        esac
        ;;
    "cleanup")
        case "${2:-all}" in
            "all") cleanup_all ;;
            *) print_error "Unknown cleanup command: $2" ;;
        esac
        ;;
    "productivity")
        case "${2:-help}" in
            "stats") productivity_stats ;;
            "todos") productivity_todos ;;
            *) print_error "Unknown productivity command: $2" ;;
        esac
        ;;
    "quick")
        quick_check
        ;;
    "health")
        health_check_all
        ;;
    "help"|*)
        echo "BendBionics - Development Toolkit"
        echo ""
        echo "Usage: $0 [command] [subcommand]"
        echo ""
        echo "Commands:"
        echo "  lint [all|frontend|backend]  - Run linting checks"
        echo "  test [all|frontend|backend|coverage] - Run tests"
        echo "  fix [all|frontend|backend]   - Auto-fix issues"
        echo "  format [all|frontend]        - Format code"
        echo "  docs [storybook|build]       - Documentation"
        echo "  git [commit-check]           - Git operations"
        echo "  cleanup [all]                - Clean temporary files"
        echo "  productivity [stats|todos]   - Productivity tools"
        echo "  quick                        - Quick error checks"
        echo "  health                       - Check system health"
        echo ""
        echo "Examples:"
        echo "  $0 lint all                 # Run all linting"
        echo "  $0 test coverage            # Run tests with coverage"
        echo "  $0 fix all                  # Auto-fix all issues"
        echo "  $0 quick                    # Quick error checks"
        echo "  $0 ci all                   # Full CI pipeline"
        echo ""
        echo "=== COPY-PASTE COMMAND REFERENCE ==="
        echo ""
        echo "# Daily workflow:"
        echo "./toolkit.sh quick            # Quick checks"
        echo "./toolkit.sh lint all         # Full linting"
        echo "./toolkit.sh test all         # Run all tests"
        echo "./toolkit.sh fix all          # Auto-fix issues"
        echo ""
        echo "# Testing and quality:"
        echo "./toolkit.sh lint all         # Full linting"
        echo "./toolkit.sh test all         # Run all tests"
        echo ""
        echo "# Individual components:"
        echo "./toolkit.sh lint frontend    # Frontend only"
        echo "./toolkit.sh test backend     # Backend only"
        echo "./toolkit.sh docs storybook   # Start Storybook"
        echo "./toolkit.sh health            # Check system health"
        ;;
esac
