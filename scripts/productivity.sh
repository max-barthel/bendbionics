#!/bin/bash

# BendBionics - Simple Productivity Script

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Show help
show_help() {
    echo "BendBionics Productivity Tools"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  stats    - Show code statistics"
    echo "  todos    - Find TODO comments"
    echo "  clean    - Clean temporary files"
    echo "  help     - Show this help"
}

# Show code statistics
show_stats() {
    print_header "Code Statistics"

    echo "📱 Frontend:"
    echo "  Files: $(find frontend/src -name "*.ts" -o -name "*.tsx" | wc -l)"
    echo "  Lines: $(find frontend/src -name "*.ts" -o -name "*.tsx" -exec wc -l {} + | tail -1 | awk '{print $1}')"

    echo ""
    echo "🐍 Backend:"
    echo "  Files: $(find backend/app -name "*.py" | wc -l)"
    echo "  Lines: $(find backend/app -name "*.py" -exec wc -l {} + | tail -1 | awk '{print $1}')"

    print_success "Statistics complete"
}

# Find TODO comments
find_todos() {
    print_header "TODO Comments"

    echo "📝 TODO comments found:"
    grep -r "TODO" --include="*.ts" --include="*.tsx" --include="*.py" . | head -10

    print_success "TODO search complete"
}

# Clean temporary files
clean_temp() {
    print_header "Cleaning Temporary Files"

    # Clean Python cache
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "*.pyc" -delete 2>/dev/null || true
    print_success "Cleaned Python cache"

    # Clean logs
    find . -name "*.log" -delete 2>/dev/null || true
    print_success "Cleaned log files"

    print_success "Cleanup complete"
}

# Main execution
case "${1:-help}" in
    "stats")
        show_stats
        ;;
    "todos")
        find_todos
        ;;
    "clean")
        clean_temp
        ;;
    "help"|*)
        show_help
        ;;
esac
