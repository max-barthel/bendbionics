#!/bin/bash

# Get Project ID for GitHub Issues Automation
# This script helps you find your project ID for the auto-assign workflow

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

# Check if GitHub CLI is installed and authenticated
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) is not installed."
        print_status "Install it with: brew install gh"
        exit 1
    fi

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

# Get project information
get_project_info() {
    print_status "Fetching project information..."

    # Get all projects for the repository
    gh api graphql -f query='
        query($owner: String!, $repo: String!) {
          repository(owner: $owner, name: $repo) {
            projects(first: 20) {
              nodes {
                id
                name
                number
                url
                state
                createdAt
                updatedAt
              }
            }
          }
        }
    ' -f owner="$(echo $REPO_NAME | cut -d'/' -f1)" -f repo="$(echo $REPO_NAME | cut -d'/' -f2)" --jq '.data.repository.projects.nodes[]' > projects.json

    if [ ! -s projects.json ]; then
        print_error "No projects found for this repository"
        print_status "Please create a project first:"
        print_status "1. Go to your repository on GitHub"
        print_status "2. Click on 'Projects' tab"
        print_status "3. Click 'New project'"
        print_status "4. Name it 'Soft Robot App Development'"
        exit 1
    fi

    print_success "Found projects:"
    echo ""

    # Display projects in a nice format
    jq -r '.[] | "📋 \(.name) (ID: \(.id))" + "\n   URL: \(.url)" + "\n   State: \(.state)" + "\n   Created: \(.createdAt)" + "\n"' projects.json

    echo ""
    print_status "To use in your workflow, copy the Project ID (the long string starting with 'PVT_')"
    print_status "Example: PVT_kwDOOYVt384A0XTY"

    # Clean up
    rm -f projects.json
}

# Show usage instructions
show_usage() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}🔍 GitHub Project ID Finder${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
    echo -e "${GREEN}This script helps you find your project ID for GitHub Issues automation.${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo -e "  ./scripts/get-project-id.sh"
    echo ""
    echo -e "${YELLOW}What it does:${NC}"
    echo -e "  • Lists all projects in your repository"
    echo -e "  • Shows project IDs for use in workflows"
    echo -e "  • Helps you configure auto-assign-issues workflow"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "  1. Run this script to get your project ID"
    echo -e "  2. Copy the project ID"
    echo -e "  3. Update .github/workflows/auto-assign-issues-simple.yml"
    echo -e "  4. Replace the PROJECT_ID placeholder with your actual ID"
    echo ""
}

# Main execution
main() {
    show_usage
    check_gh_cli
    get_repo_info
    get_project_info

    echo ""
    print_success "Project ID retrieval complete!"
    print_status "Now update your workflow file with the project ID"
}

# Run main function
main
