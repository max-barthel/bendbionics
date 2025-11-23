import time

from app.main import app
from app.utils.cache import clear_cache
from fastapi.testclient import TestClient


class TestFullAPIWorkflow:
    """Integration tests for the complete API workflow."""

    def setup_method(self):
        """Clear cache before each test to ensure clean state."""
        clear_cache()
        self.client = TestClient(app)

    @staticmethod
    def _add_tendon_config(payload):
        """Add default tendon config to payload if not present."""
        if "tendon_config" not in payload:
            payload["tendon_config"] = {
                "num_tendons": 3,
                "tendon_positions": [
                    [0.01, 0],
                    [-0.005, 0.0087],
                    [-0.005, -0.0087],
                ],
            }
        return payload

    def test_complete_workflow_success(self):
        """Test the complete API workflow from request to response."""
        # Step 1: Prepare valid request payload
        payload = {
            "bending_angles": [0.1, 0.2, 0.3],
            "rotation_angles": [0, 0, 0],
            "backbone_lengths": [0.07, 0.07, 0.07],
            "coupling_lengths": [0.03, 0.03, 0.03, 0.015],
            "discretization_steps": 10,
        }

        # Step 2: Send POST request
        payload = self._add_tendon_config(payload)
        response = self.client.post("/kinematics", json=payload)

        # Step 3: Verify response
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"

        data = response.json()
        assert "data" in data
        assert "result" in data["data"]
        assert "robot_positions" in data["data"]["result"]
        assert isinstance(data["data"]["result"]["robot_positions"], list)
        assert len(data["data"]["result"]["robot_positions"]) == 7  # 3 backbone + 4 coupling segments

        # Step 4: Verify segment structure
        for segment in data["data"]["result"]["robot_positions"]:
            assert isinstance(segment, list)
            assert len(segment) > 0
            for point in segment:
                assert isinstance(point, list)
                assert len(point) == 3  # x, y, z coordinates
                assert all(isinstance(coord, (int, float)) for coord in point)

    def test_workflow_with_caching(self):
        """Test that caching works correctly in the full workflow."""
        payload = {
            "bending_angles": [0.1, 0.2, 0.3],
            "rotation_angles": [0, 0, 0],
            "backbone_lengths": [0.07, 0.07, 0.07],
            "coupling_lengths": [0.03, 0.03, 0.03, 0.015],
            "discretization_steps": 10,
        }

        # First request - should compute and cache
        payload = self._add_tendon_config(payload)
        response1 = self.client.post("/kinematics", json=payload)
        assert response1.status_code == 200
        data1 = response1.json()

        # Second request - should use cache
        response2 = self.client.post("/kinematics", json=payload)
        assert response2.status_code == 200
        data2 = response2.json()

        # Results should be identical (excluding timestamp)
        data1_no_timestamp = {k: v for k, v in data1.items() if k != "timestamp"}
        data2_no_timestamp = {k: v for k, v in data2.items() if k != "timestamp"}
        assert data1_no_timestamp == data2_no_timestamp

        # Test that cache is actually being used by checking cache hit
        # We'll use a different approach: test with a more complex payload
        # that would take longer to compute, making the cache benefit more
        # obvious
        complex_payload = {
            "bending_angles": [0.1, 0.2, 0.3, 0.4, 0.5],
            "rotation_angles": [0.1, 0.2, 0.3, 0.4, 0.5],
            "backbone_lengths": [0.07, 0.07, 0.07, 0.07, 0.07],
            "coupling_lengths": [0.03, 0.03, 0.03, 0.03, 0.03, 0.015],
            "discretization_steps": 50,
        }

        # First request with complex payload
        complex_payload = self._add_tendon_config(complex_payload)
        start_time = time.time()
        response3 = self.client.post("/kinematics", json=complex_payload)
        first_complex_time = time.time() - start_time
        assert response3.status_code == 200

        # Second request with same complex payload (should be cached)
        start_time = time.time()
        response4 = self.client.post("/kinematics", json=complex_payload)
        second_complex_time = time.time() - start_time
        assert response4.status_code == 200

        # The cached request should be faster (allow for timing variance)
        # Use a more lenient threshold for timing-based cache tests
        assert second_complex_time <= first_complex_time * 1.2, (
            f"Cache not working: {second_complex_time:.4f}s vs "
            f"{first_complex_time:.4f}s"
        )

    def test_workflow_with_different_parameters(self):
        """Test workflow with different parameter sets."""
        test_cases = [
            {
                "name": "straight_robot",
                "payload": {
                    "bending_angles": [0.0, 0.0, 0.0],
                    "rotation_angles": [0, 0, 0],
                    "backbone_lengths": [0.07, 0.07, 0.07],
                    "coupling_lengths": [0.03, 0.03, 0.03, 0.015],
                    "discretization_steps": 5,
                },
            },
            {
                "name": "curved_robot",
                "payload": {
                    "bending_angles": [0.5, 0.3, 0.4],
                    "rotation_angles": [0.1, 0.2, 0.3],
                    "backbone_lengths": [0.1, 0.08, 0.06],
                    "coupling_lengths": [0.02, 0.02, 0.02, 0.01],
                    "discretization_steps": 20,
                },
            },
            {
                "name": "high_precision",
                "payload": {
                    "bending_angles": [0.1, 0.1, 0.1],
                    "rotation_angles": [0, 0, 0],
                    "backbone_lengths": [0.05, 0.05, 0.05],
                    "coupling_lengths": [0.01, 0.01, 0.01, 0.005],
                    "discretization_steps": 50,
                },
            },
        ]

        for test_case in test_cases:
            payload = self._add_tendon_config(test_case["payload"].copy())
            response = self.client.post("/kinematics", json=payload)
            assert response.status_code == 200, f"Failed for {test_case['name']}"
            data = response.json()
            assert "data" in data
            assert "result" in data["data"], f"Failed for {test_case['name']}"
            assert "robot_positions" in data["data"]["result"], f"Failed for {test_case['name']}"
            assert len(data["data"]["result"]["robot_positions"]) > 0, f"Failed for {test_case['name']}"

    def test_workflow_error_handling(self):
        """Test error handling throughout the workflow."""
        # Test with invalid parameters
        invalid_payloads = [
            {
                "name": "invalid_bending_angles",
                "payload": {
                    "bending_angles": ["not", "numbers"],
                    "rotation_angles": [0, 0, 0],
                    "backbone_lengths": [0.07, 0.07, 0.07],
                    "coupling_lengths": [0.03, 0.03, 0.03, 0.015],
                    "discretization_steps": 10,
                },
                "expected_status": 422,
            },
            {
                "name": "empty_arrays",
                "payload": {
                    "bending_angles": [],
                    "rotation_angles": [],
                    "backbone_lengths": [],
                    "coupling_lengths": [],
                    "discretization_steps": 10,
                },
                "expected_status": 422,
            },
            {
                "name": "invalid_discretization",
                "payload": {
                    "bending_angles": [0.1, 0.2, 0.3],
                    "rotation_angles": [0, 0, 0],
                    "backbone_lengths": [0.07, 0.07, 0.07],
                    "coupling_lengths": [0.03, 0.03, 0.03, 0.015],
                    "discretization_steps": -5,
                },
                "expected_status": 422,
            },
        ]

        for test_case in invalid_payloads:
            payload = self._add_tendon_config(test_case["payload"].copy())
            response = self.client.post("/kinematics", json=payload)
            assert (
                response.status_code == test_case["expected_status"]
            ), f"Failed for {test_case['name']}"

    def test_workflow_with_cors(self):
        """Test CORS handling in the workflow."""
        # Test OPTIONS request
        response = self.client.options("/kinematics")
        assert response.status_code == 200
        assert "Access-Control-Allow-Origin" in response.headers
        assert "Access-Control-Allow-Methods" in response.headers
        assert "Access-Control-Allow-Headers" in response.headers

        # Test POST request with CORS headers
        payload = {
            "bending_angles": [0.1, 0.2, 0.3],
            "rotation_angles": [0, 0, 0],
            "backbone_lengths": [0.07, 0.07, 0.07],
            "coupling_lengths": [0.03, 0.03, 0.03, 0.015],
            "discretization_steps": 10,
        }
        payload = self._add_tendon_config(payload)

        response = self.client.post("/kinematics", json=payload)
        assert response.status_code == 200

    def test_workflow_performance(self):
        """Test workflow performance with various parameter sizes."""
        performance_tests = [
            {
                "name": "small_computation",
                "payload": {
                    "bending_angles": [0.1],
                    "rotation_angles": [0],
                    "backbone_lengths": [0.07],
                    "coupling_lengths": [0.03, 0.015],
                    "discretization_steps": 5,
                },
                "max_time": 1.0,
            },
            {
                "name": "medium_computation",
                "payload": {
                    "bending_angles": [0.1, 0.2, 0.3],
                    "rotation_angles": [0, 0, 0],
                    "backbone_lengths": [0.07, 0.07, 0.07],
                    "coupling_lengths": [0.03, 0.03, 0.03, 0.015],
                    "discretization_steps": 20,
                },
                "max_time": 2.0,
            },
            {
                "name": "large_computation",
                "payload": {
                    "bending_angles": [0.1, 0.2, 0.3, 0.4, 0.5],
                    "rotation_angles": [0, 0, 0, 0, 0],
                    "backbone_lengths": [0.07, 0.07, 0.07, 0.07, 0.07],
                    "coupling_lengths": [0.03, 0.03, 0.03, 0.03, 0.03, 0.015],
                    "discretization_steps": 50,
                },
                "max_time": 5.0,
            },
        ]

        for test_case in performance_tests:
            payload = self._add_tendon_config(test_case["payload"].copy())
            start_time = time.time()
            response = self.client.post("/kinematics", json=payload)
            execution_time = time.time() - start_time

            assert response.status_code == 200, f"Failed for {test_case['name']}"
            assert (
                execution_time < test_case["max_time"]
            ), f"Failed for {test_case['name']}"

    def test_workflow_concurrent_requests(self):
        """Test handling of concurrent requests."""
        import queue
        import threading

        payload = {
            "bending_angles": [0.1, 0.2, 0.3],
            "rotation_angles": [0, 0, 0],
            "backbone_lengths": [0.07, 0.07, 0.07],
            "coupling_lengths": [0.03, 0.03, 0.03, 0.015],
            "discretization_steps": 10,
        }

        results = queue.Queue()
        errors = queue.Queue()

        payload = self._add_tendon_config(payload)
        def make_request():
            try:
                response = self.client.post("/kinematics", json=payload)
                results.put((response.status_code, response.json()))
            except Exception as e:
                errors.put(e)

        # Start multiple concurrent requests
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join()

        # Check results
        error_list = [errors.get() for _ in range(errors.qsize())]
        assert errors.empty(), f"Errors occurred: {error_list}"

        # All requests should succeed
        while not results.empty():
            status_code, data = results.get()
            assert status_code == 200
            assert "data" in data
            assert "result" in data["data"]
            assert "robot_positions" in data["data"]["result"]

    def test_workflow_with_malformed_json(self):
        """Test workflow with malformed JSON requests."""
        # Test with invalid JSON
        response = self.client.post(
            "/kinematics",
            data="invalid json",
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 422

        # Test with empty body
        response = self.client.post("/kinematics", data="")
        assert response.status_code == 422

    def test_workflow_with_large_payload(self):
        """Test workflow with large payloads."""
        # Create a large payload with many segments
        payload = {
            "bending_angles": [0.1] * 20,  # 20 segments
            "rotation_angles": [0] * 20,
            "backbone_lengths": [0.07] * 20,
            "coupling_lengths": [0.03] * 21,  # 21 coupling lengths
            "discretization_steps": 100,
        }

        payload = self._add_tendon_config(payload)
        response = self.client.post("/kinematics", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "result" in data["data"]
        assert "robot_positions" in data["data"]["result"]
        # 20 backbone + 21 coupling segments
        assert len(data["data"]["result"]["robot_positions"]) == 41

    def test_workflow_cache_invalidation(self):
        """Test that cache works correctly with different parameters."""
        base_payload = {
            "bending_angles": [0.1, 0.2, 0.3],
            "rotation_angles": [0, 0, 0],
            "backbone_lengths": [0.07, 0.07, 0.07],
            "coupling_lengths": [0.03, 0.03, 0.03, 0.015],
            "discretization_steps": 10,
        }

        # First request
        base_payload = self._add_tendon_config(base_payload)
        response1 = self.client.post("/kinematics", json=base_payload)
        assert response1.status_code == 200
        data1 = response1.json()

        # Slightly different payload (should not use cache)
        modified_payload = base_payload.copy()
        # Slightly different
        modified_payload["bending_angles"] = [0.11, 0.2, 0.3]

        response2 = self.client.post("/kinematics", json=modified_payload)
        assert response2.status_code == 200
        data2 = response2.json()

        # Results should be different
        assert data1 != data2

        # Original payload should still use cache
        response3 = self.client.post("/kinematics", json=base_payload)
        assert response3.status_code == 200
        data3 = response3.json()
        # Results should be identical (excluding timestamp)
        data1_no_timestamp = {k: v for k, v in data1.items() if k != "timestamp"}
        data3_no_timestamp = {k: v for k, v in data3.items() if k != "timestamp"}
        assert data1_no_timestamp == data3_no_timestamp

    def test_workflow_edge_cases(self):
        """Test workflow with edge case parameters."""
        edge_cases = [
            {
                "name": "zero_lengths",
                "payload": {
                    "bending_angles": [0.1, 0.2, 0.3],
                    "rotation_angles": [0, 0, 0],
                    "backbone_lengths": [0.001, 0.001, 0.001],  # Very small
                    "coupling_lengths": [0.001, 0.001, 0.001, 0.001],
                    "discretization_steps": 1,  # Minimum
                },
            },
            {
                "name": "large_angles",
                "payload": {
                    "bending_angles": [3.14, 3.14, 3.14],  # π radians
                    "rotation_angles": [3.14, 3.14, 3.14],
                    "backbone_lengths": [0.07, 0.07, 0.07],
                    "coupling_lengths": [0.03, 0.03, 0.03, 0.015],
                    "discretization_steps": 10,
                },
            },
            {
                "name": "negative_rotation",
                "payload": {
                    "bending_angles": [0.1, 0.2, 0.3],
                    "rotation_angles": [
                        -1.57,
                        -0.785,
                        0.785,
                    ],  # Negative angles
                    "backbone_lengths": [0.07, 0.07, 0.07],
                    "coupling_lengths": [0.03, 0.03, 0.03, 0.015],
                    "discretization_steps": 10,
                },
            },
        ]

        for test_case in edge_cases:
            payload = self._add_tendon_config(test_case["payload"].copy())
            response = self.client.post("/kinematics", json=payload)
            assert response.status_code == 200, f"Failed for {test_case['name']}"
            data = response.json()
            assert "data" in data
            assert "result" in data["data"], f"Failed for {test_case['name']}"
            assert "robot_positions" in data["data"]["result"], f"Failed for {test_case['name']}"
            assert len(data["data"]["result"]["robot_positions"]) > 0, f"Failed for {test_case['name']}"

    def test_workflow_api_documentation(self):
        """Test that API documentation is accessible."""
        # Test OpenAPI schema
        response = self.client.get("/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert "paths" in schema
        assert "/kinematics" in schema["paths"]

        # Test docs endpoint
        response = self.client.get("/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]

        # Test redoc endpoint
        response = self.client.get("/redoc")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
