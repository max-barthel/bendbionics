# FastAPI entry
import os

from app.api.auth_routes import router as auth_router
from app.api.preset_routes import router as preset_router
from app.api.routes import router as pcc_router
from app.config import Settings
from app.database import create_db_and_tables
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

settings = Settings()

app = FastAPI(title=settings.app_name, debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pcc_router)
app.include_router(auth_router)
app.include_router(preset_router)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    create_db_and_tables()


# Mount static files for frontend
static_dir = "/app/static"
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")


@app.get("/api")
async def api_root():
    """API root endpoint"""
    return {"message": "Soft Robot API", "version": "1.0.0", "docs": "/docs"}


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Soft Robot App is running"}
