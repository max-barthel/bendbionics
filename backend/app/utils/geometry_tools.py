# Obsolete for the current context.
from typing import List

import numpy as np


def extract_xyz_coordinates(
    t_all: List[np.ndarray],
) -> List[List[List[float]]]:
    """
    Extract XYZ coordinates from a list of transformation matrix arrays.

    Returns:
        A list of segments, where each segment is a list of [x, y, z] points.
    """
    xyz_all = []

    for segment in t_all:
        xyz_segment = []
        for T in segment:
            x, y, z = T[:3, 3]
            xyz_segment.append([x, y, z])
        xyz_all.append(xyz_segment)

    return xyz_all
