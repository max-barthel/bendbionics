# CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions for automated CI/CD, optimized for web application deployment. The pipeline includes testing, quality checks, performance monitoring, and automated deployment.

## Workflows

### 1. **CI Pipeline** (`ci.yml`)

**Triggers:** Push to main/develop/web-app-deployment, Pull Requests

**Jobs:**

- **Quality & Tests**: Linting, testing, integration tests
- **Web Build & Performance**: Build optimization, bundle analysis, Lighthouse audits
- **Backend Build Check**: Backend import verification and configuration checks

### 2. **Test Suite** (`test.yml`)

**Triggers:** Push to main/develop/web-app-deployment, Pull Requests

**Jobs:**

- **Frontend Tests**: Unit tests, coverage, integration tests, visual regression
- **Backend Tests**: Unit tests, API tests, coverage reports
- **Quality Checks**: Linting, type checking, security audits
- **Performance Tests**: Bundle size analysis, Lighthouse audits
- **Test Summary**: Comprehensive test results summary

### 3. **Deploy** (`deploy.yml`)

**Triggers:** Push to main/web-app-deployment, Manual dispatch

**Jobs:**

- **Build & Test**: Pre-deployment validation
- **Deploy to Production**: Automated deployment to bendbionics.com
- **Deploy to Staging**: Staging environment deployment (if configured)

### 4. **Quick Test** (`quick-test.yml`)

**Triggers:** Manual dispatch, Push to main branches

**Purpose:** Fast health check for development workflow

## Environment Variables

### Required Secrets

- `SSH_PRIVATE_KEY`: SSH key for server deployment
- `SERVER_USER`: Server username
- `SERVER_HOST`: Server hostname/IP

### Optional Secrets

- `GITHUB_TOKEN`: For release creation (auto-provided)

## Deployment Process

### Automatic Deployment

1. **Push to main/web-app-deployment** → Triggers full CI/CD
2. **Tests pass** → Build artifacts created
3. **Deploy job** → Uploads to server and runs deployment
4. **Health check** → Verifies deployment success

### Manual Deployment

1. **Go to Actions tab** → "Deploy Web Application"
2. **Click "Run workflow"** → Select environment
3. **Monitor progress** → Check logs for any issues

## Quality Gates

### Frontend

- ✅ Linting passes (ESLint)
- ✅ Type checking (TypeScript)
- ✅ Unit tests pass
- ✅ Integration tests pass
- ✅ Visual regression tests pass
- ✅ Bundle size within limits
- ✅ Lighthouse performance score > 90

### Backend

- ✅ Linting passes (Ruff)
- ✅ Type checking (MyPy)
- ✅ Unit tests pass
- ✅ API tests pass
- ✅ Security audit passes
- ✅ Imports verify successfully

## Performance Monitoring

### Bundle Analysis

- **Size limits**: Configured in `performance-budget.json`
- **Analysis**: Automated bundle size reporting
- **Optimization**: Tree shaking, code splitting, compression

### Lighthouse Audits

- **Performance**: Core Web Vitals monitoring
- **Accessibility**: WCAG compliance
- **Best Practices**: Security and optimization
- **SEO**: Search engine optimization

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Check locally
bun run ci:all
```

#### Deployment Failures

```bash
# Check server connectivity
ssh $SERVER_USER@$SERVER_HOST "echo 'Connection successful'"
```

#### Test Failures

```bash
# Run tests locally
bun run test
cd backend && python -m pytest
```

### Debug Commands

#### Frontend

```bash
cd frontend
bun run lint          # Check linting
bun run test:run      # Run tests
bun run build         # Test build
bun run lighthouse     # Performance audit
```

#### Backend

```bash
cd backend
ruff check app/       # Check linting
python -m pytest      # Run tests
python -c "import app.main"  # Test imports
```

## Development Workflow

### Local Development

```bash
./dev.sh              # Start development environment
./toolkit.sh quick    # Quick health check
./toolkit.sh ci all   # Full CI pipeline locally
```

### Pre-commit Checks

```bash
./toolkit.sh lint all    # Linting
./toolkit.sh test all    # Testing
./toolkit.sh fix all     # Auto-fix issues
```

### Deployment

```bash
./build.sh              # Build for production
./deploy-workflow.sh     # Complete deployment
```

## Monitoring & Alerts

### Health Checks

- **Application**: <https://bendbionics.com/health>
- **API Docs**: <https://bendbionics.com/docs>
- **Performance**: Lighthouse CI reports

### Logs

- **GitHub Actions**: Check workflow logs
- **Server**: `ssh $SERVER_USER@$SERVER_HOST 'sudo journalctl -u soft-robot-api -f'`

## Best Practices

### Code Quality

- ✅ All code must pass linting
- ✅ All tests must pass
- ✅ Type checking must pass
- ✅ Security audits must pass

### Performance

- ✅ Bundle size within budget
- ✅ Lighthouse score > 90
- ✅ Core Web Vitals optimized

### Deployment

- ✅ Never deploy failing tests
- ✅ Always test locally first
- ✅ Monitor deployment health
- ✅ Keep deployment logs

## Support

### Documentation

- **API Docs**: <https://bendbionics.com/docs>
- **Storybook**: `bun run storybook`
- **Development**: `./dev.sh`

### Issues

- **GitHub Issues**: Report bugs and feature requests
- **Discussions**: Community support and questions
- **Security**: Report security issues privately

---

**Last Updated**: $(date)
**Pipeline Version**: 2.0 (Web-optimized)
