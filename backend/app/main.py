# FastAPI entry
from app.api.auth_routes import router as auth_router
from app.api.preset_routes import router as preset_router
from app.api.routes import router as pcc_router
from app.config import Settings
from app.database import create_db_and_tables
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

settings = Settings()

app = FastAPI(title=settings.app_name, debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
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


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Soft Robot API", "version": "1.0.0", "docs": "/docs"}
