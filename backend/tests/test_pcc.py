from unittest.mock import patch

import numpy as np

from app.models.pcc.model import compute_pcc
from app.models.pcc.transformations import (transformation_matrix_backbone,
                                            transformation_matrix_coupling)
from app.models.pcc.types import PCCParams


class TestPCCTransformations:
    """Test PCC transformation functions."""

    def test_transformation_matrix_coupling_zero_length(self):
        """Test coupling transformation with zero length."""
        result = transformation_matrix_coupling(0.0)

        assert result.shape == (4, 4)
        assert np.array_equal(result[:3, :3], np.eye(3))
        assert np.array_equal(result[:3, 3], [0, 0, 0])
        assert result[3, 3] == 1

    def test_transformation_matrix_coupling_positive_length(self):
        """Test coupling transformation with positive length."""
        length = 0.1
        result = transformation_matrix_coupling(length)

        assert result.shape == (4, 4)
        assert np.array_equal(result[:3, :3], np.eye(3))
        assert np.array_equal(result[:3, 3], [0, 0, length])
        assert result[3, 3] == 1

    def test_transformation_matrix_coupling_negative_length(self):
        """Test coupling transformation with negative length."""
        length = -0.1
        result = transformation_matrix_coupling(length)

        assert result.shape == (4, 4)
        assert np.array_equal(result[:3, :3], np.eye(3))
        assert np.array_equal(result[:3, 3], [0, 0, length])
        assert result[3, 3] == 1

    def test_transformation_matrix_backbone_zero_angles(self):
        """Test backbone transformation with zero angles."""
        theta = 0.0
        phi = 0.0
        length = 0.1
        steps = 5

        result = transformation_matrix_backbone(theta, phi, length, steps)

        assert len(result) == steps
        for T in result:
            assert T.shape == (4, 4)
            # Should be mostly translation in z direction
            assert np.allclose(T[:3, :3], np.eye(3))
            assert T[2, 3] > 0  # z translation should be positive

    def test_transformation_matrix_backbone_with_rotation(self):
        """Test backbone transformation with rotation."""
        theta = np.pi / 4  # 45 degrees
        phi = np.pi / 6  # 30 degrees
        length = 0.1
        steps = 10

        result = transformation_matrix_backbone(theta, phi, length, steps)

        assert len(result) == steps
        for T in result:
            assert T.shape == (4, 4)
            # Should have rotation (not identity)
            assert not np.allclose(T[:3, :3], np.eye(3))

    def test_transformation_matrix_backbone_single_step(self):
        """Test backbone transformation with single step."""
        theta = np.pi / 2
        phi = 0.0
        length = 0.1
        steps = 1

        result = transformation_matrix_backbone(theta, phi, length, steps)

        assert len(result) == 1
        T = result[0]
        assert T.shape == (4, 4)
        # Should have significant rotation
        assert not np.allclose(T[:3, :3], np.eye(3))

    def test_transformation_matrix_backbone_multiple_steps(self):
        """Test backbone transformation with multiple steps."""
        theta = np.pi / 4
        phi = np.pi / 3
        length = 0.2
        steps = 20

        result = transformation_matrix_backbone(theta, phi, length, steps)

        assert len(result) == steps

        # Check that transformations are valid
        for T in result:
            assert T.shape == (4, 4)
            assert T[3, 3] == 1  # Homogeneous coordinate

    def test_transformation_matrix_backbone_edge_cases(self):
        """Test backbone transformation with edge cases."""
        # Test with very small angles
        result = transformation_matrix_backbone(0.001, 0.001, 0.1, 5)
        assert len(result) == 5

        # Test with very large angles
        result = transformation_matrix_backbone(np.pi, np.pi, 0.1, 5)
        assert len(result) == 5

        # Test with very small length
        result = transformation_matrix_backbone(np.pi / 4, np.pi / 4, 0.001, 5)
        assert len(result) == 5


