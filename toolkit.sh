#!/bin/bash

# Soft Robot App - Comprehensive Linting and Testing Script
# This script provides various options for checking code quality across the entire codebase
#
# Line Length Standard: 88 characters (modern industry standard)
# - Python: Black formatter and Ruff linter configured for 88 chars
# - TypeScript/JavaScript: ESLint and Prettier configured for 88 chars

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

# Function to check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
}

# Frontend linting functions
frontend_lint() {
    print_status "Running frontend linting..."
    cd frontend
    npm run lint
    cd ..
    print_success "Frontend linting completed"
}

frontend_lint_fix() {
    print_status "Auto-fixing frontend issues..."
    cd frontend
    npm run lint:fix
    cd ..
    print_success "Frontend auto-fix completed"
}

frontend_format() {
    print_status "Running Prettier formatting check..."
    cd frontend
    npm run format:check
    cd ..
    print_success "Prettier formatting check completed"
}

frontend_format_fix() {
    print_status "Auto-fixing frontend formatting with Prettier..."
    cd frontend
    npm run format
    cd ..
    print_success "Prettier formatting completed"
}

frontend_lint_check() {
    print_status "Running frontend quick check (errors only)..."
    cd frontend
    npm run lint:check
    cd ..
    print_success "Frontend quick check completed"
}

frontend_test() {
    print_status "Running frontend tests..."
    cd frontend
    npm run test:run
    cd ..
    print_success "Frontend tests completed"
}

frontend_test_coverage() {
    print_status "Running frontend tests with coverage..."
    cd frontend
    npm run test:coverage
    cd ..
    print_success "Frontend test coverage completed"
}

frontend_test_integration() {
    print_status "Running frontend integration tests..."
    cd frontend
    npm run test:integration
    cd ..
    print_success "Frontend integration tests completed"
}

frontend_test_visual() {
    print_status "Running frontend visual regression tests..."
    cd frontend
    npm run test:visual
    cd ..
    print_success "Frontend visual regression tests completed"
}

frontend_test_all() {
    print_status "Running all frontend tests (unit + integration)..."
    cd frontend
    npm run test:all
    cd ..
    print_success "All frontend tests completed"
}

frontend_build_analyze() {
    print_status "Building frontend with bundle analysis..."
    cd frontend
    npm run build:analyze
    cd ..
    print_success "Frontend build with analysis completed"
}

frontend_build_size_check() {
    print_status "Building frontend and checking bundle sizes..."
    cd frontend
    npm run build:size-check
    cd ..
    print_success "Frontend build size check completed"
}

frontend_lighthouse() {
    print_status "Running Lighthouse performance audit..."
    cd frontend
    npm run lighthouse
    cd ..
    print_success "Lighthouse audit completed"
}

frontend_performance() {
    print_status "Running complete performance check..."
    cd frontend
    npm run performance
    cd ..
    print_success "Performance check completed"
}

# Git workflow functions
git_commit_check() {
    print_status "Checking commit message format..."
    if [ -n "$1" ]; then
        echo "$1" | npx --no -- commitlint
        if [ $? -ne 0 ]; then
            print_error "Commit message validation failed"
            print_warning "Use 'npm run commit' for guided commit creation"
            exit 1
        fi
        print_success "Commit message validation passed"
    else
        print_error "No commit message provided"
        exit 1
    fi
}

git_changelog() {
    print_status "Generating changelog..."
    npm run changelog
    print_success "Changelog generated"
}

git_pre_commit() {
    print_status "Running pre-commit checks..."
    ./.husky/pre-commit
    print_success "Pre-commit checks completed"
}

git_pre_push() {
    print_status "Running pre-push checks..."
    ./.husky/pre-push
    print_success "Pre-push checks completed"
}

# Code quality functions
code_quality_report() {
    print_status "Generating code quality report..."
    node scripts/code-quality-report.js
    print_success "Code quality report completed"
}

code_quality_frontend() {
    print_status "Running frontend code quality checks..."
    cd frontend
    npm run lint
    npx tsc --noEmit
    cd ..
    print_success "Frontend code quality checks completed"
}

code_quality_backend() {
    print_status "Running backend code quality checks..."
    cd backend
    ruff check app/
    python -m mypy app/
    cd ..
    print_success "Backend code quality checks completed"
}


# Documentation functions
docs_storybook() {
    print_status "Starting Storybook documentation..."
    cd frontend
    npm run storybook
    cd ..
    print_success "Storybook documentation started"
}

docs_storybook_build() {
    print_status "Building Storybook documentation..."
    cd frontend
    npm run storybook:build
    cd ..
    print_success "Storybook documentation built"
}


# CI/CD functions
ci_test() {
    print_status "Running CI test suite..."
    npm run test
    cd backend
    python -m pytest tests/ -v
    cd ..
    print_success "CI tests completed"
}

ci_lint() {
    print_status "Running CI linting checks..."
    npm run lint
    cd backend
    ruff check app/
    python -m black --check app/
    cd ..
    print_success "CI linting completed"
}

