from unittest.mock import patch

from app.api.routes import router
from app.models.pcc.types import PCCParams
from fastapi.testclient import TestClient


class TestAPIRoutes:
    """Test API routes functionality."""

    def setup_method(self):
        """Setup test client."""
        from app.api.middleware import CORSMiddleware, ErrorHandlingMiddleware
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)
        # Add error handling middleware to catch exceptions
        app.add_middleware(ErrorHandlingMiddleware)
        # Add CORS middleware for OPTIONS request testing
        # Use ["*"] to match test expectations
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["*"],
        )
        self.client = TestClient(app)

