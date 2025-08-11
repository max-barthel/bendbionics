# Soft Robot API Backend

A FastAPI-based backend for soft robot simulation and control.

## Test Coverage

This project has comprehensive test coverage with **100% code coverage** across all modules.

### Running Tests with Coverage

#### Using pytest directly:

```bash
# Run all tests with coverage
python -m pytest --cov=app --cov-report=term-missing --cov-report=html:htmlcov

# Run specific test files
python -m pytest tests/test_config.py --cov=app --cov-report=term-missing
```

#### Using the coverage script:

```bash
# Generate all coverage reports (terminal, HTML, XML)
python run_coverage.py --all

# Generate only terminal report
python run_coverage.py --term

# Generate only HTML report
python run_coverage.py --html

# Generate only XML report
python run_coverage.py --xml

# Set custom coverage threshold (default: 80%)
python run_coverage.py --fail-under=90
```

### Coverage Reports

- **Terminal Report**: Shows coverage summary in the terminal
- **HTML Report**: Detailed HTML report in `htmlcov/index.html`
- **XML Report**: Coverage data in `coverage.xml` for CI/CD integration

### Coverage Configuration

Coverage settings are configured in `pyproject.toml`:

- Source: `app` directory
- Excluded: test files, cache directories, virtual environments
- Minimum coverage: 80%
- Report formats: terminal, HTML, XML

### Test Structure

```
tests/
├── test_api_routes.py      # API endpoint tests
├── test_cache.py          # Caching system tests
├── test_config.py         # Configuration tests
├── test_geometry_tools.py # Geometry utilities tests
├── test_integration.py    # Full API workflow tests
└── test_pcc.py           # PCC model tests
```

### Coverage Statistics

- **Total Coverage**: 100%
- **Total Statements**: 181
- **Test Files**: 6
- **Test Cases**: 82

All modules have 100% coverage:

- `app/api/routes.py`: 100%
- `app/config.py`: 100%
- `app/main.py`: 100%
- `app/models/pcc/`: 100%
- `app/utils/`: 100%

### Integration Tests

The integration tests (`test_integration.py`) provide comprehensive end-to-end testing of the complete API workflow:

- **Complete Workflow**: Tests the full request-response cycle
- **Caching Behavior**: Verifies cache functionality and performance
- **Error Handling**: Tests various error scenarios and edge cases
- **Performance**: Validates response times for different payload sizes
- **Concurrency**: Tests handling of concurrent requests
- **CORS**: Verifies CORS headers and preflight requests
- **API Documentation**: Ensures documentation endpoints are accessible
- **Edge Cases**: Tests with extreme parameter values
- **Large Payloads**: Validates handling of complex requests
