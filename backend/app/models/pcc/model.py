from typing import List

import numpy as np

from app.utils.cache import cache_result, get_cached_result

from .transformations import (
    transformation_matrix_backbone,
    transformation_matrix_coupling,
)
from .types import PCCParams


def compute_pcc(params: PCCParams) -> List[np.ndarray]:
    """
    Compute the full PCC transformation chain given the input parameters.
    Returns a list of 3D points per segment.
    """
    # Check cache first
    cached_result = get_cached_result(params)
    if cached_result is not None:
        return cached_result

    # If not in cache, compute normally
    bending_angles = params.bending_angles
    rotation_angles = params.rotation_angles
    backbone_lengths = params.backbone_lengths
    coupling_lengths = params.coupling_lengths
    steps = params.discretization_steps

    T_all = []

    # Start with identity matrix
    T = np.eye(4)
    T_start = T.copy()

    # Initial coupling
    T_coupling = transformation_matrix_coupling(coupling_lengths[0])
    T = T @ T_coupling
    T_all.append(np.array([T_start[:3, 3], T[:3, 3]]))  # first coupling segment

    for _i, (theta, phi, l_bb, l_coup) in enumerate(
        zip(
            bending_angles,
            rotation_angles,
            backbone_lengths,
            coupling_lengths[1:],
        )
    ):
        # Backbone segment
        T_bb = transformation_matrix_backbone(theta, phi, l_bb, steps)
        T_bb_global = np.zeros_like(T_bb)

        for j in range(steps):
            T = T @ T_bb[j]
            T_bb_global[j] = T.copy()

        T_all.append([T_bb_global[k][:3, 3] for k in range(steps)])

        # Coupling segment
        T_start = T.copy()
        T_coupling = transformation_matrix_coupling(l_coup)
        T = T @ T_coupling
        T_all.append(np.array([T_start[:3, 3], T[:3, 3]]))

    # Cache the result before returning
    cache_result(params, T_all)
    return T_all
