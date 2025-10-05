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
    Return local transformation steps (not accumulated).
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
