import numpy as np
import pytest
from app.models.pcc.model import compute_pcc
from app.models.pcc.transformations import (
    transformation_matrix_backbone,
    transformation_matrix_coupling,
)
from app.models.pcc.types import PCCParams


def test_pcc_basic():
    """Test basic PCC computation."""
    from app.utils.cache import clear_cache

    # Clear cache to ensure fresh computation
    clear_cache()

    params = PCCParams(
        bending_angles=[0.1, 0.2, 0.3],
        rotation_angles=[0, 0, 0],
        backbone_lengths=[0.07, 0.07, 0.07],
        coupling_lengths=[0.03, 0.03, 0.03, 0.015],
        discretization_steps=10,
    )
    result = compute_pcc(params)
    assert len(result) == 7  # 3 backbone segments + 4 coupling segments
    assert all(isinstance(segment, (np.ndarray, list)) for segment in result)


def test_transformation_matrix_coupling():
    """Test transformation matrix for coupling."""
    length = 0.05
    T = transformation_matrix_coupling(length)

    assert T.shape == (4, 4)
    assert T[0, 3] == 0  # x translation
    assert T[1, 3] == 0  # y translation
    assert T[2, 3] == length  # z translation
    assert T[3, 3] == 1  # homogeneous coordinate


def test_transformation_matrix_backbone_zero_theta():
    """Test transformation matrix backbone with zero theta (straight segment)."""
    theta = 0.0  # Zero bending angle
    phi = 0.5
    length = 0.07
    discretization_steps = 5

    T_steps = transformation_matrix_backbone(
        theta, phi, length, discretization_steps
    )

    assert len(T_steps) == discretization_steps
    assert all(T.shape == (4, 4) for T in T_steps)

    # For zero theta, should be straight translation along z-axis
    for T in T_steps:
        assert T[0, 3] == 0  # x translation should be 0
        assert T[1, 3] == 0  # y translation should be 0
        assert T[2, 3] > 0  # z translation should be positive


def test_transformation_matrix_backbone_nonzero_theta():
    """Test transformation matrix backbone with nonzero theta (curved segment)."""
    theta = 0.3  # Non-zero bending angle
    phi = 0.5
    length = 0.07
    discretization_steps = 5

    T_steps = transformation_matrix_backbone(
        theta, phi, length, discretization_steps
    )

    assert len(T_steps) == discretization_steps
    assert all(T.shape == (4, 4) for T in T_steps)

    # For non-zero theta, should have some x and y translation
    has_xy_translation = any(T[0, 3] != 0 or T[1, 3] != 0 for T in T_steps)
    assert has_xy_translation


def test_pcc_params_validation_empty_arrays():
    """Test PCCParams validation for empty arrays."""
    with pytest.raises(ValueError, match="Arrays cannot be empty"):
        PCCParams(
            bending_angles=[],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )


def test_pcc_params_validation_discretization_steps_zero():
    """Test PCCParams validation for zero discretization steps."""
    with pytest.raises(
        ValueError, match="Discretization steps must be positive"
    ):
        PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=0,
        )


def test_pcc_params_validation_discretization_steps_negative():
    """Test PCCParams validation for negative discretization steps."""
    with pytest.raises(
        ValueError, match="Discretization steps must be positive"
    ):
        PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=-5,
        )


def test_pcc_params_validation_discretization_steps_too_large():
    """Test PCCParams validation for discretization steps exceeding limit."""
    with pytest.raises(
        ValueError, match="Discretization steps cannot exceed 10000"
    ):
        PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=15000,
        )
