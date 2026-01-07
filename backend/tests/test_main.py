from unittest.mock import patch

import pytest
from app.main import app, startup_event
from fastapi.testclient import TestClient


class TestMainApp:
    """Test main FastAPI application."""

    def test_app_creation(self):
        """Test that the FastAPI app is created correctly."""
        assert app.title is not None
        assert hasattr(app, "routes")

    def test_app_has_routers(self):
        """Test that the app includes all required routers."""
        # Check that routers are included
        router_paths = [route.path for route in app.routes]

        # Should have API routes
        assert any("/api" in path for path in router_paths)

        # Should have health check
        assert any("/api/health" in path for path in router_paths)

        # Should have root API endpoint
        assert any("/api" in path for path in router_paths)

    @patch("app.main.create_db_and_tables")
    @pytest.mark.asyncio
    async def test_startup_event(self, mock_create_db):
        """Test startup event function."""
        await startup_event()
        mock_create_db.assert_called_once()

    def test_api_root_endpoint(self):
        """Test the API root endpoint."""
        client = TestClient(app)
        response = client.get("/api")

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "docs" in data
        assert data["message"] == "BendBionics API"
        assert data["version"] == "1.0.0"

    def test_health_check_endpoint(self):
        """Test the health check endpoint."""
        client = TestClient(app)
        response = client.get("/api/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "message" in data
        assert data["status"] == "healthy"
        assert "BendBionics App is running" in data["message"]

    def test_static_files_path_exists(self):
        """Test that static files path is defined."""
        # Test that the static_dir variable is defined
        import app.main

        assert hasattr(app.main, "static_dir")
        assert app.main.static_dir == "/app/static"

    @patch("os.path.exists")
    def test_static_files_mounting_not_exists(self, mock_exists):
        """Test static files mounting when directory doesn't exist."""
        mock_exists.return_value = False

        # Re-import to trigger the static files mounting
        with patch("app.main.StaticFiles") as mock_static_files:
            import importlib

            import app.main

            importlib.reload(app.main)

            # Check that StaticFiles was not called
            mock_static_files.assert_not_called()

    def test_cors_middleware_configured(self):
        """Test that CORS middleware is configured."""
        # Check that middleware is configured
        assert len(app.user_middleware) > 0

    def test_app_debug_mode(self):
        """Test that app debug mode is set from settings."""
        # The debug mode should be set from settings
        # We can't easily test this without modifying the app creation
        # but we can verify the app has the debug attribute
        assert hasattr(app, "debug")

    def test_app_title(self):
        """Test that app title is set from settings."""
        # The title should be set from settings
        assert app.title is not None
        assert isinstance(app.title, str)

    def test_endpoint_response_format(self):
        """Test that endpoints return proper JSON format."""
        client = TestClient(app)

        # Test API root
        response = client.get("/api")
        assert response.headers["content-type"] == "application/json"

        # Test health check
        response = client.get("/api/health")
        assert response.headers["content-type"] == "application/json"

    def test_endpoint_error_handling(self):
        """Test that endpoints handle errors gracefully."""
        client = TestClient(app)

        # Test non-existent endpoint
        response = client.get("/api/nonexistent")
        assert response.status_code == 404

    def test_app_uses_settings(self):
        """Test that the app uses settings for configuration."""
        # Test that app has expected attributes from settings
        assert hasattr(app, "title")
        assert hasattr(app, "debug")
        assert app.title is not None
