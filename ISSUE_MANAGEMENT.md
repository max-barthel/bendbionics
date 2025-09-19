# Issue Management Guide

This guide explains how to effectively use GitHub Issues for project management in the Soft Robot App.

## 🚀 Quick Start

### Setup GitHub Issues Integration

```bash
# Run the setup script
./scripts/setup-github-issues.sh
```

### Create Your First Issue

```bash
# Using GitHub CLI
gh issue create --title "[BUG] Login fails with error" --body "Description here" --label "bug,priority: high"

# Or visit GitHub web interface
# Go to your repository → Issues → New Issue
```

## 📋 Issue Types and Templates

### 🐛 Bug Reports

Use for reporting bugs or unexpected behavior.

**Template Fields:**

- Bug description
- Steps to reproduce
- Expected vs actual behavior
- Severity level
- Component affected
- Environment details
- Screenshots/logs

**Example:**

```markdown
Title: [BUG] Login fails with "Invalid credentials" error

Description: Users cannot log in even with correct credentials

Steps to Reproduce:

1. Go to login page
2. Enter valid credentials
3. Click login button
4. See "Invalid credentials" error

Expected: User should be logged in successfully
Actual: Error message appears
```

### ✨ Feature Requests

Use for suggesting new features or improvements.

**Template Fields:**

- Feature description
- Problem statement
- Proposed solution
- Priority level
- Component affected
- Acceptance criteria
- Mockups/wireframes

**Example:**

```markdown
Title: [FEATURE] Add dark mode toggle

Description: Add a dark mode toggle to the settings

Problem: Users want a dark theme option for better usability

Solution: Add a toggle in settings that switches between light and dark themes

Acceptance Criteria:

- [ ] Toggle exists in settings
- [ ] Theme persists across sessions
- [ ] All components support dark mode
```

### 📚 Documentation

Use for documentation improvements or additions.

**Template Fields:**

- Documentation description
- Type of documentation
- Location
- Current vs desired state
- Target audience
- Content outline

**Example:**

```markdown
Title: [DOCS] Add API authentication guide

Description: Need documentation for API authentication

Type: API Documentation
Location: README.md or new API guide
Target: Developers integrating with our API
```

### ❓ Questions

Use for asking questions about the project.

**Template Fields:**

- Your question
- Question type
- Component
- Context
- Environment

**Example:**

```markdown
Title: [QUESTION] How to add new robot parameters?

Description: I want to add a new parameter to the robot configuration

Type: Technical implementation
Component: Backend
Context: Working on robot simulation features
```

## 🏷️ Labeling System

### Issue Types

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `question` - Questions about the project
- `good first issue` - Good for newcomers

### Priority Levels

- `priority: critical` - Must fix immediately
- `priority: high` - Should fix soon
- `priority: medium` - Normal priority
- `priority: low` - Nice to have

### Status Tracking

- `status: needs-triage` - Needs initial review
- `status: in-progress` - Currently being worked on
- `status: blocked` - Waiting on something
- `status: needs-review` - Ready for review

### Components

- `component: frontend` - Frontend related
- `component: backend` - Backend related
- `component: docs` - Documentation related
- `component: ci-cd` - CI/CD related
- `component: database` - Database related
- `component: api` - API related

### Special Types

- `type: security` - Security related
- `type: performance` - Performance related
- `type: accessibility` - Accessibility related
- `breaking-change` - Breaking change
- `duplicate` - Duplicate issue
- `invalid` - Invalid issue
- `wontfix` - Won't be fixed

## 🎯 Milestones and Releases

### Creating Milestones

```bash
# Create a milestone
gh api repos/your-username/soft-robot-app/milestones --method POST --field title="v1.1.0" --field description="Feature release"

# List milestones
gh api repos/your-username/soft-robot-app/milestones
```

### Common Milestones

- `v1.0.0` - Initial release
- `v1.1.0` - Feature release
- `v1.1.1` - Bug fix release
- `Sprint 1` - Current development sprint
- `Sprint 2` - Next sprint

### Assigning Issues to Milestones

```bash
# Assign issue to milestone
gh issue edit 123 --milestone "v1.1.0"

# List issues in milestone
gh issue list --milestone "v1.1.0"
```

## 📊 Project Management

### Project Board Setup

1. Go to your repository → **Projects**
2. Create new project: "Soft Robot App Development"
3. Add columns:
   - **Backlog** - New issues
   - **To Do** - Ready to work on
   - **In Progress** - Currently being worked on
   - **In Review** - Ready for review
   - **Done** - Completed

### Moving Issues Through Workflow

```bash
# Add issue to project
gh issue edit 123 --add-project "Soft Robot App Development"

# Move to different column (via GitHub web interface)
# Or use project automation rules
```

## 🔄 Workflow Integration

### Branch Naming Convention

```bash
# Link branches to issues
git checkout -b feature/123-add-dark-mode
git checkout -b bugfix/456-fix-login-error
git checkout -b docs/789-update-api-docs
```

### Commit Message Convention

```bash
# Reference issues in commits
git commit -m "feat: add dark mode toggle (#123)"
git commit -m "fix: resolve login error (#456)"
git commit -m "docs: update API documentation (#789)"
```

### Pull Request Integration

