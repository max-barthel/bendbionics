# Contributing to BendBionics

Thank you for your interest in contributing to BendBionics! This document provides guidelines and instructions for contributing to the project.

We welcome contributions from the community and are excited to see what you'll build!

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/max-barthel/bendbionics.git
   cd bendbionics
   ```

3. **Set up the development environment**:

   ```bash
   ./scripts/setup.sh
   ```

## Development Workflow

### Running the Application

```bash
# Start both frontend and backend in development mode
./dev.sh
```

### Making Changes

1. Create a new branch for your feature or fix:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. Make your changes following the code style guidelines below

3. Test your changes:

   ```bash
   # Run all tests
   ./toolkit.sh test all

   # Or run specific test suites
   ./toolkit.sh test frontend
   ./toolkit.sh test backend

   # Or run directly
   cd frontend && bun run test:run
   cd backend && uv run pytest
   ```

4. Commit your changes with clear, descriptive messages:

   ```bash
   git commit -m "Add feature: description of what you added"
   ```

5. Push to your fork and create a Pull Request

## Code Style

### General Principles

- **Keep it simple**: Prefer straightforward solutions over clever ones
- **Be consistent**: Follow existing patterns in the codebase
- **Document complex logic**: Add comments for non-obvious code
- **Test critical paths**: Focus testing on what actually breaks

### Frontend (React/TypeScript)

- Use TypeScript for type safety
- Follow React best practices (hooks, functional components)
- Use Tailwind CSS for all styling (no direct CSS files)
- Follow the existing component structure in `frontend/src/components/`
- Use the design system tokens from `frontend/src/styles/design-tokens.ts`

### Backend (Python/FastAPI)

- Follow PEP 8 style guidelines
- Use type hints for function parameters and return values
- Keep functions focused and single-purpose
- Use SQLModel for database models
- Follow FastAPI best practices for route definitions

### Code Formatting

- **Frontend**: Prettier and ESLint are configured - run `bun run format` before committing
- **Backend**: Ruff is configured for linting and formatting
- Pre-commit hooks will automatically format code

## Testing

### Frontend Tests

```bash
cd frontend
bun run test:run      # Run unit tests
bun run test:coverage # Run tests with coverage
bun run test:integration  # Run E2E tests with Playwright
```

### Backend Tests

```bash
cd backend
uv run pytest         # Run all tests
uv run pytest -v      # Verbose output
uv run pytest path/to/test_file.py  # Run specific test file
```

### Test Requirements

- New features should include appropriate tests
- Bug fixes should include regression tests
- Focus on testing critical paths and user-facing functionality
- Integration tests for API endpoints
- E2E tests for important user flows

## Pull Request Process

1. **Update documentation** if you've changed functionality
2. **Add tests** for new features or bug fixes
3. **Ensure all tests pass** before submitting
4. **Write clear commit messages** that describe what and why
5. **Reference issues** in your PR description if applicable

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing

Describe how you tested your changes

## Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated (if needed)
- [ ] No breaking changes (or documented if necessary)
```

## Project Structure

Understanding the project structure helps with contributions:

- `frontend/src/components/` - React components
- `frontend/src/features/` - Feature modules
- `frontend/src/api/` - API client code
- `backend/app/api/` - API route handlers
- `backend/app/models/` - Data models (PCC, tendons, users)
- `backend/app/services/` - Business logic
- `scripts/` - Development and deployment scripts

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues and PRs before creating new ones
- Be respectful and constructive in all communications

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to BendBionics! 🚀
