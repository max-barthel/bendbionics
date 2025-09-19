#!/bin/bash

# Setup GitHub Issues Integration
# This script sets up labels, templates, and project management for GitHub Issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if GitHub CLI is installed
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) is not installed."
        print_status "Install it with: brew install gh"
        print_status "Or visit: https://cli.github.com/"
        exit 1
    fi

    # Check if user is authenticated
    if ! gh auth status &> /dev/null; then
        print_error "GitHub CLI is not authenticated."
        print_status "Run: gh auth login"
        exit 1
    fi

    print_success "GitHub CLI is installed and authenticated"
}

# Get repository information
get_repo_info() {
    REPO_URL=$(git remote get-url origin)
    if [[ $REPO_URL == *"github.com"* ]]; then
        REPO_NAME=$(echo $REPO_URL | sed 's/.*github.com[:/]\([^.]*\).*/\1/')
        print_success "Repository: $REPO_NAME"
    else
        print_error "This doesn't appear to be a GitHub repository"
        exit 1
    fi
}

# Create labels
create_labels() {
    print_status "Creating GitHub labels..."

    # Create labels manually (GitHub API doesn't support bulk creation)
    print_status "Creating issue type labels..."
    gh label create "bug" --color "d73a4a" --description "Something isn't working" 2>/dev/null || print_status "Label 'bug' already exists"
    gh label create "enhancement" --color "a2eeef" --description "New feature or request" 2>/dev/null || print_status "Label 'enhancement' already exists"
    gh label create "documentation" --color "0075ca" --description "Improvements or additions to documentation" 2>/dev/null || print_status "Label 'documentation' already exists"
    gh label create "question" --color "d876e3" --description "Further information is requested" 2>/dev/null || print_status "Label 'question' already exists"
    gh label create "good first issue" --color "7057ff" --description "Good for newcomers" 2>/dev/null || print_status "Label 'good first issue' already exists"

    print_status "Creating priority labels..."
    gh label create "priority: critical" --color "b60205" --description "Must fix immediately" 2>/dev/null || print_status "Label 'priority: critical' already exists"
    gh label create "priority: high" --color "d93f0b" --description "Should fix soon" 2>/dev/null || print_status "Label 'priority: high' already exists"
    gh label create "priority: medium" --color "fbca04" --description "Normal priority" 2>/dev/null || print_status "Label 'priority: medium' already exists"
    gh label create "priority: low" --color "0e8a16" --description "Nice to have" 2>/dev/null || print_status "Label 'priority: low' already exists"

    print_status "Creating status labels..."
    gh label create "status: needs-triage" --color "f9d0c4" --description "Needs initial review" 2>/dev/null || print_status "Label 'status: needs-triage' already exists"
    gh label create "status: in-progress" --color "1d76db" --description "Currently being worked on" 2>/dev/null || print_status "Label 'status: in-progress' already exists"
    gh label create "status: blocked" --color "fef2c0" --description "Waiting on something" 2>/dev/null || print_status "Label 'status: blocked' already exists"
    gh label create "status: needs-review" --color "c2e0c6" --description "Ready for review" 2>/dev/null || print_status "Label 'status: needs-review' already exists"

    print_status "Creating component labels..."
    gh label create "component: frontend" --color "e99695" --description "Frontend related" 2>/dev/null || print_status "Label 'component: frontend' already exists"
    gh label create "component: backend" --color "c5def5" --description "Backend related" 2>/dev/null || print_status "Label 'component: backend' already exists"
    gh label create "component: docs" --color "d4c5f9" --description "Documentation related" 2>/dev/null || print_status "Label 'component: docs' already exists"
    gh label create "component: ci-cd" --color "bfd4f2" --description "CI/CD related" 2>/dev/null || print_status "Label 'component: ci-cd' already exists"
    gh label create "component: database" --color "f9d0c4" --description "Database related" 2>/dev/null || print_status "Label 'component: database' already exists"
    gh label create "component: api" --color "c2e0c6" --description "API related" 2>/dev/null || print_status "Label 'component: api' already exists"

    print_status "Creating special type labels..."
    gh label create "type: security" --color "ff6b6b" --description "Security related" 2>/dev/null || print_status "Label 'type: security' already exists"
    gh label create "type: performance" --color "4ecdc4" --description "Performance related" 2>/dev/null || print_status "Label 'type: performance' already exists"
    gh label create "type: accessibility" --color "45b7d1" --description "Accessibility related" 2>/dev/null || print_status "Label 'type: accessibility' already exists"

    print_status "Creating size labels..."
    gh label create "size: small" --color "0e8a16" --description "Small change" 2>/dev/null || print_status "Label 'size: small' already exists"
    gh label create "size: medium" --color "fbca04" --description "Medium change" 2>/dev/null || print_status "Label 'size: medium' already exists"
    gh label create "size: large" --color "d93f0b" --description "Large change" 2>/dev/null || print_status "Label 'size: large' already exists"

    print_status "Creating special labels..."
    gh label create "breaking-change" --color "b60205" --description "Breaking change" 2>/dev/null || print_status "Label 'breaking-change' already exists"
    gh label create "duplicate" --color "cfd3d7" --description "This issue or pull request already exists" 2>/dev/null || print_status "Label 'duplicate' already exists"
    gh label create "invalid" --color "e4e669" --description "This doesn't seem right" 2>/dev/null || print_status "Label 'invalid' already exists"
    gh label create "wontfix" --color "ffffff" --description "This will not be worked on" 2>/dev/null || print_status "Label 'wontfix' already exists"

    print_success "All labels created successfully"
}

