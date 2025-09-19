from unittest.mock import patch

from fastapi.testclient import TestClient

from app.api.routes import router
from app.models.pcc.types import PCCParams


class TestAPIRoutes:
    """Test API routes functionality."""

    def setup_method(self):
        """Setup test client."""
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)
        self.client = TestClient(app)

    def test_run_pcc_success(self):
        """Test successful PCC computation."""
        params = PCCParams(
            bending_angles=[0.1, 0.2],
            rotation_angles=[0, 0],
            backbone_lengths=[0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03],
            discretization_steps=5,
        )

        response = self.client.post("/pcc", json=params.model_dump())

        assert response.status_code == 200
        data = response.json()
        assert "segments" in data
        assert isinstance(data["segments"], list)
        assert len(data["segments"]) > 0

    def test_run_pcc_with_rotation(self):
        """Test PCC computation with rotation angles."""
        params = PCCParams(
            bending_angles=[0.1, 0.2],
            rotation_angles=[0.5, 0.3],
            backbone_lengths=[0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03],
            discretization_steps=10,
        )

        response = self.client.post("/pcc", json=params.model_dump())

        assert response.status_code == 200
        data = response.json()
        assert "segments" in data

    def test_run_pcc_single_segment(self):
        """Test PCC computation with single segment."""
        params = PCCParams(
            bending_angles=[0.1],
            rotation_angles=[0],
            backbone_lengths=[0.07],
            coupling_lengths=[0.03, 0.03],
            discretization_steps=5,
        )

        response = self.client.post("/pcc", json=params.model_dump())

        assert response.status_code == 200
        data = response.json()
        assert "segments" in data

    @patch("app.api.routes.compute_pcc")
    def test_run_pcc_computation_error(self, mock_compute_pcc):
        """Test PCC computation when computation fails."""
        mock_compute_pcc.side_effect = Exception("Computation error")

        params = PCCParams(
            bending_angles=[0.1, 0.2],
            rotation_angles=[0, 0],
            backbone_lengths=[0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03],
            discretization_steps=5,
        )

        response = self.client.post("/pcc", json=params.model_dump())

        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert data["detail"] == "Computation failed"

    def test_options_pcc(self):
        """Test OPTIONS endpoint for CORS."""
        response = self.client.options("/pcc")

        assert response.status_code == 200
        headers = response.headers
        assert "Access-Control-Allow-Origin" in headers
        assert "Access-Control-Allow-Methods" in headers
        assert "Access-Control-Allow-Headers" in headers
        assert headers["Access-Control-Allow-Origin"] == "*"

    def test_run_pcc_invalid_params(self):
        """Test PCC computation with invalid parameters."""
        # Test with missing required fields
        invalid_params = {
            "bending_angles": [0.1],
            "rotation_angles": [0],
            # Missing other required fields
        }

        response = self.client.post("/pcc", json=invalid_params)

        # Should return validation error
        assert response.status_code == 422

    def test_run_pcc_empty_arrays(self):
        """Test PCC computation with empty arrays (should fail validation)."""
        invalid_params = {
            "bending_angles": [],
            "rotation_angles": [],
            "backbone_lengths": [],
            "coupling_lengths": [],
            "discretization_steps": 5,
        }

        response = self.client.post("/pcc", json=invalid_params)

        # Should return validation error
        assert response.status_code == 422

    def test_run_pcc_invalid_discretization(self):
        """Test PCC computation with invalid discretization steps."""
        invalid_params = {
            "bending_angles": [0.1],
            "rotation_angles": [0],
            "backbone_lengths": [0.07],
            "coupling_lengths": [0.03, 0.03],
            "discretization_steps": 0,  # Invalid: must be positive
        }

        response = self.client.post("/pcc", json=invalid_params)

        # Should return validation error
        assert response.status_code == 422

    def test_run_pcc_high_discretization(self):
        """Test PCC computation with high discretization."""
        params = PCCParams(
            bending_angles=[0.1, 0.2],
            rotation_angles=[0, 0],
            backbone_lengths=[0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03],
            discretization_steps=100,
        )

        response = self.client.post("/pcc", json=params.model_dump())

        assert response.status_code == 200
        data = response.json()
        assert "segments" in data

    @patch("app.api.routes.logger")
    def test_run_pcc_logs_error(self, mock_logger):
        """Test that errors are logged."""
        with patch("app.api.routes.compute_pcc") as mock_compute_pcc:
            mock_compute_pcc.side_effect = Exception("Test error")

            params = PCCParams(
                bending_angles=[0.1],
                rotation_angles=[0],
                backbone_lengths=[0.07],
                coupling_lengths=[0.03, 0.03],
                discretization_steps=5,
            )

            response = self.client.post("/pcc", json=params.model_dump())

            assert response.status_code == 500
            mock_logger.error.assert_called_once()
            error_message = mock_logger.error.call_args[0][0]
            assert "PCC computation failed" in error_message
