# Scripts Guide

This guide explains the purpose and usage of each script in the BendBionics platform.

## 🚀 Quick Start

| Script              | Purpose                  | When to Use                                               |
| ------------------- | ------------------------ | --------------------------------------------------------- |
| `./setup.sh`        | **First time setup**     | When cloning the repo or setting up a new environment     |
| `./dev.sh`          | **Start development**    | Daily development work - starts both frontend and backend |
| `./build.sh`        | **Build for production** | When ready to deploy or create releases                   |
| `./health-check.sh` | **Check system health**  | When troubleshooting or verifying setup                   |
| `./toolkit.sh`      | **Development tools**    | For linting, testing, docs, quality checks, etc.          |

## 📋 Script Details

### `./setup.sh` - Development Environment Setup

**Purpose**: Sets up the complete development environment for first-time users.

**What it does**:

- Checks system requirements (Node.js, Bun, Python, uv)
- Installs frontend dependencies with Bun
- Sets up Python virtual environment with uv
- Installs backend dependencies with uv
- Configures git hooks
- Runs initial checks

**Usage**:

```bash
./setup.sh
```

**When to use**:

- First time cloning the repository
- Setting up a new development environment
- After major dependency updates

---

### `./dev.sh` - Development Server

**Purpose**: Starts the complete development environment with hot reloading.

**What it does**:

- Starts Python backend on port 8000
- Starts React frontend development server
- Provides health checks and error handling
- Shows development URLs and info

**Usage**:

```bash
./dev.sh
```

**When to use**:

- Daily development work
- Testing features
- Debugging

**URLs**:

- Backend API: <http://localhost:8000>
- API Docs: <http://localhost:8000/docs>
- Frontend: <http://localhost:5173>

---

### `./build.sh` - Production Build

**Purpose**: Builds the application for production deployment.

**What it does**:

- Runs pre-build checks (linting, tests, bundle size)
- Builds frontend web assets
- Creates deployment package
- Shows build results and file locations

**Usage**:

```bash
./build.sh
```

**When to use**:

- Creating releases
- Deploying to production
- Testing production builds

**Output**:

- Web build: `frontend/dist/`
- Deployment package: `deploy/web-build-YYYYMMDD-HHMMSS/`

---

### `./health-check.sh` - System Health Check

**Purpose**: Verifies the health of the development environment and services.

**What it does**:

- Checks system requirements
- Verifies dependencies
- Tests service availability
- Runs code quality checks
- Checks build and test status

**Usage**:

```bash
./health-check.sh
```

**When to use**:

- Troubleshooting issues
- Verifying setup
- Before important work
- After system changes

---

### `./toolkit.sh` - Development Toolkit

**Purpose**: Comprehensive development tools for testing, linting, documentation, and more.

**What it does**:

- Code linting and formatting
- Running tests (unit, integration, visual regression)
- Documentation generation
- Code quality analysis
- Performance monitoring
- CI/CD tasks
- Git operations

**Usage**:

```bash
# Show all available commands
./toolkit.sh

# Run all tests
./toolkit.sh all test

# Run linting
./toolkit.sh all lint

# Fix code issues
./toolkit.sh all fix

# Generate documentation
./toolkit.sh docs storybook

# Code quality report
./toolkit.sh quality report

# Run CI pipeline locally
./toolkit.sh ci all
```

**Common Commands**:

#### Testing

```bash
./toolkit.sh all test              # Run all tests
./toolkit.sh frontend test         # Frontend tests only
./toolkit.sh backend test          # Backend tests only
./toolkit.sh all coverage          # Tests with coverage
./toolkit.sh frontend integration  # Integration tests
./toolkit.sh frontend visual       # Visual regression tests
```

#### Code Quality

```bash
./toolkit.sh all lint              # Run linting
./toolkit.sh all fix               # Auto-fix issues
./toolkit.sh all quick             # Quick check (errors only)
./toolkit.sh quality report        # Code quality report
./toolkit.sh quality sonar         # SonarQube analysis
```

#### Documentation

```bash
./toolkit.sh docs storybook        # Start Storybook
./toolkit.sh docs build            # Build documentation
./toolkit.sh docs backend          # Build API docs
```

