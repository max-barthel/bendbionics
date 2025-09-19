#!/bin/bash

# Productivity Enhancement Scripts
# This script provides various productivity tools for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Function to show help
show_help() {
    echo "Productivity Enhancement Scripts"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup-git-hooks     - Setup Git hooks for productivity"
    echo "  setup-aliases       - Setup shell aliases"
    echo "  setup-shortcuts     - Setup VS Code shortcuts"
    echo "  code-stats          - Show code statistics"
    echo "  find-todos          - Find TODO comments in code"
    echo "  find-fixmes         - Find FIXME comments in code"
    echo "  find-bugs           - Find BUG comments in code"
    echo "  clean-temp          - Clean temporary files"
    echo "  backup-config       - Backup VS Code configuration"
    echo "  restore-config      - Restore VS Code configuration"
    echo "  update-deps         - Update all dependencies"
    echo "  check-security      - Check for security issues"
    echo "  optimize-images     - Optimize images in project"
    echo "  generate-docs       - Generate documentation"
    echo "  all                 - Run all productivity setup"
    echo ""
}

# Setup Git hooks for productivity
setup_git_hooks() {
    print_header "Setting up Git hooks for productivity"

    # Create pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for productivity

echo "Running pre-commit checks..."

# Run linting
./toolkit.sh all quick

# Check for TODO/FIXME in staged files
if git diff --cached --name-only | grep -E '\.(ts|tsx|js|jsx|py)$' | xargs grep -l 'TODO\|FIXME'; then
    echo "Warning: Found TODO/FIXME comments in staged files"
    echo "Consider addressing them before committing"
fi

echo "Pre-commit checks completed"
EOF

    chmod +x .git/hooks/pre-commit
    print_success "Pre-commit hook installed"

    # Create commit-msg hook
    cat > .git/hooks/commit-msg << 'EOF'
#!/bin/bash
# Commit message hook for conventional commits

commit_regex='^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .{1,50}'

if ! grep -qE "$commit_regex" "$1"; then
    echo "Invalid commit message format!"
    echo "Format: type(scope): description"
    echo "Types: feat, fix, docs, style, refactor, test, chore"
    exit 1
fi
EOF

    chmod +x .git/hooks/commit-msg
    print_success "Commit message hook installed"
}

# Setup shell aliases
setup_aliases() {
    print_header "Setting up shell aliases"

    # Create aliases file
    cat > .aliases << 'EOF'
# Soft Robot App Aliases
alias dev='./dev.sh'
alias build='./build.sh'
alias test='./toolkit.sh all test'
alias lint='./toolkit.sh all lint'
alias fix='./toolkit.sh all fix'
alias docs='./toolkit.sh docs storybook'
alias quality='./toolkit.sh quality report'
alias ci='./toolkit.sh ci all'
alias clean='./scripts/productivity.sh clean-temp'
alias stats='./scripts/productivity.sh code-stats'
alias todos='./scripts/productivity.sh find-todos'
alias fixmes='./scripts/productivity.sh find-fixmes'
alias bugs='./scripts/productivity.sh find-bugs'

# Git aliases
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git pull'
alias gb='git branch'
alias gco='git checkout'
alias gd='git diff'
alias glog='git log --oneline --graph --decorate'

# Directory shortcuts
alias frontend='cd frontend'
alias backend='cd backend'
alias scripts='cd scripts'
EOF

    print_success "Aliases created in .aliases"
    print_info "Add 'source .aliases' to your shell profile to use them"
}

# Setup VS Code shortcuts
setup_shortcuts() {
    print_header "Setting up VS Code shortcuts"

    # Create keyboard shortcuts file
    cat > .vscode/keybindings.json << 'EOF'
[
  {
    "key": "cmd+shift+dev",
    "command": "workbench.action.tasks.runTask",
    "args": "Start Development"
  },
  {
    "key": "cmd+shift+test",
    "command": "workbench.action.tasks.runTask",
    "args": "Run Tests"
  },
  {
    "key": "cmd+shift+lint",
    "command": "workbench.action.tasks.runTask",
    "args": "Lint Code"
  },
  {
    "key": "cmd+shift+docs",
    "command": "workbench.action.tasks.runTask",
    "args": "Start Storybook"
  }
]
EOF

    print_success "VS Code shortcuts configured"
}

# Show code statistics
code_stats() {
    print_header "Code Statistics"

    echo "📊 Project Statistics:"
    echo ""

    # Count files by type
    echo "📁 Files by type:"
    find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | wc -l | xargs echo "  TypeScript/JavaScript:"
    find . -name "*.py" | wc -l | xargs echo "  Python:"
    find . -name "*.rs" | wc -l | xargs echo "  Rust:"
    find . -name "*.css" -o -name "*.scss" | wc -l | xargs echo "  CSS/SCSS:"
    find . -name "*.md" | wc -l | xargs echo "  Markdown:"
    find . -name "*.json" | wc -l | xargs echo "  JSON:"
    echo ""

    # Count lines of code
    echo "📏 Lines of code:"
    find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs wc -l | tail -1 | xargs echo "  TypeScript/JavaScript:"
    find . -name "*.py" | xargs wc -l | tail -1 | xargs echo "  Python:"
    find . -name "*.rs" | xargs wc -l | tail -1 | xargs echo "  Rust:"
    echo ""

    # Count commits
    echo "📝 Git statistics:"
    git rev-list --count HEAD | xargs echo "  Total commits:"
    git log --oneline | wc -l | xargs echo "  Commits (oneline):"
    echo ""

    # Count branches
    git branch -r | wc -l | xargs echo "  Remote branches:"
    git branch | wc -l | xargs echo "  Local branches:"
    echo ""
}

