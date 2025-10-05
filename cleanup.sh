#!/bin/bash

# Soft Robot App - Test Data Cleanup Script
# Removes obsolete test data, coverage reports, and build artifacts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
DRY_RUN=false
FORCE=false
VERBOSE=false
SMART_MODE=false
PRESERVE_RECENT=false
AUTO_MODE=false

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Clean up test data, coverage reports, and build artifacts from the Soft Robot App project."
    echo ""
    echo "OPTIONS:"
    echo "  -d, --dry-run     Show what would be deleted without actually deleting"
    echo "  -f, --force       Skip confirmation prompts"
    echo "  -v, --verbose     Show detailed output"
    echo "  -s, --smart       Smart mode - preserve recent test data"
    echo "  -p, --preserve     Preserve files modified in last 24 hours"
    echo "  -a, --auto        Auto mode - only clean if size threshold exceeded"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "EXAMPLES:"
    echo "  $0                # Interactive cleanup with confirmation"
    echo "  $0 --dry-run      # See what would be cleaned without deleting"
    echo "  $0 --force        # Clean everything without confirmation"
    echo "  $0 --smart        # Smart cleanup (preserve recent work)"
    echo "  $0 --auto         # Auto cleanup (only if size > 50MB)"
    echo "  $0 status         # Show detailed status"
    echo "  $0 check          # Check if cleanup needed and run if necessary"
    echo "  $0 schedule       # Schedule daily cleanup at 2 AM"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -s|--smart)
            SMART_MODE=true
            shift
            ;;
        -p|--preserve)
            PRESERVE_RECENT=true
            shift
            ;;
        -a|--auto)
            AUTO_MODE=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        status|check|schedule)
            # These are handled in main function
            break
            ;;
        *)
            # Check if it's a command (status, check, schedule) or unknown option
            if [[ "$1" == "status" || "$1" == "check" || "$1" == "schedule" ]]; then
                break
            else
                print_status $RED "Unknown option: $1"
                show_usage
                exit 1
            fi
            ;;
    esac
done

# Function to check if file should be preserved
should_preserve() {
    local path=$1

    # Always preserve if in preserve mode and file is recent
    if [[ "$PRESERVE_RECENT" == "true" ]]; then
        if [[ -e "$path" ]]; then
            # Check if file was modified in last 24 hours
            local file_age=$(find "$path" -maxdepth 0 -mtime -1 2>/dev/null | wc -l)
            if [[ $file_age -gt 0 ]]; then
                return 0  # Should preserve
            fi
        fi
    fi

    # Smart mode: preserve important test data
    if [[ "$SMART_MODE" == "true" ]]; then
        # Preserve recent coverage reports (less than 1 hour old)
        if [[ "$path" == *"coverage"* ]]; then
            local file_age=$(find "$path" -maxdepth 0 -mmin -60 2>/dev/null | wc -l)
            if [[ $file_age -gt 0 ]]; then
                return 0  # Should preserve
            fi
        fi

        # Preserve recent test results
        if [[ "$path" == *"test-results"* ]]; then
            local file_age=$(find "$path" -maxdepth 0 -mmin -30 2>/dev/null | wc -l)
            if [[ $file_age -gt 0 ]]; then
                return 0  # Should preserve
            fi
        fi
    fi

    return 1  # Should not preserve
}

# Function to safely remove files/directories
safe_remove() {
    local path=$1
    local description=$2

    if [[ ! -e "$path" ]]; then
        [[ "$VERBOSE" == "true" ]] && print_status $YELLOW "Skipping $description (not found): $path"
        return 0
    fi

    # Check if should preserve
    if should_preserve "$path"; then
        [[ "$VERBOSE" == "true" ]] && print_status $YELLOW "Preserving $description (recent/important): $path"
        return 0
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        print_status $BLUE "Would remove $description: $path"
        return 0
    fi

    if [[ "$VERBOSE" == "true" ]]; then
        print_status $YELLOW "Removing $description: $path"
    fi

    if [[ -d "$path" ]]; then
        rm -rf "$path"
    else
        rm -f "$path"
    fi

    print_status $GREEN "✓ Removed $description"
}

# Function to get directory size
get_size() {
    local path=$1
    if [[ -e "$path" ]]; then
        du -sh "$path" 2>/dev/null | cut -f1 || echo "0B"
    else
        echo "0B"
    fi
}

# Function to calculate total space to be freed
calculate_space() {
    local total_size=0
    local paths=("$@")

    for path in "${paths[@]}"; do
        if [[ -e "$path" ]]; then
            local size=$(du -s "$path" 2>/dev/null | cut -f1 || echo "0")
            total_size=$((total_size + size))
        fi
    done

    if [[ $total_size -gt 1048576 ]]; then
        echo "$((total_size / 1048576))MB"
    elif [[ $total_size -gt 1024 ]]; then
        echo "$((total_size / 1024))KB"
    else
        echo "${total_size}B"
    fi
}

