#!/bin/bash

# BendBionics - Cleanup Script
# Removes build artifacts and temporary files

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

FORCE=false
LIGHT=false

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE=true
            shift
            ;;
        --light)
            LIGHT=true
            shift
            ;;
        --help|-h)
            echo "BendBionics Cleanup Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --force      Skip confirmations"
            echo "  --light      Light cleanup (preserves node_modules, only cleans caches and artifacts)"
            echo "  --help       Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if we're in the right directory
if [[ ! -f "package.json" || ! -d "frontend" || ! -d "backend" ]]; then
    echo "Error: Run this script from the project root directory"
    exit 1
fi

print_status "Cleaning up BendBionics project..."

# Clean Python cache
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true
print_success "Cleaned Python cache"

# Clean node_modules (skip in light mode)
if [ "$LIGHT" != "true" ]; then
    rm -rf node_modules frontend/node_modules 2>/dev/null || true
    print_success "Cleaned node_modules"
fi

# Clean Vite cache (light mode only, preserves node_modules)
if [ "$LIGHT" = "true" ]; then
    rm -rf frontend/.vite 2>/dev/null || true
    print_success "Cleaned Vite cache"
fi

# Clean build artifacts
rm -rf frontend/dist frontend/coverage backend/htmlcov 2>/dev/null || true
print_success "Cleaned build artifacts"

# Clean logs
find . -name "*.log" -delete 2>/dev/null || true
print_success "Cleaned log files"

# Clean test results
rm -rf test-results playwright-report 2>/dev/null || true
print_success "Cleaned test results"

# Clean lighthouse reports (keep only last 3 runs)
if [ -d "frontend/lighthouse-reports" ]; then
    REPORT_COUNT=$(find frontend/lighthouse-reports -maxdepth 1 -name "*.report.*" -type f 2>/dev/null | wc -l | tr -d ' ')
    if [ "$REPORT_COUNT" -gt 9 ]; then
        cd frontend/lighthouse-reports
        if ls *.report.* 1>/dev/null 2>&1; then
            ls -t *.report.* | tail -n +10 | xargs rm -f 2>/dev/null || true
            print_success "Cleaned old lighthouse reports (kept last 3 runs)"
        fi
        cd ../..
    fi
fi

# Clean .lighthouseci directory
rm -rf frontend/.lighthouseci 2>/dev/null || true

# Clean .DS_Store files (OS X)
find . -name ".DS_Store" -type f -delete 2>/dev/null || true

print_success "Cleanup complete!"
