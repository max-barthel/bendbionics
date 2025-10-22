# BendBionics API Backend

A FastAPI-based backend for soft robot simulation and control.

## Features

- **PCC Model**: Piecewise Constant Curvature robot simulation
- **Tendon System**: Advanced tendon routing and length calculations
- **Caching**: Intelligent caching for performance optimization
- **Authentication**: JWT-based user authentication
- **Preset Management**: Save and load robot configurations
- **Comprehensive Testing**: Full test suite with 82 test cases

## API Endpoints

- `POST /pcc` - Compute robot kinematics
- `POST /pcc-with-tendons` - Compute robot kinematics with tendon analysis
- `POST /tendons/calculate` - Calculate tendon lengths and actuation
- `POST /tendons/analyze-configuration` - Analyze tendon configuration
- `GET /tendons/configurations` - Get predefined tendon configurations
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

```text
tests/
├── test_api_routes.py      # API endpoint tests
├── test_cache.py          # Caching system tests
├── test_config.py         # Configuration tests
├── test_integration.py    # Full API workflow tests
└── test_pcc.py           # PCC model tests
```

## Tendon System

The backend now includes a **modular tendon calculation system** that works with any robot model implementation. This system:

- **Models cylindrical coupling elements** with tendon routing eyelets
- **Calculates tendon lengths** based on robot position (inverse kinematics)
- **Supports configurable tendon counts** (3-12 tendons) and positions
- **Provides actuation commands** for robot control
- **Works with any robot model** (PCC, advanced physics, ML models, etc.)

### Key Benefits

- **Model-Agnostic**: Works with simple PCC models or complex multi-physics simulations
- **Future-Proof**: Easy to add new robot models without changing tendon code
- **Modular Design**: Clean separation between robot kinematics and tendon calculations

### Documentation

- [TENDON_SYSTEM_README.md](TENDON_SYSTEM_README.md) - Basic tendon system usage
- [MODULAR_ARCHITECTURE_README.md](MODULAR_ARCHITECTURE_README.md) - How to implement new robot models

### Quick Start

```python
from app.models.pcc.pcc_model import compute_pcc_with_tendons
from app.models.pcc.types import PCCParams, TendonConfig

# Create robot with 6 tendons
params = PCCParams(
    bending_angles=[0.5, 0.3],
    rotation_angles=[0.0, 0.0],
    backbone_lengths=[0.1, 0.1],
    coupling_lengths=[0.02, 0.02, 0.02],
    tendon_config=TendonConfig(count=6, radius=0.012)
)

# Calculate tendon requirements
result = compute_pcc_with_tendons(params)
actuation_commands = result['actuation_commands']
```

## API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation.
