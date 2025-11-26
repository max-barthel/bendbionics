# BendBionics - Soft Robot Simulation Platform

A modern web application for simulating soft robot kinematics using the Piecewise Constant Curvature (PCC) model, built with React and FastAPI.

## 🌐 Web Application

BendBionics is a **web-based simulation platform** optimized for deployment on Ubuntu servers with nginx and SSL.

## Architecture

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4 (Vite) with Bun package manager
- **Backend**: FastAPI + Python 3.11+ with uv package manager
- **Design**: macOS Tahoe 26 aesthetic with liquid glass styling
- **Deployment**: nginx + systemd + SSL certificates (Let's Encrypt)
- **Database**: PostgreSQL
- **CI/CD**: GitHub Actions for automated testing and deployment

## Key Features

- 3D visualization of robot segments with real-time updates (Three.js)
- Real-time parameter adjustment with live preview
- Unit conversion (degrees/radians, mm/cm/m)
- Preset Management with user authentication (JWT)
- Modular tendon calculation system (3-12 tendons)
- Web-optimized performance with modern browsers

## Quick Start

### Prerequisites

- **Bun** (JavaScript runtime & package manager) - Install: `curl -fsSL https://bun.sh/install | bash`
- **Python** 3.11+
- **uv** (Python package manager) - Install: `curl -LsSf https://astral.sh/uv/install.sh | sh`

### First-Time Setup

```bash
# Set up development environment
./setup.sh
```

### Development

```bash
# Start development environment
./dev.sh

# Or manually:
# Backend: cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Frontend: cd frontend && bun run dev
```

### Testing

```bash
# Run all tests
./toolkit.sh all test

# Test web build locally (optional)
./scripts/test-build.sh
```

### Building

```bash
# Build for web deployment
./build.sh
```

## Deployment

### Production Deployment

BendBionics is deployed at **<https://bendbionics.com>**

```bash
# Complete deployment workflow (build, upload, deploy)
./deploy-workflow.sh

# Or step by step:
# 1. Build for deployment
./build.sh

# 2. Deploy using workflow script
./deploy-workflow.sh
```

The deployment workflow handles:

- Building the application
- Uploading to server
- Deploying on server
- Cleanup of deployment packages

For detailed server management and troubleshooting, see [SERVER.md](./SERVER.md).

## Development Workflow

- Use `./dev.sh` for development
- Use `./build.sh` for production builds
- Use `./deploy-workflow.sh` for deployment
- Use `./toolkit.sh` for development tools
- All styling with Tailwind CSS only (no direct CSS)
- Follow Tahoe liquid glass design system consistently

For detailed script documentation, see [SCRIPTS.md](./SCRIPTS.md).

## Code Quality Standards

- **Essential Testing**: Test what actually breaks
- **TypeScript When Helpful**: Use types to prevent bugs, not for perfection
- **Basic Linting**: Catch obvious errors, not style perfection
- **Simple Commits**: Clear messages, no complex conventions
- **User-Focused Docs**: Document what users need, not everything

## Project Structure

```txt
├── frontend/           # React web application
│   ├── src/           # Source code
│   ├── dist/          # Built web assets
│   └── package.json   # Web dependencies
├── backend/            # FastAPI backend
│   ├── app/           # Application code
│   └── pyproject.toml  # Python dependencies (uv)
├── config/             # Deployment configurations
│   ├── nginx/         # Nginx configuration
│   └── systemd/       # Service configuration
├── builds/             # Deployment packages
├── scripts/            # Development tools and deployment scripts
└── deploy-workflow.sh  # Complete deployment workflow
```

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Three.js
- **Frontend Package Manager**: Bun (10-30x faster than npm)
- **Backend**: FastAPI, Python 3.11+, SQLAlchemy, SQLModel
- **Backend Package Manager**: uv (modern, fast Python package manager)
- **Deployment**: nginx, systemd, Let's Encrypt
- **Database**: PostgreSQL
- **Testing**: Vitest (frontend), Playwright (integration), pytest (backend)
- **Documentation**: Storybook (component documentation)

## Getting Help

- **Development**: See [SCRIPTS.md](./SCRIPTS.md) for development tools and workflows
- **Deployment**: See [SERVER.md](./SERVER.md) for server management and deployment details
- **Scripts**: See [SCRIPTS.md](./SCRIPTS.md) for complete script documentation

## License

This project is part of the BendBionics platform.
