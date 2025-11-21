#!/bin/bash
# BendBionics Backend Startup Script
# This script ensures proper startup of the backend service

# Don't use set -e here as we want to handle errors gracefully

# Configuration
BACKEND_DIR="/var/www/bendbionics-app/backend"
VENV_DIR="$BACKEND_DIR/.venv"  # uv uses .venv by default
FALLBACK_VENV_DIR="$BACKEND_DIR/venv"  # fallback for legacy setups
ENV_FILE="$BACKEND_DIR/.env.production"

# Function to print status
print_status() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to print error
print_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_status "Starting BendBionics Backend Service"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    print_error "Backend directory not found: $BACKEND_DIR"
    exit 1
fi

# Check if virtual environment exists (try .venv first, then venv)
if [ ! -d "$VENV_DIR" ] && [ ! -d "$FALLBACK_VENV_DIR" ]; then
    print_error "Virtual environment not found: $VENV_DIR or $FALLBACK_VENV_DIR"
    exit 1
fi

# Use .venv if available, otherwise fall back to venv
if [ -d "$VENV_DIR" ]; then
    VENV_DIR="$VENV_DIR"
elif [ -d "$FALLBACK_VENV_DIR" ]; then
    VENV_DIR="$FALLBACK_VENV_DIR"
fi

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    print_error "Environment file not found: $ENV_FILE"
    exit 1
fi

# Check if gunicorn is available
if ! command_exists gunicorn; then
    print_error "Gunicorn not found in virtual environment"
    exit 1
fi

# Load environment variables
print_status "Loading environment variables from $ENV_FILE"
set -a
source "$ENV_FILE"
set +a

# Change to backend directory
cd "$BACKEND_DIR"

# Activate virtual environment
print_status "Activating virtual environment"
source "$VENV_DIR/bin/activate"

# Test database connection (non-blocking)
print_status "Testing database connection"
python -c "
import sys
sys.path.insert(0, '.')
try:
    from app.database import engine
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
    print('Database connection successful')
except Exception as e:
    print(f'Database connection failed: {e}')
    print('Continuing with startup - database will be connected when needed')
" || print_status "Database test completed with warnings"

# Start the application
print_status "Starting Gunicorn server"
exec gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 \
    --timeout 120 \
    --keep-alive 2 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
