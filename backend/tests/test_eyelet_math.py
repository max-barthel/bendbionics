"""
Unit tests for eyelet math module.

Tests the core mathematical function for computing eyelet transformation matrices.
"""

import numpy as np
import pytest
from app.models.tendon.eyelet_math import compute_eyelets_from_origin


class TestEyeletMath:
    """Test eyelet math functionality."""

    def test_basic_eyelet_calculation(self):
        """Test basic eyelet calculation with identity origin matrix."""
        # Identity matrix at origin
        origin = np.eye(4)
        n = 3
        radius = 0.05

        eyelets = compute_eyelets_from_origin(origin, n, radius)

        # Should have n eyelets
        assert len(eyelets) == n

        # Each eyelet should be a 4x4 matrix
        for eyelet in eyelets:
            assert eyelet.shape == (4, 4)
            # Should be a proper homogeneous transformation matrix
            assert np.allclose(eyelet[3, :], [0, 0, 0, 1])  # Bottom row
            assert np.allclose(
                eyelet[:, 3][:3], np.linalg.inv(eyelet[:3, :3]) @ eyelet[:3, 3]
            )

    def test_first_eyelets_on_x_axis(self):
        """Test that first eyelet starts on x-axis."""
        origin = np.eye(4)
        n = 3
        radius = 0.05

        eyelets = compute_eyelets_from_origin(origin, n, radius)

        # First eyelet should be on x-axis (positive x direction)
        first_pos = eyelets[0][:3, 3]
        assert np.allclose(first_pos, [radius, 0, 0], atol=1e-6), (
            f"First eyelet position: {first_pos}"
        )

    def test_equidistant_distribution(self):
        """Test that eyelets are equidistant on the circle."""
        origin = np.eye(4)
        n = 4
        radius = 0.05

        eyelets = compute_eyelets_from_origin(origin, n, radius)

        # All eyelets should be at radius distance from origin
        origin_pos = origin[:3, 3]
        for eyelet in eyelets:
            eyelet_pos = eyelet[:3, 3]
            distance = np.linalg.norm(eyelet_pos - origin_pos)
            assert np.allclose(distance, radius, atol=1e-6)

    def test_circle_in_xy_plane(self):
        """Test that eyelets lie in the x-y plane of the origin."""
        origin = np.eye(4)
        n = 6
        radius = 0.05

        eyelets = compute_eyelets_from_origin(origin, n, radius)

        # For identity origin, all eyelets should have z=0
        for eyelet in eyelets:
            eyelet_pos = eyelet[:3, 3]
            assert np.allclose(eyelet_pos[2], 0, atol=1e-6)

    def test_same_orientation_as_origin(self):
        """Test that eyelets maintain same orientation as origin."""
        # Create origin with non-identity rotation
        rotation = np.array(
            [[0, -1, 0], [1, 0, 0], [0, 0, 1]]
        )  # 90 deg rotation around z
        translation = np.array([1, 2, 3])
        origin = np.eye(4)
        origin[:3, :3] = rotation
        origin[:3, 3] = translation

        n = 3
        radius = 0.05

        eyelets = compute_eyelets_from_origin(origin, n, radius)

        # Each eyelet should have same rotation matrix as origin
        for eyelet in eyelets:
            assert np.allclose(eyelet[:3, :3], rotation, atol=1e-6)

    def test_different_origin_orientations(self):
        """Test eyelet calculation with different origin orientations."""
        n = 4
        radius = 0.03

        # Test multiple rotations
        test_rotations = [
            np.eye(3),  # Identity
            np.array([[0, -1, 0], [1, 0, 0], [0, 0, 1]]),  # 90 deg z
            np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]]),  # 90 deg y
        ]

        for rotation in test_rotations:
            origin = np.eye(4)
            origin[:3, :3] = rotation
            origin[:3, 3] = np.array([0, 0, 0])

            eyelets = compute_eyelets_from_origin(origin, n, radius)

            # All eyelets should have same rotation
            for eyelet in eyelets:
                assert np.allclose(eyelet[:3, :3], rotation, atol=1e-6)

    def test_edge_cases(self):
        """Test edge cases: n=1, n=2, large n."""
        origin = np.eye(4)
        radius = 0.05

        # n=1 (single eyelet)
        eyelets_1 = compute_eyelets_from_origin(origin, 1, radius)
        assert len(eyelets_1) == 1
        assert np.allclose(eyelets_1[0][:3, 3], [radius, 0, 0])

        # n=2 (two eyelets opposite each other)
        eyelets_2 = compute_eyelets_from_origin(origin, 2, radius)
        assert len(eyelets_2) == 2
        assert np.allclose(eyelets_2[0][:3, 3], [radius, 0, 0])
        assert np.allclose(eyelets_2[1][:3, 3], [-radius, 0, 0])

        # n=12 (many eyelets)
        eyelets_12 = compute_eyelets_from_origin(origin, 12, radius)
        assert len(eyelets_12) == 12
        # First should be on x-axis
        assert np.allclose(eyelets_12[0][:3, 3], [radius, 0, 0], atol=1e-6)
        # Third should be on y-axis (90 degrees)
        assert np.allclose(eyelets_12[3][:3, 3], [0, radius, 0], atol=1e-5)

    def test_zero_radius(self):
        """Test with zero radius (all eyelets at origin)."""
        origin = np.eye(4)
        n = 3
        radius = 0.0

        eyelets = compute_eyelets_from_origin(origin, n, radius)

        # All eyelets should be at origin position
        origin_pos = origin[:3, 3]
        for eyelet in eyelets:
            eyelet_pos = eyelet[:3, 3]
            assert np.allclose(eyelet_pos, origin_pos, atol=1e-6)

    def test_translated_origin(self):
        """Test with translated origin."""
        origin = np.eye(4)
        origin[:3, 3] = np.array([10, 20, 30])
        n = 4
        radius = 0.05

        eyelets = compute_eyelets_from_origin(origin, n, radius)

        # Eyelets should be at origin + circle positions
        origin_pos = origin[:3, 3]
        for i, eyelet in enumerate(eyelets):
            angle = 2 * np.pi * i / n
            expected_local = np.array(
                [radius * np.cos(angle), radius * np.sin(angle), 0]
            )
            # Transform to global: rotation is identity, so just add
            expected_global = origin_pos + expected_local
            eyelet_pos = eyelet[:3, 3]
            assert np.allclose(eyelet_pos, expected_global, atol=1e-6)

    def test_validation_errors(self):
        """Test input validation."""
        origin = np.eye(4)
        radius = 0.05

        # n < 1 should raise ValueError
        with pytest.raises(ValueError, match="Number of eyelets must be >= 1"):
            compute_eyelets_from_origin(origin, 0, radius)

        # radius < 0 should raise ValueError
        with pytest.raises(ValueError, match="Radius must be >= 0"):
            compute_eyelets_from_origin(origin, 3, -0.01)

        # Wrong matrix size should raise ValueError
        wrong_matrix = np.eye(3)  # 3x3 instead of 4x4
        with pytest.raises(ValueError, match="Origin matrix must be 4x4"):
            compute_eyelets_from_origin(wrong_matrix, 3, radius)

    def test_angles_distribution(self):
        """Test that angles are correctly distributed."""
        origin = np.eye(4)
        n = 6
        radius = 0.05

        eyelets = compute_eyelets_from_origin(origin, n, radius)

        # Check angles between consecutive eyelets
        origin_pos = origin[:3, 3]
        eyelet_positions = [eyelet[:3, 3] for eyelet in eyelets]

        # Calculate angles from x-axis
        angles = []
        for pos in eyelet_positions:
            local_pos = pos - origin_pos  # Should be same as identity transform
            angle = np.arctan2(local_pos[1], local_pos[0])
            angles.append(angle)

        # Angles should be: 0, π/3, 2π/3, π, 4π/3, 5π/3
        expected_angles = [2 * np.pi * i / n for i in range(n)]
        for i, (actual, expected) in enumerate(zip(angles, expected_angles)):
            # Normalize angles to [0, 2π)
            actual_norm = actual % (2 * np.pi)
            expected_norm = expected % (2 * np.pi)
            assert np.allclose(actual_norm, expected_norm, atol=1e-5), (
                f"Eyelet {i}: expected angle {expected_norm}, got {actual_norm}"
            )
