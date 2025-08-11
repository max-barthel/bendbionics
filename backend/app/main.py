# FastAPI entry
from app.api.routes import router as pcc_router
from app.config import Settings
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

app.include_router(pcc_router)
