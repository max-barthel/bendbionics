from unittest.mock import Mock, patch

import numpy as np
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import router


class TestMainRoutes:
    """Test main API routes functionality."""

    def setup_method(self):
        """Setup test client."""
        app = FastAPI()
        app.include_router(router)
        self.client = TestClient(app)

    @patch("app.api.routes.compute_pcc_with_tendons")
    def test_run_pcc_with_tendons_success(self, mock_compute):
        """Test successful PCC computation with tendons."""
        # Mock computation result
        mock_result = {
            "robot_positions": [
                np.array([[1, 2, 3], [4, 5, 6]]),
                np.array([[7, 8, 9], [10, 11, 12]]),
            ],
            "coupling_data": {
                "positions": np.array([[1, 2, 3], [4, 5, 6]]),
                "orientations": np.array([[0, 0, 0], [0, 0, 0]]),
            },
            "tendon_analysis": {
                "routing_points": np.array([[[1, 2, 3], [4, 5, 6]]]),
                "segment_lengths": np.array([[0.1, 0.2], [0.3, 0.4]]),
            },
            "actuation_commands": {
                "tendon_1": 0.1,
                "tendon_2": 0.2,
                "tendon_3": 0.3,
            },
        }
        mock_compute.return_value = mock_result

        # Test data
        params = {
            "bending_angles": [0.1, 0.2],
            "rotation_angles": [0, 0],
            "backbone_lengths": [0.07, 0.07],
            "coupling_lengths": [0.03, 0.03, 0.03],
            "discretization_steps": 10,
            "tendon_config": {
                "num_tendons": 3,
                "tendon_positions": [
                    [0.01, 0],
                    [-0.005, 0.0087],
                    [-0.005, -0.0087],
                ],
            },
        }

        response = self.client.post("/pcc-with-tendons", json=params)

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "result" in data["data"]
        assert "robot_positions" in data["data"]["result"]
        assert "coupling_data" in data["data"]["result"]
        assert "tendon_analysis" in data["data"]["result"]
        assert "actuation_commands" in data["data"]["result"]

    @patch("app.api.routes.compute_pcc_with_tendons")
    def test_run_pcc_with_tendons_error(self, mock_compute):
        """Test PCC computation with tendons error handling."""
        # Mock computation error
        mock_compute.side_effect = Exception("Computation failed")

        # Test data
        params = {
            "bending_angles": [0.1, 0.2],
            "rotation_angles": [0, 0],
            "backbone_lengths": [0.07, 0.07],
            "coupling_lengths": [0.03, 0.03, 0.03],
            "discretization_steps": 10,
            "tendon_config": {
                "num_tendons": 3,
                "tendon_positions": [
                    [0.01, 0],
                    [-0.005, 0.0087],
                    [-0.005, -0.0087],
                ],
            },
        }

        response = self.client.post("/pcc-with-tendons", json=params)

        assert response.status_code == 500
        data = response.json()
        assert "PCC with tendons computation failed" in data["detail"]

    def test_options_pcc_cors(self):
        """Test CORS preflight request handling."""
        response = self.client.options("/pcc")

        assert response.status_code == 200
        headers = response.headers
        assert "Access-Control-Allow-Origin" in headers
        assert "Access-Control-Allow-Methods" in headers
        assert "Access-Control-Allow-Headers" in headers
        assert headers["Access-Control-Allow-Origin"] == "*"
        assert "POST" in headers["Access-Control-Allow-Methods"]
        assert "OPTIONS" in headers["Access-Control-Allow-Methods"]

    def test_convert_result_to_serializable_robot_positions(self):
        """Test conversion of robot positions to serializable format."""
        from app.api.routes import _convert_result_to_serializable

        # Test data with numpy arrays
        result = {
            "robot_positions": [
                np.array([[1, 2, 3], [4, 5, 6]]),
                np.array([[7, 8, 9], [10, 11, 12]]),
            ]
        }

        serializable = _convert_result_to_serializable(result)

        assert "robot_positions" in serializable
        assert isinstance(serializable["robot_positions"], list)
        assert len(serializable["robot_positions"]) == 2
        assert serializable["robot_positions"][0] == [[1, 2, 3], [4, 5, 6]]
        assert serializable["robot_positions"][1] == [[7, 8, 9], [10, 11, 12]]

    def test_convert_result_to_serializable_coupling_data(self):
        """Test conversion of coupling data to serializable format."""
        from app.api.routes import _convert_result_to_serializable

        # Test data with numpy arrays
        result = {
            "coupling_data": {
                "positions": np.array([[1, 2, 3], [4, 5, 6]]),
                "orientations": np.array([[0, 0, 0], [0, 0, 0]]),
            }
        }

        serializable = _convert_result_to_serializable(result)

        assert "coupling_data" in serializable
        assert "positions" in serializable["coupling_data"]
        assert "orientations" in serializable["coupling_data"]
        assert serializable["coupling_data"]["positions"] == [
            [1, 2, 3],
            [4, 5, 6],
        ]
        assert serializable["coupling_data"]["orientations"] == [
            [0, 0, 0],
            [0, 0, 0],
        ]

    def test_convert_result_to_serializable_tendon_analysis(self):
        """Test conversion of tendon analysis to serializable format."""
        from app.api.routes import _convert_result_to_serializable

        # Test data with numpy arrays
        result = {
            "tendon_analysis": {
                "routing_points": np.array([[[1, 2, 3], [4, 5, 6]]]),
                "segment_lengths": np.array([[0.1, 0.2], [0.3, 0.4]]),
            }
        }

        serializable = _convert_result_to_serializable(result)

        assert "tendon_analysis" in serializable
        assert "routing_points" in serializable["tendon_analysis"]
        assert "segment_lengths" in serializable["tendon_analysis"]
        assert serializable["tendon_analysis"]["routing_points"] == [
            [[1, 2, 3], [4, 5, 6]]
        ]
        assert serializable["tendon_analysis"]["segment_lengths"] == [
            [0.1, 0.2],
            [0.3, 0.4],
        ]

    def test_convert_result_to_serializable_other_data(self):
        """Test conversion of other data types to serializable format."""
        from app.api.routes import _convert_result_to_serializable

        # Test data with mixed types
        result = {
            "actuation_commands": {"tendon_1": 0.1, "tendon_2": 0.2},
            "simple_list": [1, 2, 3],
            "simple_dict": {"key": "value"},
            "simple_string": "test",
        }

        serializable = _convert_result_to_serializable(result)

        assert "actuation_commands" in serializable
        assert "simple_list" in serializable
        assert "simple_dict" in serializable
        assert "simple_string" in serializable
        assert serializable["actuation_commands"] == {
            "tendon_1": 0.1,
            "tendon_2": 0.2,
        }
        assert serializable["simple_list"] == [1, 2, 3]
        assert serializable["simple_dict"] == {"key": "value"}
        assert serializable["simple_string"] == "test"

    def test_convert_result_to_serializable_empty_result(self):
        """Test conversion of empty result."""
        from app.api.routes import _convert_result_to_serializable

        result = {}
        serializable = _convert_result_to_serializable(result)
        assert serializable == {}

    def test_convert_result_to_serializable_nested_structures(self):
        """Test conversion of nested structures with numpy arrays."""
        from app.api.routes import _convert_result_to_serializable

        # Test data with nested structures
        result = {"nested_data": {"level1": {"level2": np.array([[1, 2], [3, 4]])}}}

        serializable = _convert_result_to_serializable(result)

        assert "nested_data" in serializable
        assert "level1" in serializable["nested_data"]
        assert "level2" in serializable["nested_data"]["level1"]
        assert np.array_equal(
            serializable["nested_data"]["level1"]["level2"], [[1, 2], [3, 4]]
        )