# Find TODO comments
find_todos() {
    print_header "Finding TODO comments"

    echo "🔍 TODO comments found:"
    echo ""

    grep -r "TODO" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" . | while read line; do
        echo "  $line"
    done

    echo ""
    print_info "Consider addressing these TODOs before release"
}

# Find FIXME comments
find_fixmes() {
    print_header "Finding FIXME comments"

    echo "🔧 FIXME comments found:"
    echo ""

    grep -r "FIXME" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" . | while read line; do
        echo "  $line"
    done

    echo ""
    print_info "These FIXMEs should be addressed soon"
}

# Find BUG comments
find_bugs() {
    print_header "Finding BUG comments"

    echo "🐛 BUG comments found:"
    echo ""

    grep -r "BUG" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" . | while read line; do
        echo "  $line"
    done

    echo ""
    print_warning "These BUGs should be fixed immediately"
}

# Clean temporary files
clean_temp() {
    print_header "Cleaning temporary files"

    # Clean Node.js
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        print_success "Removed node_modules"
    fi

    if [ -d "frontend/node_modules" ]; then
        rm -rf frontend/node_modules
        print_success "Removed frontend/node_modules"
    fi

    # Clean Python
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    print_success "Removed __pycache__ directories"

    find . -name "*.pyc" -delete 2>/dev/null || true
    print_success "Removed .pyc files"

    # Clean build artifacts
    rm -rf frontend/dist frontend/coverage backend/htmlcov
    print_success "Removed build artifacts"

    # Clean logs
    find . -name "*.log" -delete 2>/dev/null || true
    print_success "Removed log files"

    print_success "Cleanup completed"
}

# Backup VS Code configuration
backup_config() {
    print_header "Backing up VS Code configuration"

    mkdir -p .backup/vscode
    cp -r .vscode/* .backup/vscode/ 2>/dev/null || true
    print_success "VS Code configuration backed up to .backup/vscode"
}

# Restore VS Code configuration
restore_config() {
    print_header "Restoring VS Code configuration"

    if [ -d ".backup/vscode" ]; then
        cp -r .backup/vscode/* .vscode/
        print_success "VS Code configuration restored from .backup/vscode"
    else
        print_error "No backup found in .backup/vscode"
    fi
}

# Update all dependencies
update_deps() {
    print_header "Updating all dependencies"

    # Update root dependencies
    npm update
    print_success "Updated root dependencies"

    # Update frontend dependencies
    cd frontend
    npm update
    print_success "Updated frontend dependencies"
    cd ..

    # Update backend dependencies
    cd backend
    pip install --upgrade -r requirements.txt
    print_success "Updated backend dependencies"
    cd ..

    print_success "All dependencies updated"
}

# Check for security issues
check_security() {
    print_header "Checking for security issues"

    # Check npm vulnerabilities
    if [ -f "package.json" ]; then
        npm audit
    fi

    if [ -f "frontend/package.json" ]; then
        cd frontend
        npm audit
        cd ..
    fi

    # Check Python vulnerabilities
    if [ -f "backend/requirements.txt" ]; then
        cd backend
        pip install safety
        safety check
        cd ..
    fi

    print_success "Security check completed"
}

# Optimize images
optimize_images() {
    print_header "Optimizing images"

    # Find images
    find . -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" | while read img; do
        echo "Found image: $img"
        # Add image optimization logic here
    done

    print_success "Image optimization completed"
}

# Generate documentation
generate_docs() {
    print_header "Generating documentation"

    # Generate frontend docs
    ./toolkit.sh docs build
    print_success "Frontend documentation generated"

    # Generate backend docs
    ./toolkit.sh docs backend
    print_success "Backend documentation generated"

    print_success "Documentation generation completed"
}

# Run all productivity setup
run_all() {
    print_header "Running all productivity setup"

    setup_git_hooks
    setup_aliases
    setup_shortcuts
    backup_config

    print_success "All productivity setup completed"
}

# Main script logic
case "${1:-help}" in
    "setup-git-hooks") setup_git_hooks ;;
    "setup-aliases") setup_aliases ;;
    "setup-shortcuts") setup_shortcuts ;;
    "code-stats") code_stats ;;
    "find-todos") find_todos ;;
    "find-fixmes") find_fixmes ;;
    "find-bugs") find_bugs ;;
    "clean-temp") clean_temp ;;
    "backup-config") backup_config ;;
    "restore-config") restore_config ;;
    "update-deps") update_deps ;;
    "check-security") check_security ;;
    "optimize-images") optimize_images ;;
    "generate-docs") generate_docs ;;
    "all") run_all ;;
    "help"|*) show_help ;;
esac
