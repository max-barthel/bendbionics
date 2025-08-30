# Soft Robot API Backend

A FastAPI-based backend for soft robot simulation and control.

## Features

- **PCC Model**: Piecewise Constant Curvature robot simulation
- **Caching**: Intelligent caching for performance optimization
- **Authentication**: JWT-based user authentication
- **Email Verification**: Optional email verification system
- **Preset Management**: Save and load robot configurations
- **Comprehensive Testing**: Full test suite with 82 test cases

## API Endpoints

- `POST /pcc` - Compute robot kinematics
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `POST /presets` - Save robot presets
- `GET /presets` - Load user presets

## Development

### Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Testing

```bash
# Run all tests
python -m pytest

# Run specific test file
python -m pytest tests/test_pcc.py

# Run with coverage
python -m pytest --cov=app --cov-report=term-missing
```

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

## API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation.
