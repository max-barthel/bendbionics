# Development Guide

This comprehensive guide covers all development workflows, tools, and processes for the Soft Robot App.

## 🚀 Quick Start

```bash
# First time setup
./setup.sh

# Start development
./dev.sh

# Development tools
./toolkit.sh all test        # Run tests
./toolkit.sh all lint        # Run linting
./toolkit.sh all fix         # Auto-fix issues
```

## 📋 Scripts Overview

| Script              | Purpose              | Usage               |
| ------------------- | -------------------- | ------------------- |
| `./setup.sh`        | First time setup     | `./setup.sh`        |
| `./dev.sh`          | Start development    | `./dev.sh`          |
| `./build.sh`        | Build for production | `./build.sh`        |
| `./health-check.sh` | Check system health  | `./health-check.sh` |
| `./toolkit.sh`      | Development tools    | `./toolkit.sh`      |

📖 **See [SCRIPTS.md](SCRIPTS.md) for detailed script documentation**

## 🛠️ Development Environment

### Prerequisites

- **Node.js**: Version 18+
- **Python**: Version 3.8+
- **Rust**: For Tauri development
- **Git**: For version control

### Setup

```bash
# Clone repository
git clone <repository-url>
cd soft-robot-app

# Setup development environment
./setup.sh

# Start development
./dev.sh
```

### Development URLs

- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Frontend: Running in desktop mode

## 🧪 Testing Strategy

### Test Types

- **Unit Tests**: Component and function testing
- **Integration Tests**: API and component integration
- **Visual Regression Tests**: UI consistency
- **E2E Tests**: End-to-end user workflows

### Running Tests

```bash
# All tests
./toolkit.sh all test

# Frontend tests
./toolkit.sh frontend test

# Backend tests
./toolkit.sh backend test

# With coverage
./toolkit.sh all coverage

# Integration tests
./toolkit.sh frontend integration

# Visual regression tests
./toolkit.sh frontend visual
```

### Test Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── __tests__/
│   ├── utils/
│   │   └── __tests__/
│   └── __tests__/
└── tests/
    ├── integration/
    └── visual/

backend/
├── app/
└── tests/
    ├── unit/
    └── integration/
```

## 🎨 Code Quality

### Linting and Formatting

```bash
# Check all code
./toolkit.sh all lint

# Auto-fix issues
./toolkit.sh all fix

# Quick check (errors only)
./toolkit.sh all quick

# Frontend only
./toolkit.sh frontend lint
./toolkit.sh frontend fix

# Backend only
./toolkit.sh backend lint
./toolkit.sh backend format-fix
```

### Code Quality Tools

- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Black**: Python formatting
- **Flake8**: Python linting
- **MyPy**: Python type checking
- **Pylint**: Python code analysis

### Quality Reports

```bash
# Generate quality report
./toolkit.sh quality report

# Frontend quality
./toolkit.sh quality frontend

# Backend quality
./toolkit.sh quality backend

# Code quality report
./toolkit.sh quality report
```

### Code Standards

- **TypeScript**: Strict mode enabled
- **Python**: Black formatting (88 chars)
- **React**: Functional components with hooks
- **FastAPI**: Async/await patterns
- **Testing**: AAA pattern (Arrange, Act, Assert)

## 📚 Documentation

### Component Documentation

```bash
# Start Storybook
./toolkit.sh docs storybook

# Build documentation
./toolkit.sh docs build
```

### API Documentation

```bash
# Build backend API docs
./toolkit.sh docs backend
```

### Documentation Structure

```
docs/
├── components/          # Component stories
├── api/                # API documentation
└── guides/             # Development guides

frontend/
├── src/
│   └── stories/        # Storybook stories
└── .storybook/         # Storybook config

