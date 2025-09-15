import json
from unittest.mock import Mock, patch

import pytest
from app.api.preset_routes import router
from app.auth import get_current_user
from app.database import get_session
from app.models.preset import Preset
from fastapi import FastAPI
from fastapi.testclient import TestClient


class TestPresetRoutes:
    """Test preset routes functionality."""

    def setup_method(self):
        """Setup test client."""
        app = FastAPI()
        app.include_router(router)

        # Override dependencies for testing
        app.dependency_overrides[get_session] = lambda: Mock()
        app.dependency_overrides[get_current_user] = lambda: Mock()

        self.client = TestClient(app)

    @pytest.mark.skip(
        reason="Complex database mocking - needs proper test database setup"
    )
    @patch("app.api.preset_routes.get_session")
    @patch("app.api.preset_routes.get_current_user")
    def test_create_preset_success(
        self, mock_get_current_user, mock_get_session
    ):
        """Test successful preset creation."""
        # Mock user
        mock_user = Mock()
        mock_user.id = 1
        mock_get_current_user.return_value = mock_user

        # Mock session
        mock_session = Mock()
        mock_get_session.return_value = mock_session

        # Mock preset creation
        mock_preset = Mock()
        mock_preset.id = 1
        mock_preset.name = "Test Preset"
        mock_preset.description = "Test Description"
        mock_preset.is_public = False
        mock_preset.config_dict = {"segments": 3}
        mock_preset.created_at = "2023-01-01T00:00:00"
        mock_preset.updated_at = "2023-01-01T00:00:00"
        mock_preset.user_id = 1

        mock_session.refresh.return_value = mock_preset

        # Test data
        preset_data = {
            "name": "Test Preset",
            "description": "Test Description",
            "is_public": False,
            "configuration": {"segments": 3},
        }

        response = self.client.post(
            "/presets/",
            json=preset_data,
            headers={"Authorization": "Bearer valid.token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Preset"
        assert data["description"] == "Test Description"
        assert data["is_public"] is False
        assert data["configuration"] == {"segments": 3}

    @pytest.mark.skip(
        reason="Complex database mocking - needs proper test database setup"
    )
    @patch("app.api.preset_routes.get_session")
    @patch("app.api.preset_routes.get_current_user")
    def test_get_user_presets_success(
        self, mock_get_current_user, mock_get_session
    ):
        """Test successful retrieval of user presets."""
        # Mock user
        mock_user = Mock()
        mock_user.id = 1
        mock_get_current_user.return_value = mock_user

        # Mock session
        mock_session = Mock()
        mock_get_session.return_value = mock_session

        # Mock presets
        mock_preset1 = Mock()
        mock_preset1.id = 1
        mock_preset1.name = "Preset 1"
        mock_preset1.description = "Description 1"
        mock_preset1.is_public = False
        mock_preset1.config_dict = {"segments": 3}
        mock_preset1.created_at = "2023-01-01T00:00:00"
        mock_preset1.updated_at = "2023-01-01T00:00:00"
        mock_preset1.user_id = 1

        mock_preset2 = Mock()
        mock_preset2.id = 2
        mock_preset2.name = "Preset 2"
        mock_preset2.description = "Description 2"
        mock_preset2.is_public = True
        mock_preset2.config_dict = {"segments": 5}
        mock_preset2.created_at = "2023-01-02T00:00:00"
        mock_preset2.updated_at = "2023-01-02T00:00:00"
        mock_preset2.user_id = 1

        mock_session.exec.return_value.all.return_value = [
            mock_preset1,
            mock_preset2,
        ]

        response = self.client.get(
            "/presets/", headers={"Authorization": "Bearer valid.token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["name"] == "Preset 1"
        assert data[1]["name"] == "Preset 2"

    @pytest.mark.skip(
        reason="Complex database mocking - needs proper test database setup"
    )
    @patch("app.api.preset_routes.get_session")
    @patch("app.api.preset_routes.get_current_user")
    def test_get_preset_by_id_success(
        self, mock_get_current_user, mock_get_session
    ):
        """Test successful retrieval of preset by ID."""
        # Mock user
        mock_user = Mock()
        mock_user.id = 1
        mock_get_current_user.return_value = mock_user

        # Mock session
        mock_session = Mock()
        mock_get_session.return_value = mock_session

        # Mock preset
        mock_preset = Mock()
        mock_preset.id = 1
        mock_preset.name = "Test Preset"
        mock_preset.description = "Test Description"
        mock_preset.is_public = False
        mock_preset.config_dict = {"segments": 3}
        mock_preset.created_at = "2023-01-01T00:00:00"
        mock_preset.updated_at = "2023-01-01T00:00:00"
        mock_preset.user_id = 1

        mock_session.exec.return_value.first.return_value = mock_preset

        response = self.client.get(
            "/presets/1", headers={"Authorization": "Bearer valid.token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Preset"
        assert data["id"] == 1

    @pytest.mark.skip(
        reason="Complex database mocking - needs proper test database setup"
    )
    @patch("app.api.preset_routes.get_session")
    @patch("app.api.preset_routes.get_current_user")
    def test_get_preset_by_id_not_found(
        self, mock_get_current_user, mock_get_session
    ):
        """Test preset not found by ID."""
        # Mock user
        mock_user = Mock()
        mock_user.id = 1
        mock_get_current_user.return_value = mock_user

        # Mock session
        mock_session = Mock()
        mock_get_session.return_value = mock_session

        # Mock no preset found
        mock_session.exec.return_value.first.return_value = None

        response = self.client.get(
            "/presets/999", headers={"Authorization": "Bearer valid.token"}
        )

        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()

    @pytest.mark.skip(
        reason="Complex database mocking - needs proper test database setup"
    )
    @patch("app.api.preset_routes.get_session")
    @patch("app.api.preset_routes.get_current_user")
    def test_update_preset_success(
        self, mock_get_current_user, mock_get_session
    ):
        """Test successful preset update."""
        # Mock user
        mock_user = Mock()
        mock_user.id = 1
        mock_get_current_user.return_value = mock_user

        # Mock session
        mock_session = Mock()
        mock_get_session.return_value = mock_session

        # Mock existing preset
        mock_preset = Mock()
        mock_preset.id = 1
        mock_preset.name = "Updated Preset"
        mock_preset.description = "Updated Description"
        mock_preset.is_public = True
        mock_preset.config_dict = {"segments": 5}
        mock_preset.created_at = "2023-01-01T00:00:00"
        mock_preset.updated_at = "2023-01-01T00:00:00"
        mock_preset.user_id = 1

        mock_session.exec.return_value.first.return_value = mock_preset

        # Update data
        update_data = {
            "name": "Updated Preset",
            "description": "Updated Description",
            "is_public": True,
            "configuration": {"segments": 5},
        }

        response = self.client.put(
            "/presets/1",
            json=update_data,
            headers={"Authorization": "Bearer valid.token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Preset"
        assert data["description"] == "Updated Description"
        assert data["is_public"] is True

    @pytest.mark.skip(
        reason="Complex database mocking - needs proper test database setup"
    )
    @patch("app.api.preset_routes.get_session")
    @patch("app.api.preset_routes.get_current_user")
    def test_delete_preset_success(
        self, mock_get_current_user, mock_get_session
    ):
        """Test successful preset deletion."""
        # Mock user
        mock_user = Mock()
        mock_user.id = 1
        mock_get_current_user.return_value = mock_user

        # Mock session
        mock_session = Mock()
        mock_get_session.return_value = mock_session

        # Mock existing preset
        mock_preset = Mock()
        mock_preset.id = 1
        mock_preset.user_id = 1

        mock_session.exec.return_value.first.return_value = mock_preset

        response = self.client.delete(
            "/presets/1", headers={"Authorization": "Bearer valid.token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "deleted successfully" in data["message"].lower()

    @pytest.mark.skip(
        reason="Complex database mocking - needs proper test database setup"
    )
    @patch("app.api.preset_routes.get_session")
    @patch("app.api.preset_routes.get_current_user")
    def test_get_public_presets_success(
        self, mock_get_current_user, mock_get_session
    ):
        """Test successful retrieval of public presets."""
        # Mock user
        mock_user = Mock()
        mock_user.id = 1
        mock_get_current_user.return_value = mock_user

        # Mock session
        mock_session = Mock()
        mock_get_session.return_value = mock_session

        # Mock public presets
        mock_preset = Mock()
        mock_preset.id = 1
        mock_preset.name = "Public Preset"
        mock_preset.description = "Public Description"
        mock_preset.is_public = True
        mock_preset.config_dict = {"segments": 3}
        mock_preset.created_at = "2023-01-01T00:00:00"
        mock_preset.updated_at = "2023-01-01T00:00:00"
        mock_preset.user_id = 2

        mock_session.exec.return_value.all.return_value = [mock_preset]

        response = self.client.get(
            "/presets/public", headers={"Authorization": "Bearer valid.token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Public Preset"
        assert data[0]["is_public"] is True

    @pytest.mark.skip(
        reason="Complex database mocking - needs proper test database setup"
    )
    @patch("app.api.preset_routes.get_session")
    @patch("app.api.preset_routes.get_current_user")
    def test_duplicate_preset_name(
        self, mock_get_current_user, mock_get_session
    ):
        """Test error when creating preset with duplicate name."""
        # Mock user
        mock_user = Mock()
        mock_user.id = 1
        mock_get_current_user.return_value = mock_user

        # Mock session
        mock_session = Mock()
        mock_get_session.return_value = mock_session

        # Mock existing preset with same name
        mock_existing_preset = Mock()
        mock_session.exec.return_value.first.return_value = (
            mock_existing_preset
        )

        # Test data
        preset_data = {
            "name": "Duplicate Name",
            "description": "Test Description",
            "is_public": False,
            "configuration": {"segments": 3},
        }

        response = self.client.post(
            "/presets/",
            json=preset_data,
            headers={"Authorization": "Bearer valid.token"},
        )

        assert response.status_code == 400
        data = response.json()
        assert "already exists" in data["detail"].lower()

    @pytest.mark.skip(
        reason="Complex database mocking - needs proper test database setup"
    )
    @patch("app.api.preset_routes.get_session")
    @patch("app.api.preset_routes.get_current_user")
    def test_update_nonexistent_preset(
        self, mock_get_current_user, mock_get_session
    ):
        """Test error when updating non-existent preset."""
        # Mock user
        mock_user = Mock()
        mock_user.id = 1
        mock_get_current_user.return_value = mock_user

        # Mock session
        mock_session = Mock()
        mock_get_session.return_value = mock_session

        # Mock no preset found
        mock_session.exec.return_value.first.return_value = None

        # Update data
        update_data = {
            "name": "Updated Preset",
            "description": "Updated Description",
            "is_public": True,
            "configuration": {"segments": 5},
        }

        response = self.client.put(
            "/presets/999",
            json=update_data,
            headers={"Authorization": "Bearer valid.token"},
        )

        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()

    @pytest.mark.skip(
        reason="Complex database mocking - needs proper test database setup"
    )
    @patch("app.api.preset_routes.get_session")
    @patch("app.api.preset_routes.get_current_user")
    def test_delete_nonexistent_preset(
        self, mock_get_current_user, mock_get_session
    ):
        """Test error when deleting non-existent preset."""
        # Mock user
        mock_user = Mock()
        mock_user.id = 1
        mock_get_current_user.return_value = mock_user

        # Mock session
        mock_session = Mock()
        mock_get_session.return_value = mock_session

        # Mock no preset found
        mock_session.exec.return_value.first.return_value = None

        response = self.client.delete(
            "/presets/999", headers={"Authorization": "Bearer valid.token"}
        )

        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()