# Function to check if cleanup is needed (auto mode)
needs_cleanup() {
    local test_data_size=$(du -s frontend/coverage backend/htmlcov frontend/test-results 2>/dev/null | awk '{sum+=$1} END {print sum+0}')
    local threshold=50000  # 50MB threshold

    if [[ $test_data_size -gt $threshold ]]; then
        return 0  # Needs cleanup
    fi

    return 1  # No cleanup needed
}

# Function to show detailed status
show_detailed_status() {
    print_status $YELLOW "📊 Test Data Status:"
    echo ""

    local backend_size=$(du -sh backend/htmlcov 2>/dev/null | cut -f1 || echo "0B")
    local frontend_coverage_size=$(du -sh frontend/coverage 2>/dev/null | cut -f1 || echo "0B")
    local test_results_size=$(du -sh frontend/test-results 2>/dev/null | cut -f1 || echo "0B")
    local playwright_size=$(du -sh frontend/playwright-report 2>/dev/null | cut -f1 || echo "0B")
    local storybook_size=$(du -sh frontend/storybook-static 2>/dev/null | cut -f1 || echo "0B")

    echo "Backend:"
    echo "  • HTML Coverage: $backend_size"
    echo "  • Coverage XML: $(du -sh backend/coverage.xml 2>/dev/null | cut -f1 || echo "0B")"
    echo "  • Python Cache: $(du -sh backend/__pycache__ 2>/dev/null | cut -f1 || echo "0B")"
    echo ""
    echo "Frontend:"
    echo "  • Coverage Reports: $frontend_coverage_size"
    echo "  • Test Results: $test_results_size"
    echo "  • Playwright Reports: $playwright_size"
    echo "  • Storybook Static: $storybook_size"
    echo "  • Build Dist: $(du -sh frontend/dist 2>/dev/null | cut -f1 || echo "0B")"
    echo ""
    echo "Root:"
    echo "  • Node Modules: $(du -sh node_modules 2>/dev/null | cut -f1 || echo "0B")"
    echo "  • Tauri Target: $(du -sh frontend/src-tauri/target 2>/dev/null | cut -f1 || echo "0B")"
    echo ""

    if needs_cleanup; then
        print_status $YELLOW "⚠️  Cleanup recommended (test data > 50MB)"
    else
        print_status $GREEN "✅ Workspace is clean"
    fi
}

# Main cleanup function
cleanup_test_data() {
    print_status $BLUE "🧹 Soft Robot App - Test Data Cleanup"
    echo ""

    # Define cleanup targets
    local backend_targets=(
        "backend/htmlcov"
        "backend/coverage.xml"
        "backend/.coverage"
        "backend/.pytest_cache"
        "backend/__pycache__"
        "backend/app/__pycache__"
        "backend/app/api/__pycache__"
        "backend/app/models/__pycache__"
        "backend/app/utils/__pycache__"
        "backend/app/middleware/__pycache__"
        "backend/tests/__pycache__"
    )

    local frontend_targets=(
        "frontend/coverage"
        "frontend/test-results"
        "frontend/playwright-report"
        "frontend/storybook-static"
        "frontend/dist"
        "frontend/.vite"
        "frontend/.vitest"
        "frontend/vitest.config.ts.timestamp-*"
        "frontend/vite.config.ts.timestamp-*"
        "frontend/test-results.xml"
        "frontend/coverage-final.json"
        "frontend/lcov.info"
    )

    local root_targets=(
        "node_modules"
        ".coverage"
        "coverage.xml"
        ".pytest_cache"
        "test-results"
        "coverage-reports"
        "*.tsbuildinfo"
        "tsconfig.*.tsbuildinfo"
    )

    local tauri_targets=(
        "frontend/src-tauri/target"
    )

    # Calculate total space to be freed
    local all_targets=("${backend_targets[@]}" "${frontend_targets[@]}" "${root_targets[@]}" "${tauri_targets[@]}")
    local total_space=$(calculate_space "${all_targets[@]}")

    print_status $YELLOW "📊 Cleanup Summary:"
    echo "  • Backend coverage & cache files"
    echo "  • Frontend test results & coverage"
    echo "  • Build artifacts & temporary files"
    echo "  • Node modules & Python cache"
    echo "  • Tauri build cache"
    echo ""
    print_status $YELLOW "💾 Estimated space to be freed: $total_space"
    echo ""

    # Show what will be cleaned
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status $BLUE "🔍 DRY RUN - No files will be deleted"
        echo ""
    fi

    # Confirmation prompt
    if [[ "$DRY_RUN" == "false" && "$FORCE" == "false" ]]; then
        print_status $YELLOW "⚠️  This will permanently delete test data and build artifacts."
        read -p "Continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status $RED "Cleanup cancelled."
            exit 0
        fi
    fi

    print_status $BLUE "🚀 Starting cleanup..."
    echo ""

    # Clean backend files
    print_status $YELLOW "Backend cleanup:"
    for target in "${backend_targets[@]}"; do
        safe_remove "$target" "backend file/directory"
    done

    # Clean frontend files
    print_status $YELLOW "Frontend cleanup:"
    for target in "${frontend_targets[@]}"; do
        safe_remove "$target" "frontend file/directory"
    done

    # Clean root files
    print_status $YELLOW "Root cleanup:"
    for target in "${root_targets[@]}"; do
        safe_remove "$target" "root file/directory"
    done

    # Clean Tauri files
    print_status $YELLOW "Tauri cleanup:"
    for target in "${tauri_targets[@]}"; do
        safe_remove "$target" "Tauri build cache"
    done

    # Clean up any remaining cache files
    print_status $YELLOW "Cache cleanup:"
    safe_remove ".eslintcache" "ESLint cache"
    safe_remove ".cache" "General cache"
    safe_remove ".parcel-cache" "Parcel cache"

    echo ""
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status $BLUE "✅ Dry run completed. No files were actually deleted."
        print_status $YELLOW "Run without --dry-run to perform actual cleanup."
    else
        print_status $GREEN "✅ Cleanup completed successfully!"
        print_status $YELLOW "💡 Tip: Run './cleanup.sh --dry-run' to see what would be cleaned next time."
    fi
}