backend/
└── app/                # Backend application code
```

## 🔧 Git Workflow

### Branch Strategy

- **main**: Production-ready code
- **develop**: Integration branch
- **feature/**: New features
- **bugfix/**: Bug fixes
- **hotfix/**: Critical fixes

### Commit Convention

```bash
# Commit with conventional commits
./toolkit.sh git commit

# Generate changelog
./toolkit.sh git changelog
```

### Commit Types

- **feat**: New features
- **fix**: Bug fixes
- **docs**: Documentation
- **style**: Code style changes
- **refactor**: Code refactoring
- **test**: Adding tests
- **chore**: Maintenance tasks

### Pre-commit Hooks

```bash
# Run pre-commit checks
./toolkit.sh git pre-commit

# Run pre-push checks
./toolkit.sh git pre-push
```

## 🚀 Productivity Tools

### VS Code Integration

- **80+ Keyboard Shortcuts**: Custom keybindings for efficiency
- **25+ Tasks**: Automated workflows
- **30+ Snippets**: Code templates
- **15+ Debug Configs**: Comprehensive debugging

### Code Snippets

```typescript
// React Component
rfc → React Functional Component

// React Hook
rhook → React Hook

// Test Block
vtest → Vitest Test Block

// Storybook Story
sstory → Storybook Story
```

```python
# FastAPI Route
froute → FastAPI Route

# Pydantic Model
pmodel → Pydantic Model

# Python Function
pfunc → Python Function

# Test Function
ptest → Pytest Test
```

### Keyboard Shortcuts

- `Cmd+Shift+Dev` - Start development
- `Cmd+Shift+Build` - Build application
- `Cmd+Shift+Test` - Run tests
- `Cmd+Shift+Lint` - Run linting
- `Cmd+Shift+Fix` - Fix issues
- `Cmd+Shift+Docs` - Start Storybook

### Debugging

- **Frontend**: Vite, Vitest, Tauri, Playwright, Storybook
- **Backend**: FastAPI, pytest, single files
- **Full Stack**: Both frontend and backend
- **Tests**: Both frontend and backend tests

## 🔍 Performance Monitoring

### Bundle Analysis

```bash
# Analyze bundle size
./toolkit.sh frontend analyze

# Check size budget
./toolkit.sh frontend size-check

# Lighthouse audit
./toolkit.sh frontend lighthouse
```

### Performance Tools

- **Rollup Visualizer**: Bundle analysis
- **Vite Bundle Analyzer**: Build analysis
- **Lighthouse**: Performance auditing
- **Bundle Size Monitoring**: Automated size checks

## 🧹 Maintenance

### Code Cleanup

```bash
# Find TODOs
./toolkit.sh productivity todos

# Find FIXMEs
./toolkit.sh productivity fixmes

# Find BUGs
./toolkit.sh productivity bugs

# Clean temp files
./toolkit.sh productivity clean
```

### Code Statistics

```bash
# Generate code stats
./toolkit.sh productivity stats
```

## 🚨 Troubleshooting

### Common Issues

```bash
# Check system health
./health-check.sh

# Fix dependencies
./setup.sh

# Run quick checks
./toolkit.sh all quick
```

### Debug Commands

```bash
# Frontend debugging
npm run dev:debug

# Backend debugging
python -m debugpy --listen 5678 --wait-for-client app/main.py

# Test debugging
npm run test:debug
```

## 📖 Best Practices

### Code Organization

- Use consistent file naming conventions
- Organize components by feature
- Keep functions small and focused
- Write self-documenting code

### Testing

- Write tests for new features
- Maintain high test coverage
- Use descriptive test names
- Test edge cases and error conditions

### Documentation

- Document complex logic
- Keep README files updated
- Use JSDoc for functions
- Write clear commit messages

### Performance

- Optimize bundle size
- Use lazy loading
- Implement proper caching
- Monitor performance metrics

---

_This development guide provides comprehensive coverage of all development workflows and tools. For specific script usage, see [SCRIPTS.md](SCRIPTS.md)._