#### Performance

```bash
./toolkit.sh frontend analyze      # Bundle analysis
./toolkit.sh frontend size-check   # Size budget check
./toolkit.sh frontend lighthouse   # Lighthouse audit
```

#### CI/CD

```bash
./toolkit.sh ci all                # Full CI pipeline
./toolkit.sh ci test               # Run tests
./toolkit.sh ci lint               # Run linting
./toolkit.sh ci build              # Build check
./toolkit.sh ci security           # Security checks
```

#### Git Operations

```bash
./toolkit.sh git commit            # Commit with conventional commits
./toolkit.sh git changelog         # Generate changelog
```

**When to use**:

- Before committing code
- Running specific tests
- Generating documentation
- Code quality analysis
- Performance monitoring
- Local CI/CD testing

---

## 🔄 Typical Workflow

### First Time Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd bendbionics-app

# 2. Set up development environment
./setup.sh

# 3. Start development
./dev.sh
```

### Daily Development

```bash
# 1. Start development environment
./dev.sh

# 2. Make changes to code
# ... edit files ...

# 3. Run tests and linting
./toolkit.sh all test
./toolkit.sh all lint

# 4. Fix any issues
./toolkit.sh all fix

# 5. Commit changes
./toolkit.sh git commit
```

### Before Deployment

```bash
# 1. Run health check
./health-check.sh

# 2. Run full test suite
./toolkit.sh all test

# 3. Run code quality checks
./toolkit.sh quality report

# 4. Build for production
./build.sh
```

### Troubleshooting

```bash
# 1. Check system health
./health-check.sh

# 2. Run specific tests
./toolkit.sh frontend test
./toolkit.sh backend test

# 3. Check code quality
./toolkit.sh all lint
./toolkit.sh quality report

# 4. Check performance
./toolkit.sh frontend analyze
```

## 🎯 Package Manager Scripts

For convenience, many toolkit commands are also available as Bun scripts:

```bash
# Development
bun run dev                        # Start development
bun run build                      # Build application
bun run setup                      # Setup environment
bun run health                     # Health check

# Toolkit commands
bun run toolkit                    # Show toolkit help
bun run toolkit:test               # Run tests
bun run toolkit:lint                # Run linting
bun run toolkit:fix                 # Fix issues
bun run toolkit:quality             # Quality report
bun run toolkit:docs                # Start Storybook
bun run toolkit:ci                 # Run CI pipeline
```

Note: This project uses **Bun** as the package manager (10-30x faster than npm) for the frontend, similar to how `uv` is used for the backend.

## 🛠️ VS Code Integration

All scripts are integrated with VS Code tasks. Use `Cmd+Shift+P` → "Tasks: Run Task" to access:

- **Start Development Environment** - Runs `./dev.sh`
- **Build Application** - Runs `./build.sh`
- **Run All Tests** - Runs `./toolkit.sh all test`
- **Run Linting** - Runs `./toolkit.sh all lint`
- **Fix Code Issues** - Runs `./toolkit.sh all fix`
- **Start Storybook** - Runs `./toolkit.sh docs storybook`
- **Code Quality Report** - Runs `./toolkit.sh quality report`
- **Run CI Pipeline** - Runs `./toolkit.sh ci all`

## 🚨 Troubleshooting

### Common Issues

#### Scripts Not Executable

```bash
chmod +x *.sh
```

#### Dependencies Missing

```bash
./setup.sh
```

#### Services Not Starting

```bash
./health-check.sh
```

#### Build Failures

```bash
./toolkit.sh all lint
./toolkit.sh all test
```

### Getting Help

```bash
# Show toolkit help
./toolkit.sh

# Show specific help
./toolkit.sh frontend help
./toolkit.sh backend help
./toolkit.sh docs help
./toolkit.sh quality help
./toolkit.sh ci help
```

## 📚 Additional Resources

- [DEVELOPMENT.md](DEVELOPMENT.md) - Development workflows and tools
- [SERVER.md](SERVER.md) - Server management and deployment

---

_This script organization provides a clear, consistent interface for all development tasks. Each script has a specific purpose and clear usage patterns._
