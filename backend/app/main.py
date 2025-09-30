# FastAPI entry
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.auth_routes import router as auth_router
from app.api.middleware import CORSMiddleware as CustomCORSMiddleware
from app.api.middleware import (
    ErrorHandlingMiddleware,
    LoggingMiddleware,
    RequestIDMiddleware,
)
from app.api.preset_routes import router as preset_router
from app.api.routes import router as pcc_router
from app.api.tendon_routes import router as tendon_router
from app.config import Settings
from app.database import create_db_and_tables

settings = Settings()

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    description="""
    ## Soft Robot Simulation API

    A comprehensive API for soft robot simulation and analysis with unified
    response system.

    ### Features
    - PCC (Piecewise Constant Curvature) robot computation
    - Tendon analysis and actuation calculations
    - User authentication and preset management
    - Real-time 3D visualization data

    ### Response Format
    All API responses follow a consistent format with `success`, `data`,
    `message`, `timestamp`, and `request_id` fields.

    ### Error Handling
    Standardized error responses with proper HTTP status codes and detailed
    error information.

    ### Authentication
    Most endpoints require Bearer token authentication. Register/login to get
    your token.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Add middleware in order (last added is first executed)
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CustomCORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pcc_router)
app.include_router(auth_router)
app.include_router(preset_router)
app.include_router(tendon_router)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    create_db_and_tables()


# Mount static files for frontend
static_dir = "/app/static"
if Path(static_dir).exists():
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")


@app.get("/api")
async def api_root():
    """API root endpoint"""
    return {"message": "Soft Robot API", "version": "1.0.0", "docs": "/docs"}


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Soft Robot App is running"}
