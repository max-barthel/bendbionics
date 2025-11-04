"""
Core mathematical functions for calculating eyelet positions.

This module provides reliable, accurate calculation of equidistant eyelet
points on a circle in the x-y plane of an origin transformation matrix.
"""

from typing import List

import numpy as np

from app.utils.math_tools import homogeneous_matrix


def compute_eyelets_from_origin(
    origin_matrix: np.ndarray, n: int, radius: float
) -> List[np.ndarray]:
    """
    Compute transformation matrices for n equidistant eyelets on a circle.

    The eyelets are positioned on a circle in the x-y plane of the origin,
    with the first eyelet starting on the x-axis (angle = 0).

    Args:
        origin_matrix: 4x4 homogeneous transformation matrix representing the origin
                      point (location and orientation). The origin is typically
                      the center of coupling points.
        n: Number of equidistant eyelets to generate
        radius: Radius of the circle in the origin's x-y plane (in meters)

    Returns:
        List of n 4x4 transformation matrices, one for each eyelet.
        Each eyelet matrix has the same orientation as the origin, but
        is positioned on the circle.

    Raises:
        ValueError: If n < 1 or radius < 0
        ValueError: If origin_matrix is not 4x4

    Example:
        >>> origin = np.eye(4)  # Identity matrix at origin
        >>> eyelets = compute_eyelets_from_origin(origin, 3, 0.05)
        >>> len(eyelets) == 3
        True
        >>> # First eyelet should be on x-axis
        >>> np.allclose(eyelets[0][:3, 3], [0.05, 0, 0])
        True
    """
    # Validate inputs
    if n < 1:
        msg = f"Number of eyelets must be >= 1, got {n}"
        raise ValueError(msg)
    if radius < 0:
        msg = f"Radius must be >= 0, got {radius}"
        raise ValueError(msg)
    if origin_matrix.shape != (4, 4):
        msg = f"Origin matrix must be 4x4, got shape {origin_matrix.shape}"
        raise ValueError(msg)

    # Extract rotation matrix (3x3) from origin
    rotation = origin_matrix[:3, :3]

    eyelet_matrices = []

    for i in range(n):
        # Calculate angle for this eyelet (starting at 0, which is x-axis)
        angle = 2 * np.pi * i / n

        # Local position in origin's coordinate frame (x-y plane, z=0)
        local_x = radius * np.cos(angle)
        local_y = radius * np.sin(angle)
        local_z = 0.0

        # Transform local position to global coordinates using homogeneous coordinates
        local_pos_homogeneous = np.array([local_x, local_y, local_z, 1.0])
        global_pos_homogeneous = origin_matrix @ local_pos_homogeneous
        global_pos = global_pos_homogeneous[:3]

        # Create eyelet transformation matrix: same rotation as origin, new position
        eyelet_matrix = homogeneous_matrix(rotation.copy(), global_pos)

        eyelet_matrices.append(eyelet_matrix)

    return eyelet_matrices
