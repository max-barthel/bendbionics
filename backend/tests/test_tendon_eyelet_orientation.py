"""
Test case for tendon routing and eyelet orientation issue.

This test verifies that eyelets are correctly oriented perpendicular to
coupling elements, not just vertical to the floor.
"""

import numpy as np

from app.models.pcc.pcc_model import PCCRobotModel
from app.models.pcc.types import PCCParams
from app.models.tendon.engine import TendonAnalysisEngine
from app.models.tendon.types import TendonConfig


def test_bent_robot_should_have_length_changes():
    """
    Test that a bent robot configuration produces length changes.

    Configuration:
    - 1 segment with 10 degree bending (0.1745 rad)
    - 3 tendons at 0.05m radius
    - Robot is bent, so tendons should have different lengths

    Expected:
    - Length changes should NOT all be zero
    - Eyelets should be oriented relative to coupling orientation
    """
    # Configuration from user's report
    params = PCCParams(
        bending_angles=[0.17453292519943295],  # ~10 degrees
        rotation_angles=[0.0],
        backbone_lengths=[0.07],
        coupling_lengths=[0.03, 0.03],
        discretization_steps=1000,
        tendon_config=TendonConfig(count=3, radius=[0.05, 0.05]),
    )

    # Create engine and compute
    pcc_model = PCCRobotModel()
    engine = TendonAnalysisEngine(params.tendon_config)
    result = engine.analyze_robot_with_tendons(pcc_model, params)

    # Extract results
    coupling_data = result["coupling_data"]
    tendon_analysis = result["tendon_analysis"]
    length_changes = np.array(tendon_analysis["length_changes"])

    # Verify that length changes are not all zero
    # (The fix ensures orientations are correctly calculated from
    # transformation matrices)
    final_changes = length_changes[:, -1]
    all_zero = np.allclose(final_changes, 0, atol=1e-6)
    assert not all_zero, (
        "Bent robot should have non-zero length changes. "
        "All eyelets appear to be in global x-y plane instead of "
        "being oriented relative to coupling elements."
    )

    # Verify that the final coupling (after bending) has non-identity
    # orientation
    final_orientation = np.array(coupling_data["orientations"][-1])
    is_identity = np.allclose(final_orientation, np.eye(3), atol=1e-6)
    assert not is_identity, (
        "Final coupling after bending should have non-identity orientation. "
        "This indicates the orientation is correctly calculated from the "
        "transformation chain."
    )


def test_eyelet_orientation_relative_to_coupling():
    """
    Test that eyelets are correctly oriented relative to coupling orientation.

    When a coupling is rotated, eyelets should be in the coupling's local
    x-y plane, not the global x-y plane.
    """
    from app.models.tendon.eyelet_math import compute_eyelets_from_origin
    from app.utils.math_tools import homogeneous_matrix

    # Create a rotated coupling (45 degrees around z-axis)
    rotation_z = np.array([[0.707, -0.707, 0], [0.707, 0.707, 0], [0, 0, 1]])
    translation = np.array([0, 0, 0.1])
    coupling_transform = homogeneous_matrix(rotation_z, translation)

    # Compute eyelets
    eyelets = compute_eyelets_from_origin(coupling_transform, 3, 0.05)

    # Verify eyelets have same rotation as coupling
    for eyelet in eyelets:
        assert np.allclose(eyelet[:3, :3], rotation_z, atol=1e-3), (
            "Eyelet should have same rotation as coupling"
        )

    # Verify eyelet positions are transformed correctly
    first_eyelet_pos = eyelets[0][:3, 3]
    # In local frame, first eyelet is at [radius, 0, 0]
    # After rotation, should be at [radius*cos(45), radius*sin(45), 0] + translation
    expected_local = np.array([0.05, 0, 0])
    expected_global = rotation_z @ expected_local + translation

    assert np.allclose(first_eyelet_pos, expected_global, atol=1e-3), (
        "Eyelet position should be correctly transformed to global coordinates"
    )