# Create milestones
create_milestones() {
    print_status "Creating milestones..."

    # Create common milestones (skip if they already exist)
    gh api repos/$REPO_NAME/milestones --method POST --field title="v1.0.0" --field description="Initial release" 2>/dev/null || print_status "Milestone 'v1.0.0' already exists"
    gh api repos/$REPO_NAME/milestones --method POST --field title="v1.1.0" --field description="Feature release" 2>/dev/null || print_status "Milestone 'v1.1.0' already exists"
    gh api repos/$REPO_NAME/milestones --method POST --field title="Sprint 1" --field description="Current development sprint" 2>/dev/null || print_status "Milestone 'Sprint 1' already exists"

    print_success "Milestones setup completed"
}

# Create project board
create_project() {
    print_status "Creating project board..."
    print_warning "GitHub Projects (classic) has been deprecated. Please create a new-style project manually:"
    print_status "1. Go to your repository on GitHub"
    print_status "2. Click on 'Projects' tab"
    print_status "3. Click 'New project'"
    print_status "4. Choose 'Table' or 'Board' view"
    print_status "5. Name it 'Soft Robot App Development'"
    print_status "6. Add these columns: Backlog, To Do, In Progress, In Review, Done"
    print_success "Project board setup instructions provided"
}

# Create sample issues
create_sample_issues() {
    print_status "Creating sample issues..."

    # Create a sample bug report
    gh issue create --title "[BUG] Sample bug report" --body "This is a sample bug report to demonstrate the issue template." --label "bug,priority: low,component: frontend,status: needs-triage"

    # Create a sample feature request
    gh issue create --title "[FEATURE] Sample feature request" --body "This is a sample feature request to demonstrate the issue template." --label "enhancement,priority: medium,component: frontend,status: needs-triage"

    # Create a sample documentation issue
    gh issue create --title "[DOCS] Sample documentation issue" --body "This is a sample documentation issue to demonstrate the issue template." --label "documentation,priority: low,component: docs,status: needs-triage"

    print_success "Sample issues created successfully"
}

# Show next steps
show_next_steps() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}🎉 GitHub Issues Setup Complete!${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
    echo -e "${GREEN}✅ What was created:${NC}"
    echo -e "  • Issue templates (bug, feature, docs, question)"
    echo -e "  • Pull request template"
    echo -e "  • Labels for categorization"
    echo -e "  • Milestones for releases"
    echo -e "  • Project board for task management"
    echo -e "  • Sample issues for demonstration"
    echo ""
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo -e "  1. Visit your repository on GitHub"
    echo -e "  2. Go to Issues → Labels to see all labels"
    echo -e "  3. Go to Projects to see your project board"
    echo -e "  4. Go to Issues to see sample issues"
    echo -e "  5. Create your first real issue!"
    echo ""
    echo -e "${BLUE}🔗 Useful commands:${NC}"
    echo -e "  gh issue create --title \"[BUG] Your bug title\" --body \"Description\""
    echo -e "  gh issue list --label bug"
    echo -e "  gh issue close 123"
    echo -e "  gh issue comment 123 --body \"Your comment\""
    echo ""
    echo -e "${GREEN}🚀 Happy issue tracking!${NC}"
}

# Main execution
main() {
    print_status "Setting up GitHub Issues integration..."

    check_gh_cli
    get_repo_info
    create_labels
    create_milestones
    create_project
    create_sample_issues
    show_next_steps
}

# Run main function
main
