import math

import numpy as np

from app.utils.math_tools import (
    homogeneous_matrix,
    rotation_matrix_y,
    rotation_matrix_z,
)


def transformation_matrix_coupling(length: float) -> np.ndarray:
    """Returns a single transformation matrix for a straight coupling."""
    translation_vector = [0, 0, length]
    rotation = np.eye(3)
    return homogeneous_matrix(rotation, translation_vector)


def transformation_matrix_backbone(
    theta: float, phi: float, length: float, discretization_steps: int
) -> np.ndarray:
    """
    Compute transformation matrices for a curved backbone segment.

    This function implements the Piecewise Constant Curvature (PCC) model
    by discretizing a curved segment into multiple transformation steps.
    Each step represents a small segment along the curved backbone.

    Args:
        theta: Bending angle (radians) - how much the segment curves
        phi: Rotation angle (radians) - direction of the curve in the plane
        length: Length of the backbone segment
        discretization_steps: Number of steps to discretize the curve

    Returns:
        Array of 4x4 homogeneous transformation matrices, one for each step.
        These are local transformations (not accumulated globally).

    Note:
        The transformation follows the PCC model where:
        - The segment curves in a plane defined by phi
        - The curvature is constant (theta/length)
        - Each step rotates and translates along the curved path
    """
    delta_theta = theta / discretization_steps
    delta_length = length / discretization_steps
    t_steps = []

    for _ in range(discretization_steps):
        rz = rotation_matrix_z(phi)
        ry = rotation_matrix_y(delta_theta)
        rz_inv = rotation_matrix_z(-phi)
        R = rz @ ry @ rz_inv

        if delta_theta == 0:
            t = [0, 0, delta_length]
        else:
            t = (
                delta_length
                / delta_theta
                * np.array(
                    [
                        math.cos(phi) * (1 - math.cos(delta_theta)),
                        math.sin(phi) * (1 - math.cos(delta_theta)),
                        math.sin(delta_theta),
                    ]
                )
            )

        t_steps.append(homogeneous_matrix(R, t))

    return t_steps