# Function to show current status
show_status() {
    print_status $BLUE "📊 Current Test Data Status:"
    echo ""

    local backend_size=$(get_size "backend/htmlcov")
    local frontend_coverage_size=$(get_size "frontend/coverage")
    local frontend_dist_size=$(get_size "frontend/dist")
    local node_modules_size=$(get_size "node_modules")
    local tauri_target_size=$(get_size "frontend/src-tauri/target")

    echo "Backend:"
    echo "  • HTML Coverage: $backend_size"
    echo "  • Coverage XML: $(get_size "backend/coverage.xml")"
    echo "  • Python Cache: $(get_size "backend/__pycache__")"
    echo ""
    echo "Frontend:"
    echo "  • Coverage Reports: $frontend_coverage_size"
    echo "  • Test Results: $(get_size "frontend/test-results")"
    echo "  • Playwright Reports: $(get_size "frontend/playwright-report")"
    echo "  • Storybook Static: $(get_size "frontend/storybook-static")"
    echo "  • Build Dist: $frontend_dist_size"
    echo ""
    echo "Root:"
    echo "  • Node Modules: $node_modules_size"
    echo "  • Tauri Target: $tauri_target_size"
    echo ""
}

# Main execution
main() {
    # Check if we're in the right directory
    if [[ ! -f "package.json" || ! -d "frontend" || ! -d "backend" ]]; then
        print_status $RED "❌ Error: This script must be run from the project root directory."
        print_status $YELLOW "Make sure you're in the directory containing package.json, frontend/, and backend/ folders."
        exit 1
    fi

    # Handle special commands
    case "${1:-cleanup}" in
        "status")
            show_detailed_status
            exit 0
            ;;
        "check")
            if needs_cleanup; then
                print_status $YELLOW "🧹 Cleanup needed - running smart cleanup..."
                AUTO_MODE=true
                SMART_MODE=true
                FORCE=true
                cleanup_test_data
            else
                print_status $GREEN "✅ No cleanup needed"
            fi
            exit 0
            ;;
        "schedule")
            # Add to crontab for daily cleanup at 2 AM
            echo "0 2 * * * cd $(pwd) && ./cleanup.sh check" | crontab -
            print_status $GREEN "✅ Scheduled daily cleanup at 2 AM"
            exit 0
            ;;
        "cleanup"|*)
            # Auto mode check
            if [[ "$AUTO_MODE" == "true" ]]; then
                if needs_cleanup; then
                    print_status $YELLOW "🧹 Auto cleanup triggered (test data > 50MB)"
                    cleanup_test_data
                else
                    print_status $GREEN "✅ No cleanup needed (test data < 50MB)"
                    exit 0
                fi
            else
                # Regular cleanup
                cleanup_test_data
            fi
            ;;
    esac
}

# Run main function with all arguments
main "$@"
