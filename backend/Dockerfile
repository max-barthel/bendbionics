# BendBionics Backend Dockerfile
# FastAPI application with Python 3.11 and uv
# Multi-stage build: builder compiles dependencies, runtime is minimal

# ============================================================================
# Builder Stage: Install dependencies with build tools
# ============================================================================
FROM python:3.11-slim-bookworm AS builder

WORKDIR /app

# Install build dependencies needed for compiling Python packages
# Configure apt to retry on hash mismatches and use simple retry loop
RUN set -e; \
    echo 'Acquire::Retries "3";' > /etc/apt/apt.conf.d/80-retries && \
    echo 'Acquire::http::Timeout "20";' >> /etc/apt/apt.conf.d/80-retries && \
    for i in 1 2 3; do \
        rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/* && \
        apt-get clean && \
        dpkg --configure -a || true; \
        apt-get update && \
        apt-get install -f -y || true; \
        apt-get install -y --no-install-recommends \
        build-essential \
        python3-dev \
        libpq-dev \
        curl && break || \
        (echo "Attempt $i failed, retrying..." && sleep 5); \
    done && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
RUN chmod +x /usr/local/bin/uv

# Copy dependency files
COPY pyproject.toml ./
COPY uv.lock* ./

# Install Python dependencies
RUN if [ -f uv.lock ]; then \
    uv sync --frozen --no-dev; \
    else \
    uv sync --no-dev; \
    fi

# ============================================================================
# Runtime Stage: Minimal image with only runtime dependencies
# ============================================================================
FROM python:3.11-slim-bookworm AS runtime

WORKDIR /app

# Install only runtime dependencies (no build tools)
RUN set -e; \
    echo 'Acquire::Retries "3";' > /etc/apt/apt.conf.d/80-retries && \
    echo 'Acquire::http::Timeout "20";' >> /etc/apt/apt.conf.d/80-retries && \
    for i in 1 2 3; do \
        rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/* && \
        apt-get clean && \
        dpkg --configure -a || true; \
        apt-get update && \
        apt-get install -f -y || true; \
        apt-get install -y --no-install-recommends \
        libpq5 \
        curl && break || \
        (echo "Attempt $i failed, retrying..." && sleep 5); \
    done && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Copy virtual environment from builder (includes compiled extensions)
COPY --from=builder /app/.venv /app/.venv

# Copy uv executable from builder
COPY --from=builder /usr/local/bin/uv /usr/local/bin/uv
RUN chmod +x /usr/local/bin/uv

# Copy application code
COPY app/ ./app/
COPY init_database.py ./
COPY migrate.py ./

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD uv run python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

# Start application with gunicorn
CMD ["uv", "run", "gunicorn", "app.main:app", \
    "--workers", "4", \
    "--worker-class", "uvicorn.workers.UvicornWorker", \
    "--bind", "0.0.0.0:8000", \
    "--timeout", "120", \
    "--keep-alive", "2", \
    "--max-requests", "1000", \
    "--max-requests-jitter", "50", \
    "--access-logfile", "-", \
    "--error-logfile", "-", \
    "--log-level", "info"]
