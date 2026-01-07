import numpy as np


def homogeneous_matrix(rotation_matrix: np.ndarray, translation_vector: np.ndarray) -> np.ndarray:
    """
    Create a 4x4 homogeneous transformation matrix.

    :param rotation_matrix: 3x3 rotation matrix
    :param translation_vector: 3-element translation vector
    :return: 4x4 transformation matrix
    """
    transformation_matrix = np.eye(4)
    transformation_matrix[:3, :3] = rotation_matrix
    transformation_matrix[:3, 3] = translation_vector
    return transformation_matrix


def rotation_matrix_z(angle_rad: float) -> np.ndarray:
    """
    Create a rotation matrix for a rotation about the Z-axis.

    :param angle_rad: rotation angle in radians
    :return: 3x3 rotation matrix
    """
    c, s = np.cos(angle_rad), np.sin(angle_rad)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def rotation_matrix_y(angle_rad: float) -> np.ndarray:
    """
    Create a rotation matrix for a rotation about the Y-axis.

    :param angle_rad: rotation angle in radians
    :return: 3x3 rotation matrix
    """
    c, s = np.cos(angle_rad), np.sin(angle_rad)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
