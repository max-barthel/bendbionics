#!/bin/bash

# BendBionics - Simple Cleanup Script
# Removes build artifacts and temporary files

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${1}${2}${NC}"
}

# Check if we're in the right directory
if [[ ! -f "package.json" || ! -d "frontend" || ! -d "backend" ]]; then
    print_status $RED "❌ Error: Run this script from the project root directory"
    exit 1
fi

print_status $YELLOW "🧹 Cleaning up BendBionics project..."

# Clean Python
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true
print_status $GREEN "✓ Cleaned Python cache"

# Clean Bun dependencies (node_modules directory)
rm -rf node_modules frontend/node_modules 2>/dev/null || true
print_status $GREEN "✓ Cleaned node_modules"

# Clean build artifacts
rm -rf frontend/dist frontend/coverage backend/htmlcov 2>/dev/null || true
print_status $GREEN "✓ Cleaned build artifacts"

# Clean logs
find . -name "*.log" -delete 2>/dev/null || true
print_status $GREEN "✓ Cleaned log files"

# Clean test results
rm -rf test-results playwright-report 2>/dev/null || true
print_status $GREEN "✓ Cleaned test results"

print_status $GREEN "✅ Cleanup complete!"
