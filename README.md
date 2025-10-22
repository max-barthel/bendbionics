# BendBionics - Soft Robot Simulation Platform

A modern web application for simulating soft robot kinematics using the Piecewise Constant Curvature (PCC) model, built with React and FastAPI.

## 🌐 Web Application

BendBionics is a **web-based simulation platform** optimized for deployment on Ubuntu servers with nginx and SSL.

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS (Vite)
- **Backend**: FastAPI + Python with essential testing
- **Design**: macOS Tahoe 26 aesthetic with liquid glass styling
- **Deployment**: nginx + systemd + SSL certificates
- **Database**: SQLite (upgradeable to PostgreSQL)

## Key Features

- 3D visualization of robot segments with real-time updates
- Real-time parameter adjustment with live preview
- Unit conversion (degrees/radians, mm/cm/m)
- Preset Management with user authentication
- Web-optimized performance with modern browsers

## Quick Start

### Development

```bash
# Start development environment
./dev.sh

# Or manually:
# Backend: cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Frontend: cd frontend && npm run dev
```

### Testing

```bash
# Test web build locally
./test-build.sh

# Run all tests
./toolkit.sh all test
```

### Building

```bash
# Build for web deployment
./build.sh
```

## Deployment

### Local Testing

```bash
# Test web build locally
./test-build.sh
```

### Production Deployment

```bash
# Build for deployment
./build.sh

# Deploy to Ubuntu server
# 1. Upload deployment package to server
# 2. Run: sudo ./deploy.sh
# 3. Configure domain and SSL
```

See the deployment section above for complete deployment instructions.

## Development Workflow

- Use `./dev.sh` for development
- Use `./build.sh` for building
- Use `./toolkit.sh` for development tools
- All styling with Tailwind CSS only (no direct CSS)
- Follow Tahoe liquid glass design system consistently

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
│   └── requirements.txt # Python dependencies
├── deploy/             # Deployment configurations
│   ├── nginx/         # Nginx configuration
│   ├── systemd/       # Service configuration
│   └── *.sh           # Deployment scripts
└── scripts/           # Development tools
```

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Three.js
- **Backend**: FastAPI, Python 3.8+, SQLAlchemy
- **Deployment**: nginx, systemd, Let's Encrypt
- **Database**: SQLite (production: PostgreSQL)
- **Testing**: Vitest, Playwright, Storybook

## Getting Help

- **Development**: See `DEVELOPMENT.md`
- **Deployment**: See deployment section above
- **Scripts**: See `SCRIPTS.md`

## License

This project is part of the BendBionics platform.