ci_build() {
    print_status "Running CI build checks..."
    cd frontend
    npm run build
    cd ../backend
    python -c "import app.main"
    cd ..
    print_success "CI build checks completed"
}


ci_all() {
    print_status "Running full CI pipeline..."
    ci_lint
    ci_test
    ci_build
    print_success "Full CI pipeline completed"
}

# Backend linting functions
backend_format() {
    print_status "Running Black code formatting..."
    cd backend
    python -m black . --check
    cd ..
    print_success "Black formatting check completed"
}

backend_format_fix() {
    print_status "Auto-fixing backend formatting with Black..."
    cd backend
    python -m black .
    cd ..
    print_success "Black formatting completed"
}

backend_lint() {
    print_status "Running Ruff linting..."
    cd backend
    ruff check .
    cd ..
    print_success "Ruff linting completed"
}

backend_pylint() {
    print_status "Running Pylint analysis..."
    cd backend
    python -m pylint app/ --disable=C0114,C0115,C0116
    cd ..
    print_success "Pylint analysis completed"
}

backend_type_check() {
    print_status "Running MyPy type checking..."
    cd backend
    python -m mypy app/
    cd ..
    print_success "MyPy type checking completed"
}

backend_test() {
    print_status "Running backend tests..."
    cd backend
    python -m pytest
    cd ..
    print_success "Backend tests completed"
}

backend_test_coverage() {
    print_status "Running backend tests with coverage..."
    cd backend
    python -m pytest --cov=app --cov-report=term-missing --cov-report=html:htmlcov
    cd ..
    print_success "Backend test coverage completed"
}

# Combined functions
all_lint() {
    print_status "Running all linting checks..."
    frontend_format
    frontend_lint
    backend_format
    backend_lint
    backend_pylint
    backend_type_check
    print_success "All linting checks completed"
}

all_test() {
    print_status "Running all tests..."
    frontend_test
    backend_test
    print_success "All tests completed"
}

all_test_coverage() {
    print_status "Running all tests with coverage..."
    frontend_test_coverage
    backend_test_coverage
    print_success "All test coverage completed"
}

all_fix() {
    print_status "Auto-fixing all fixable issues..."

    # Frontend fixes (continue even if one fails)
    print_status "=== FRONTEND FIXES ==="
    frontend_format_fix || print_warning "Frontend formatting had issues"
    frontend_lint_fix || print_warning "Frontend linting had issues"

    # Backend fixes (continue even if one fails)
    print_status "=== BACKEND FIXES ==="
    backend_format_fix || print_warning "Backend formatting had issues"

    # Additional backend auto-fixes
    print_status "Auto-fixing backend imports with ruff..."
    cd backend
    ruff check --fix . || print_warning "ruff auto-fix had issues"
    cd ..

    print_success "All auto-fixes completed (some may have had issues)"
}

quick_check() {
    print_status "Running quick checks (errors only)..."
    frontend_format
    frontend_lint_check
    backend_format
    backend_lint
    print_success "Quick checks completed"
}

# Main script logic
check_directory