```markdown
## Description

Brief description of changes

## Related Issues

Closes #123
Fixes #456
Related to #789

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
```

## 🛠️ GitHub CLI Commands

### Creating Issues

```bash
# Create bug report
gh issue create --title "[BUG] Login fails" --body "Description" --label "bug,priority: high"

# Create feature request
gh issue create --title "[FEATURE] Add dark mode" --body "Description" --label "enhancement,priority: medium"

# Create with assignee and milestone
gh issue create --title "[BUG] Critical error" --body "Description" --assignee @me --milestone "v1.1.0"
```

### Managing Issues

```bash
# List issues
gh issue list
gh issue list --label bug
gh issue list --state open
gh issue list --assignee @me

# View issue
gh issue view 123

# Edit issue
gh issue edit 123 --title "New title"
gh issue edit 123 --add-label "priority: high"
gh issue edit 123 --remove-label "priority: low"

# Close issue
gh issue close 123 --comment "Fixed in PR #456"

# Reopen issue
gh issue reopen 123
```

### Adding Comments

```bash
# Add comment
gh issue comment 123 --body "This is a comment"

# Add comment from file
gh issue comment 123 --body-file comment.md
```

### Searching Issues

```bash
# Search by label
gh issue list --label "bug,priority: high"

# Search by state
gh issue list --state closed

# Search by assignee
gh issue list --assignee @me

# Search by milestone
gh issue list --milestone "v1.1.0"
```

## 📈 Best Practices

### Issue Creation

- **Clear titles** - Use descriptive, searchable titles
- **Detailed descriptions** - Include context and steps
- **Proper labeling** - Use consistent labels
- **One issue per problem** - Don't combine multiple issues
- **Include screenshots** - Visual context helps

### Issue Management

- **Regular triage** - Review and prioritize issues weekly
- **Update status** - Keep issue status current
- **Close promptly** - Close issues when resolved
- **Link related issues** - Reference related issues/PRs
- **Use @mentions** - Notify relevant people

### Communication

- **Be specific** - Provide clear, actionable feedback
- **Be respectful** - Maintain professional tone
- **Be responsive** - Respond to comments promptly
- **Be helpful** - Provide constructive suggestions

## 🚨 Automation

### Auto-close Issues

```yaml
# In .github/workflows/auto-close.yml
name: Auto-close Issues
on:
  pull_request:
    types: [closed]

jobs:
  auto-close:
    runs-on: ubuntu-latest
    steps:
      - name: Close related issues
        uses: actions/github-script@v6
        with:
          script: |
            const { data: pr } = context.payload.pull_request;
            const closingKeywords = ['closes', 'fixes', 'resolves'];
            const body = pr.body.toLowerCase();

            for (const keyword of closingKeywords) {
              const regex = new RegExp(`${keyword}\\s+#(\\d+)`, 'gi');
              const matches = body.match(regex);

              if (matches) {
                for (const match of matches) {
                  const issueNumber = match.match(/#(\d+)/)[1];
                  await github.rest.issues.update({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    issue_number: issueNumber,
                    state: 'closed'
                  });
                }
              }
            }
```

### Auto-assign Reviewers

```yaml
# In .github/workflows/auto-assign.yml
name: Auto-assign Reviewers
on:
  pull_request:
    types: [opened]

jobs:
  auto-assign:
    runs-on: ubuntu-latest
    steps:
      - name: Auto-assign reviewers
        uses: actions/github-script@v6
        with:
          script: |
            const { data: pr } = context.payload.pull_request;
            const changedFiles = pr.changed_files;

            // Auto-assign based on file changes
            if (changedFiles.some(file => file.startsWith('frontend/'))) {
              await github.rest.pulls.requestReviewers({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: pr.number,
                reviewers: ['frontend-reviewer']
              });
            }
```

## 📊 Reporting and Analytics

### Issue Metrics

```bash
# Count issues by label
gh issue list --label bug --json number | jq length

# Count issues by milestone
gh issue list --milestone "v1.1.0" --json number | jq length

# Count issues by assignee
gh issue list --assignee @me --json number | jq length
```

### Generate Reports

```bash
# Create issue report
gh issue list --state all --json title,labels,state,createdAt > issues-report.json

# Export to CSV
gh issue list --state all --json title,labels,state,createdAt | jq -r '.[] | [.title, .state, .labels[].name] | @csv' > issues.csv
```

## 🎯 Quick Reference

### Common Commands

```bash
# Create issue
gh issue create --title "Title" --body "Description"

# List issues
gh issue list --label bug --state open

# View issue
gh issue view 123

# Edit issue
gh issue edit 123 --add-label "priority: high"

# Close issue
gh issue close 123 --comment "Fixed"

# Add comment
gh issue comment 123 --body "Comment"
```

### Label Combinations

```bash
# Critical bug
gh issue create --title "[BUG] Critical error" --label "bug,priority: critical,status: needs-triage"

# High priority feature
gh issue create --title "[FEATURE] Important feature" --label "enhancement,priority: high,status: needs-triage"

# Good first issue
gh issue create --title "[FEATURE] Simple feature" --label "enhancement,good first issue,priority: low"
```

---

_This issue management system provides a professional, organized approach to project management using GitHub Issues. For development workflows, see [DEVELOPMENT.md](DEVELOPMENT.md)._
