"""Additional tests for PCC model to improve branch coverage."""

import numpy as np
import pytest
from app.models.pcc.pcc_model import PCCRobotModel
from app.models.pcc.types import PCCParams
from app.models.tendon.types import TendonConfig


class TestPCCModelBranchCoverage:
    """Tests to improve branch coverage in PCC model."""

    def setup_method(self):
        """Setup test model."""
        self.model = PCCRobotModel()

    def test_compute_robot_position_with_valid_params(self):
        """Test compute_robot_position with valid parameters."""
        params = PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0.0, 0.0, 0.0],
            backbone_lengths=[0.1, 0.2, 0.3],
            coupling_lengths=[0.05, 0.1, 0.15],
            discretization_steps=10,
        )

        result = self.model.compute_robot_position(params)

        assert result is not None
        assert isinstance(result, list)
        assert len(result) >= 3  # Should have at least 3 segments

    def test_compute_robot_position_with_single_segment(self):
        """Test compute_robot_position with single segment."""
        params = PCCParams(
            bending_angles=[0.1],
            rotation_angles=[0.0],
            backbone_lengths=[0.1],
            coupling_lengths=[0.05],
            discretization_steps=5,
        )

        result = self.model.compute_robot_position(params)

        assert result is not None
        assert isinstance(result, list)
        assert len(result) == 1

    def test_compute_robot_position_with_zero_angles(self):
        """Test compute_robot_position with zero angles."""
        params = PCCParams(
            bending_angles=[0.0, 0.0, 0.0],
            rotation_angles=[0.0, 0.0, 0.0],
            backbone_lengths=[0.1, 0.2, 0.3],
            coupling_lengths=[0.05, 0.1, 0.15],
            discretization_steps=10,
        )

        result = self.model.compute_robot_position(params)

        assert result is not None
        assert isinstance(result, list)
        assert len(result) >= 3

    def test_compute_robot_position_with_high_discretization(self):
        """Test compute_robot_position with high discretization."""
        params = PCCParams(
            bending_angles=[0.1, 0.2],
            rotation_angles=[0.0, 0.0],
            backbone_lengths=[0.1, 0.2],
            coupling_lengths=[0.05, 0.1],
            discretization_steps=100,
        )

        result = self.model.compute_robot_position(params)

        assert result is not None
        assert isinstance(result, list)
        assert len(result) >= 2

    def test_get_coupling_elements_with_valid_positions(self):
        """Test get_coupling_elements with valid robot positions."""
        # Create mock robot positions
        robot_positions = [
            [np.array([0, 0, 0]), np.array([0, 0, 0.1])],
            [np.array([0, 0, 0.1]), np.array([0, 0, 0.2])],
        ]

        result = self.model.get_coupling_elements(robot_positions)

        assert result is not None
        assert isinstance(result, dict)
        assert "positions" in result
        assert "orientations" in result

    def test_get_coupling_elements_with_empty_positions(self):
        """Test get_coupling_elements with empty positions."""
        robot_positions = []

        result = self.model.get_coupling_elements(robot_positions)

        assert result is not None
        assert isinstance(result, dict)
        assert "positions" in result
        assert "orientations" in result

    def test_get_coupling_elements_with_single_segment(self):
        """Test get_coupling_elements with single segment."""
        robot_positions = [[np.array([0, 0, 0]), np.array([0, 0, 0.1])]]

        result = self.model.get_coupling_elements(robot_positions)

        assert result is not None
        assert isinstance(result, dict)
        assert "positions" in result
        assert "orientations" in result

    def test_model_type_attribute(self):
        """Test that model has correct type attribute."""
        assert self.model.model_type == "pcc"

    def test_compute_robot_position_with_tendon_config(self):
        """Test compute_robot_position with tendon configuration."""
        tendon_config = TendonConfig(
            count=4, radius=0.015, coupling_offset=0.02
        )

        params = PCCParams(
            bending_angles=[0.1, 0.2],
            rotation_angles=[0.0, 0.0],
            backbone_lengths=[0.1, 0.2],
            coupling_lengths=[0.05, 0.1],
            discretization_steps=10,
            tendon_config=tendon_config,
        )

        result = self.model.compute_robot_position(params)

        assert result is not None
        assert isinstance(result, list)
        assert len(result) >= 2

    def test_compute_robot_position_with_different_angle_combinations(self):
        """Test compute_robot_position with different angle combinations."""
        # Test with non-zero rotation angles
        params = PCCParams(
            bending_angles=[0.1, 0.2],
            rotation_angles=[0.5, 1.0],  # Non-zero rotation
            backbone_lengths=[0.1, 0.2],
            coupling_lengths=[0.05, 0.1],
            discretization_steps=10,
        )

        result = self.model.compute_robot_position(params)

        assert result is not None
        assert isinstance(result, list)
        assert len(result) >= 2

    def test_compute_robot_position_with_negative_angles(self):
        """Test compute_robot_position with negative angles."""
        params = PCCParams(
            bending_angles=[-0.1, -0.2],
            rotation_angles=[-0.5, -1.0],
            backbone_lengths=[0.1, 0.2],
            coupling_lengths=[0.05, 0.1],
            discretization_steps=10,
        )

        result = self.model.compute_robot_position(params)

        assert result is not None
        assert isinstance(result, list)
        assert len(result) >= 2