case "${1:-help}" in
    "frontend")
        case "${2:-lint}" in
            "lint") frontend_lint ;;
            "fix") frontend_lint_fix ;;
            "check") frontend_lint_check ;;
            "format") frontend_format ;;
            "format-fix") frontend_format_fix ;;
            "test") frontend_test ;;
            "coverage") frontend_test_coverage ;;
            "integration") frontend_test_integration ;;
            "visual") frontend_test_visual ;;
            "all-tests") frontend_test_all ;;
            "build-analyze") frontend_build_analyze ;;
            "size-check") frontend_build_size_check ;;
            "lighthouse") frontend_lighthouse ;;
            "performance") frontend_performance ;;
            *) print_error "Unknown frontend command: $2" ;;
        esac
        ;;
    "git")
        case "${2:-help}" in
            "commit-check") git_commit_check "$3" ;;
            "changelog") git_changelog ;;
            "pre-commit") git_pre_commit ;;
            "pre-push") git_pre_push ;;
            *) print_error "Unknown git command: $2" ;;
        esac
        ;;
    "quality")
        case "${2:-report}" in
            "report") code_quality_report ;;
            "frontend") code_quality_frontend ;;
            "backend") code_quality_backend ;;
            *) print_error "Unknown quality command: $2" ;;
        esac
        ;;
    "docs")
        case "${2:-storybook}" in
            "storybook") docs_storybook ;;
            "build") docs_storybook_build ;;
            *) print_error "Unknown docs command: $2" ;;
        esac
        ;;
    "ci")
        case "${2:-all}" in
            "test") ci_test ;;
            "lint") ci_lint ;;
            "build") ci_build ;;
            "all") ci_all ;;
            *) print_error "Unknown ci command: $2" ;;
        esac
        ;;
    "backend")
        case "${2:-lint}" in
            "format") backend_format ;;
            "format-fix") backend_format_fix ;;
            "lint") backend_lint ;;
            "pylint") backend_pylint ;;
            "type") backend_type_check ;;
            "test") backend_test ;;
            "coverage") backend_test_coverage ;;
            *) print_error "Unknown backend command: $2" ;;
        esac
        ;;
    "all")
        case "${2:-lint}" in
            "lint") all_lint ;;
            "test") all_test ;;
            "coverage") all_test_coverage ;;
            "fix") all_fix ;;
            "quick") quick_check ;;
            *) print_error "Unknown all command: $2" ;;
        esac
        ;;
    "help"|*)
        echo "Soft Robot App - Linting and Testing Script"
        echo ""
        echo "Usage: $0 [category] [command]"
        echo ""
        echo "Categories:"
        echo "  frontend  - Frontend (React/TypeScript) operations"
        echo "  backend   - Backend (Python) operations"
        echo "  git       - Git workflow operations"
        echo "  quality   - Code quality analysis and reporting"
        echo "  docs      - Documentation generation and management"
        echo "  ci        - CI/CD pipeline operations"
        echo "  all       - Operations across entire codebase"
        echo ""
        echo "Frontend commands:"
        echo "  lint      - Run ESLint (default)"
        echo "  fix       - Auto-fix ESLint issues"
        echo "  check     - Quick check (errors only)"
        echo "  format    - Check Prettier formatting"
        echo "  format-fix - Auto-fix Prettier formatting"
        echo "  test      - Run unit tests"
        echo "  coverage  - Run tests with coverage"
        echo "  integration - Run integration tests (Playwright)"
        echo "  visual    - Run visual regression tests"
        echo "  all-tests - Run all tests (unit + integration)"
        echo "  build-analyze - Build with bundle analysis"
        echo "  size-check - Build and check bundle sizes"
        echo "  lighthouse - Run Lighthouse performance audit"
        echo "  performance - Run complete performance check"
        echo ""
        echo "Backend commands:"
        echo "  format    - Check Black formatting (default)"
        echo "  format-fix - Auto-fix Black formatting"
        echo "  lint      - Run Flake8 linting"
        echo "  pylint    - Run Pylint analysis"
        echo "  type      - Run MyPy type checking"
        echo "  test      - Run tests"
        echo "  coverage  - Run tests with coverage"
        echo ""
        echo "Git commands:"
        echo "  commit-check - Validate commit message format"
        echo "  changelog    - Generate changelog from commits"
        echo "  pre-commit   - Run pre-commit checks"
        echo "  pre-push     - Run pre-push checks"
        echo ""
        echo "Quality commands:"
        echo "  report    - Generate comprehensive code quality report"
        echo "  frontend  - Run frontend code quality checks"
        echo "  backend   - Run backend code quality checks"
        echo ""
        echo "Documentation commands:"
        echo "  storybook - Start Storybook development server"
        echo "  build     - Build Storybook documentation"
        echo ""
        echo "CI/CD commands:"
        echo "  test      - Run CI test suite"
        echo "  lint      - Run CI linting checks"
        echo "  build     - Run CI build checks"
        echo "  all       - Run full CI pipeline"
        echo ""
        echo "All commands:"
        echo "  lint      - Run all linting checks (default)"
        echo "  test      - Run all tests"
        echo "  coverage  - Run all tests with coverage"
        echo "  fix       - Auto-fix all fixable issues"
        echo "  quick     - Quick checks (errors only)"
        echo ""
        echo "Examples:"
        echo "  $0                    # Show this help"
        echo "  $0 frontend lint      # Frontend linting"
        echo "  $0 backend test       # Backend tests"
        echo "  $0 all coverage       # All tests with coverage"
        echo "  $0 all fix            # Auto-fix all issues"
        echo "  $0 all quick          # Quick error checks"
        echo ""
        echo "=== COPY-PASTE COMMAND REFERENCE ==="
        echo ""
        echo "# Format all code to 88-character standard:"
        echo "./toolkit.sh all fix"
        echo ""
        echo "# Quick daily checks:"
        echo "./toolkit.sh all quick"
        echo ""
        echo "# Full quality check:"
        echo "./toolkit.sh all lint"
        echo ""
        echo "# Frontend only:"
        echo "./toolkit.sh frontend format-fix  # Fix formatting"
        echo "./toolkit.sh frontend lint         # Check code quality"
        echo "./toolkit.sh frontend fix          # Auto-fix issues"
        echo ""
        echo "# Backend only:"
        echo "./toolkit.sh backend format-fix   # Fix Python formatting"
        echo "./toolkit.sh backend lint          # Check Python code with Ruff"
        echo "./toolkit.sh backend test          # Run Python tests"
        echo ""
        echo "# Testing:"
        echo "./toolkit.sh all test             # Run all tests"
        echo "./toolkit.sh all coverage         # Run tests with coverage"
        echo ""
        echo "# Individual tools:"
        echo "./toolkit.sh frontend format      # Check Prettier formatting"
        echo "./toolkit.sh frontend lint        # Check ESLint issues"
        echo "./toolkit.sh backend format       # Check Black formatting"
        echo "./toolkit.sh backend pylint       # Run Pylint analysis"
        echo "./toolkit.sh backend type         # Run MyPy type checking"
        ;;
esac
