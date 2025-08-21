#!/usr/bin/env python3
"""
Railway startup script for the Soft Robot API
Handles port configuration and environment setup for Railway deployment
"""

import os

import uvicorn

if __name__ == "__main__":
    # Railway provides PORT environment variable
    port = int(os.environ.get("PORT", 8000))

    # Get host from environment or default to 0.0.0.0 for Railway
    host = os.environ.get("HOST", "0.0.0.0")

    print(f"Starting Soft Robot API on {host}:{port}")

    # Start the FastAPI application
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=False,  # Disable reload in production
        log_level="info",
    )