class TestPCCModel:
    """Test PCC model computation."""

    def setup_method(self):
        """Clear cache before each test."""
        from app.utils.cache import clear_cache

        clear_cache()

    def test_compute_pcc_simple_case(self):
        """Test PCC computation with simple parameters."""
        params = PCCParams(
            bending_angles=[0.1, 0.2],
            rotation_angles=[0, 0],
            backbone_lengths=[0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03],
            discretization_steps=5,
        )

        result = compute_pcc(params)

        assert isinstance(result, list)
        assert len(result) > 0

        # Check that each segment contains points
        for segment in result:
            assert isinstance(segment, (list, np.ndarray))
            assert len(segment) > 0

    def test_compute_pcc_with_rotation(self):
        """Test PCC computation with rotation angles."""
        params = PCCParams(
            bending_angles=[0.1, 0.2],
            rotation_angles=[np.pi / 4, np.pi / 6],
            backbone_lengths=[0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03],
            discretization_steps=10,
        )

        result = compute_pcc(params)

        assert isinstance(result, list)
        assert len(result) > 0

    def test_compute_pcc_cache_hit(self):
        """Test that PCC computation uses cache when available."""
        params = PCCParams(
            bending_angles=[0.1, 0.2],
            rotation_angles=[0, 0],
            backbone_lengths=[0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03],
            discretization_steps=5,
        )

        # First computation
        result1 = compute_pcc(params)

        # Second computation should use cache
        result2 = compute_pcc(params)

        # Results should be identical
        assert len(result1) == len(result2)
        for seg1, seg2 in zip(result1, result2):
            if isinstance(seg1, np.ndarray) and isinstance(seg2, np.ndarray):
                assert np.array_equal(seg1, seg2)
            else:
                assert seg1 == seg2

    def test_compute_pcc_different_parameters(self):
        """Test that different parameters produce different results."""
        params1 = PCCParams(
            bending_angles=[0.1, 0.2],
            rotation_angles=[0, 0],
            backbone_lengths=[0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03],
            discretization_steps=5,
        )

        params2 = PCCParams(
            bending_angles=[0.2, 0.3],  # Different angles
            rotation_angles=[0, 0],
            backbone_lengths=[0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03],
            discretization_steps=5,
        )

        result1 = compute_pcc(params1)
        result2 = compute_pcc(params2)

        # Results should be different
        assert len(result1) == len(result2)
        # At least some segments should be different
        differences_found = False
        for seg1, seg2 in zip(result1, result2):
            if isinstance(seg1, np.ndarray) and isinstance(seg2, np.ndarray):
                if not np.array_equal(seg1, seg2):
                    differences_found = True
                    break
            elif isinstance(seg1, list) and isinstance(seg2, list):
                # Compare lists element by element
                if len(seg1) != len(seg2):
                    differences_found = True
                    break
                for elem1, elem2 in zip(seg1, seg2):
                    if isinstance(elem1, np.ndarray) and isinstance(elem2, np.ndarray):
                        if not np.array_equal(elem1, elem2):
                            differences_found = True
                            break
                    elif elem1 != elem2:
                        differences_found = True
                        break
                if differences_found:
                    break

        assert differences_found

    def test_compute_pcc_zero_angles(self):
        """Test PCC computation with zero angles."""
        params = PCCParams(
            bending_angles=[0.0, 0.0],
            rotation_angles=[0.0, 0.0],
            backbone_lengths=[0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03],
            discretization_steps=5,
        )

        result = compute_pcc(params)

        assert isinstance(result, list)
        assert len(result) > 0

    def test_compute_pcc_single_segment(self):
        """Test PCC computation with single segment."""
        params = PCCParams(
            bending_angles=[0.1],
            rotation_angles=[0],
            backbone_lengths=[0.07],
            coupling_lengths=[0.03, 0.03],
            discretization_steps=5,
        )

        result = compute_pcc(params)

        assert isinstance(result, list)
        assert len(result) > 0

    def test_compute_pcc_high_discretization(self):
        """Test PCC computation with high discretization."""
        params = PCCParams(
            bending_angles=[0.1, 0.2],
            rotation_angles=[0, 0],
            backbone_lengths=[0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03],
            discretization_steps=50,
        )

        result = compute_pcc(params)

        assert isinstance(result, list)
        assert len(result) > 0

    @patch("app.models.pcc.model.get_cached_result")
    def test_compute_pcc_cache_miss(self, mock_get_cached):
        """Test PCC computation when cache miss occurs."""
        mock_get_cached.return_value = None

        params = PCCParams(
            bending_angles=[0.1, 0.2],
            rotation_angles=[0, 0],
            backbone_lengths=[0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03],
            discretization_steps=5,
        )

        result = compute_pcc(params)

        assert isinstance(result, list)
        assert len(result) > 0
        mock_get_cached.assert_called_once_with(params)

    def test_pcc_params_validation_empty_arrays(self):
        """Test PCCParams validation for empty arrays."""
        import pytest
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            PCCParams(
                bending_angles=[],
                rotation_angles=[0, 0],
                backbone_lengths=[0.07, 0.07],
                coupling_lengths=[0.03, 0.03, 0.03],
                discretization_steps=5,
            )

    def test_pcc_params_validation_discretization_steps(self):
        """Test PCCParams validation for discretization steps."""
        import pytest
        from pydantic import ValidationError

        # Test zero discretization steps
        with pytest.raises(ValidationError):
            PCCParams(
                bending_angles=[0.1, 0.2],
                rotation_angles=[0, 0],
                backbone_lengths=[0.07, 0.07],
                coupling_lengths=[0.03, 0.03, 0.03],
                discretization_steps=0,
            )
