#!/bin/bash

# Test Runner Script for Soft Robot App
# Usage: ./scripts/test-runner.sh [option]

set -e

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

# Function to run tests with different configurations
run_tests() {
    local test_type=$1
    local start_time=$(date +%s)

    print_status "Starting $test_type tests..."

    case $test_type in
        "quick")
            npm run test:run
            ;;
        "coverage")
            npm run test:coverage
            ;;
        "watch")
            npm run test:watch
            ;;
        "pre-commit")
            npm run test:pre-commit
            ;;
        "ci")
            npm run test:ci
            ;;
        *)
            print_error "Unknown test type: $test_type"
            print_status "Available options: quick, coverage, watch, pre-commit, ci"
            exit 1
            ;;
    esac

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    if [ $? -eq 0 ]; then
        print_success "$test_type tests completed successfully in ${duration}s"
    else
        print_error "$test_type tests failed after ${duration}s"
        exit 1
    fi
}

# Function to run linting
run_lint() {
    print_status "Running ESLint..."
    if npm run lint; then
        print_success "Linting passed"
    else
        print_error "Linting failed"
        exit 1
    fi
}

# Function to run full pre-commit checks
run_pre_commit() {
    print_status "Running full pre-commit checks..."

    # Run linting
    run_lint

    # Run tests with coverage
    run_tests "pre-commit"

    print_success "All pre-commit checks passed!"
}

# Function to show help
show_help() {
    echo "Test Runner Script for Soft Robot App"
    echo ""
    echo "Usage: $0 [option]"
    echo ""
    echo "Options:"
    echo "  quick        Run tests quickly without coverage"
    echo "  coverage     Run tests with coverage report"
    echo "  watch        Run tests in watch mode"
    echo "  pre-commit   Run full pre-commit checks (lint + tests)"
    echo "  ci           Run tests for CI environment"
    echo "  lint         Run only linting"
    echo "  help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 quick        # Quick test run"
    echo "  $0 pre-commit   # Full pre-commit checks"
    echo "  $0 coverage     # Tests with coverage"
}

# Main script logic
case "${1:-help}" in
    "quick")
        run_tests "quick"
        ;;
    "coverage")
        run_tests "coverage"
        ;;
    "watch")
        run_tests "watch"
        ;;
    "pre-commit")
        run_pre_commit
        ;;
    "ci")
        run_tests "ci"
        ;;
    "lint")
        run_lint
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
