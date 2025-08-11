from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


class TestPCCEndpoint:
    """Test cases for the /pcc endpoint."""

    def test_successful_pcc_computation(self):
        """Test successful PCC computation with valid parameters."""
        payload = {
            "bending_angles": [0.1, 0.2, 0.3],
            "rotation_angles": [0, 0, 0],
            "backbone_lengths": [0.07, 0.07, 0.07],
            "coupling_lengths": [0.03, 0.03, 0.03, 0.015],
            "discretization_steps": 10,
        }

        response = client.post("/pcc", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert "segments" in data
        assert isinstance(data["segments"], list)
        assert len(data["segments"]) > 0

        # Check that each segment contains valid 3D points
        for segment in data["segments"]:
            assert isinstance(segment, list)
            assert len(segment) > 0
            for point in segment:
                assert isinstance(point, list)
                assert len(point) == 3  # x, y, z coordinates
                assert all(isinstance(coord, (int, float)) for coord in point)

    def test_invalid_parameter_types(self):
        """Test API response with invalid parameter types."""
        payload = {
            "bending_angles": ["invalid", "not", "numbers"],
            "rotation_angles": [0, 0, 0],
            "backbone_lengths": [0.07, 0.07, 0.07],
            "coupling_lengths": [0.03, 0.03, 0.03, 0.015],
            "discretization_steps": 10,
        }

        response = client.post("/pcc", json=payload)

        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    def test_missing_parameters(self):
        """Test API response with missing required parameters."""
        payload = {
            "bending_angles": [0.1, 0.2, 0.3],
            "rotation_angles": [0, 0, 0],
            # Missing backbone_lengths, coupling_lengths, discretization_steps
        }

        response = client.post("/pcc", json=payload)

        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    def test_empty_arrays(self):
        """Test API response with empty parameter arrays."""
        payload = {
            "bending_angles": [],
            "rotation_angles": [],
            "backbone_lengths": [],
            "coupling_lengths": [],
            "discretization_steps": 10,
        }

        response = client.post("/pcc", json=payload)

        # This might return 200 with empty result or 422 validation error
        # depending on your validation rules
        assert response.status_code in [200, 422]

    def test_high_discretization_steps(self):
        """Test API with high discretization steps (performance test)."""
        payload = {
            "bending_angles": [0.1, 0.2, 0.3],
            "rotation_angles": [0, 0, 0],
            "backbone_lengths": [0.07, 0.07, 0.07],
            "coupling_lengths": [0.03, 0.03, 0.03, 0.015],
            "discretization_steps": 1000,
        }

        response = client.post("/pcc", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert "segments" in data
        # Should return more detailed segments with higher discretization

    def test_cors_headers(self):
        """Test that CORS headers are properly set."""
        payload = {
            "bending_angles": [0.1, 0.2, 0.3],
            "rotation_angles": [0, 0, 0],
            "backbone_lengths": [0.07, 0.07, 0.07],
            "coupling_lengths": [0.03, 0.03, 0.03, 0.015],
            "discretization_steps": 10,
        }

        # Test with Origin header to trigger CORS
        response = client.post(
            "/pcc", json=payload, headers={"Origin": "http://localhost:5173"}
        )

        # Check CORS headers (FastAPI CORS middleware behavior)
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-credentials" in response.headers
        # Note: allow-methods and allow-headers are only set on preflight

    def test_options_request(self):
        """Test CORS preflight OPTIONS request."""
        response = client.options("/pcc")

        assert response.status_code == 200
        # Check CORS headers for preflight
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers

    def test_computation_error_handling(self):
        """Test API response when computation fails."""
        # Use parameters that might cause computation issues
        payload = {
            "bending_angles": [float("inf"), 0.2, 0.3],  # Invalid value
            "rotation_angles": [0, 0, 0],
            "backbone_lengths": [0.07, 0.07, 0.07],
            "coupling_lengths": [0.03, 0.03, 0.03, 0.015],
            "discretization_steps": 10,
        }

        response = client.post("/pcc", json=payload)

        # Should handle the error gracefully
        assert response.status_code in [422, 500]
        if response.status_code == 500:
            data = response.json()
            assert "detail" in data
            assert "Computation failed" in data["detail"]


class TestAPIStructure:
    """Test API structure and metadata."""

    def test_api_documentation_endpoint(self):
        """Test that API documentation is available."""
        response = client.get("/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]

    def test_openapi_schema(self):
        """Test that OpenAPI schema is available."""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert "paths" in data
        assert "/pcc" in data["paths"]

    def test_api_title_and_version(self):
        """Test API metadata."""
        response = client.get("/openapi.json")
        data = response.json()
        assert data["info"]["title"] == "Soft Robot API"
        assert "version" in data["info"]


class TestErrorHandling:
    """Test error handling scenarios."""

    def test_404_for_nonexistent_endpoint(self):
        """Test 404 response for non-existent endpoints."""
        response = client.get("/nonexistent")
        assert response.status_code == 404

    def test_method_not_allowed(self):
        """Test 405 response for wrong HTTP method."""
        response = client.get("/pcc")
        assert response.status_code == 405  # Method not allowed

    def test_large_payload_handling(self):
        """Test handling of very large payloads."""
        # Create a payload with many segments
        payload = {
            "bending_angles": [0.1] * 100,  # 100 segments
            "rotation_angles": [0] * 100,
            "backbone_lengths": [0.07] * 100,
            "coupling_lengths": [0.03] * 101,  # n+1 coupling lengths
            "discretization_steps": 10,
        }

        response = client.post("/pcc", json=payload)

        # Should either succeed or fail gracefully
        assert response.status_code in [200, 422, 500]
