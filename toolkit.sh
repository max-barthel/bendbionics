#!/bin/bash

# BendBionics - Development Toolkit

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
}

# Core functions - leveraging existing npm scripts
run_frontend() {
    local cmd="$1"
    print_status "Running frontend: $cmd"
    cd frontend
    npm run "$cmd"
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
    npm run lint
    cd backend && ruff check app/ && cd ..
    print_success "All linting completed"
}

test_all() {
    print_status "Running all tests..."
    npm run test
    cd backend && uv run pytest && cd ..
    print_success "All tests completed"
}

fix_all() {
    print_status "Auto-fixing all issues..."
    npm run lint:fix
    cd frontend && npm run format && cd ..
    cd backend && ruff check --fix . && cd ..
    print_success "All fixes completed"
}

quick_check() {
    print_status "Running quick checks..."
    npm run lint:check
    cd backend && ruff check app/ && cd ..
    print_success "Quick checks completed"
}

# Quality and CI operations
quality_report() {
    print_status "Generating quality report..."
    npm run quality
    print_success "Quality report completed"
}

ci_pipeline() {
    print_status "Running CI pipeline..."
    npm run ci:all
    print_success "CI pipeline completed"
}

# Documentation
docs_storybook() {
    print_status "Starting Storybook..."
    cd frontend && npm run storybook
}

# Git operations
git_commit_check() {
    if [ -n "$1" ]; then
        echo "$1" | npx --no -- commitlint
        print_success "Commit message validation passed"
    else
        print_error "No commit message provided"
        exit 1
    fi
}

# Cleanup operations
cleanup_all() {
    print_status "Running comprehensive cleanup..."

    # Clean Python cache
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "*.pyc" -delete 2>/dev/null || true
    print_success "Cleaned Python cache"

    # Clean Node.js cache (but preserve node_modules)
    rm -rf frontend/.vite 2>/dev/null || true
    rm -rf frontend/coverage 2>/dev/null || true
    print_success "Cleaned Node.js cache"

    # Clean build artifacts
    rm -rf frontend/dist 2>/dev/null || true
    rm -rf backend/htmlcov 2>/dev/null || true
    print_success "Cleaned build artifacts"

    # Clean logs
    find . -name "*.log" -delete 2>/dev/null || true
    print_success "Cleaned log files"

    # Clean test results
    rm -rf test-results playwright-report 2>/dev/null || true
    print_success "Cleaned test results"

    print_success "Cleanup completed"
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

# Main script logic
check_directory

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
        case "${2:-report}" in
            "report") quality_report ;;
            "frontend") npm run quality:frontend ;;
            "backend") npm run quality:backend ;;
            *) print_error "Unknown quality command: $2" ;;
        esac
        ;;
    "ci")
        case "${2:-all}" in
            "all") ci_pipeline ;;
            "test") npm run ci:test ;;
            "lint") npm run ci:lint ;;
            "build") npm run ci:build ;;
            *) print_error "Unknown ci command: $2" ;;
        esac
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
            "changelog") npm run changelog ;;
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
        echo "  quality [report|frontend|backend] - Code quality analysis"
        echo "  ci [all|test|lint|build]     - CI/CD operations"
        echo "  docs [storybook|build]       - Documentation"
        echo "  git [commit-check|changelog] - Git operations"
        echo "  cleanup [all]                - Clean temporary files"
        echo "  productivity [stats|todos]   - Productivity tools"
        echo "  quick                        - Quick error checks"
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
        echo "# CI/CD:"
        echo "./toolkit.sh ci all           # Full CI pipeline"
        echo "./toolkit.sh quality report   # Quality analysis"
        echo ""
        echo "# Individual components:"
        echo "./toolkit.sh lint frontend    # Frontend only"
        echo "./toolkit.sh test backend     # Backend only"
        echo "./toolkit.sh docs storybook   # Start Storybook"
        ;;
esac
