import math
from typing import List

import numpy as np
from app.utils.geometry_tools import extract_xyz_coordinates
from app.utils.math_tools import (
    homogeneous_matrix,
    rotation_matrix_y,
    rotation_matrix_z,
)
from pydantic import BaseModel


class PCC:
    """A class to compute the transformation matrices for a soft robot using
    the Piecewise Constant Curvature model."""

    def __init__(
        self,
        bending_angles,
        rotation_angles,
        backbone_lengths,
        coupling_lengths,
        discretization_steps,
    ):
        """
        Initialize the PCC model with input parameters.
        """
        self.bending_angles = bending_angles
        self.rotation_angles = rotation_angles
        self.backbone_lengths = backbone_lengths
        self.coupling_lengths = coupling_lengths
        self.discretization_steps = discretization_steps

    def transformation_matrix_coupling(self, length):
        """Create a transformation matrix for a coupling element."""
        translation_vector = [0, 0, length]
        rotation = np.eye(3)
        T = homogeneous_matrix(rotation, translation_vector)
        # Repeat the same transformation for each discretization step
        return np.repeat(
            T[np.newaxis, :, :], self.discretization_steps, axis=0
        )

    def transformation_matrix_backbone(self, theta, phi, length):
        """Create a discretized transformation matrix for a backbone.
        :param theta: Bending angle in radians
        :param phi: Rotation angle in radians
        :param length: Length of the backbone
        :return: discretized Transformation matrix for the backbone
        """
        length_space = np.linspace(0, length, self.discretization_steps)
        theta_space = np.linspace(0, theta, self.discretization_steps)

        T_all = np.zeros((self.discretization_steps, 4, 4))

        for i in range(self.discretization_steps):
            angle = theta_space[i]
            len_space = length_space[i]

            Rz = rotation_matrix_z(phi)
            Ry = rotation_matrix_y(angle)
            Rz_inv = rotation_matrix_z(-phi)
            R = Rz @ Ry @ Rz_inv

            if angle == 0:
                t = [0, 0, len_space]
            else:
                t = (
                    len_space
                    / angle
                    * np.array(
                        [
                            math.cos(phi) * (1 - math.cos(angle)),
                            math.sin(phi) * (1 - math.cos(angle)),
                            math.sin(angle),
                        ]
                    )
                )

            T_all[i] = homogeneous_matrix(R, t)

        return T_all

    def build_model(self):
        T_all = []
        current_T = np.eye(4)  # Global starting frame

        # First coupling element
        T_coupling = self.transformation_matrix_coupling(
            self.coupling_lengths[0]
        )
        global_coupling = self._apply_global_transform(current_T, T_coupling)
        T_all.append(global_coupling)
        current_T = global_coupling[-1]  # Update current tip

        for i, (theta, phi, l_bb) in enumerate(
            zip(
                self.bending_angles,
                self.rotation_angles,
                self.backbone_lengths,
            )
        ):
            # Backbone segment
            T_bb = self.transformation_matrix_backbone(theta, phi, l_bb)
            global_bb = self._apply_global_transform(current_T, T_bb)
            T_all.append(global_bb)
            current_T = global_bb[-1]

            # Coupling segment (if any left)
            if i + 1 < len(self.coupling_lengths):
                T_coupling = self.transformation_matrix_coupling(
                    self.coupling_lengths[i + 1]
                )
                global_coupling = self._apply_global_transform(
                    current_T, T_coupling
                )
                T_all.append(global_coupling)
                current_T = global_coupling[-1]

        return T_all

    def _apply_global_transform(self, base_T, segment_T):
        return np.array([base_T @ T for T in segment_T])


class PCCParams(BaseModel):
    """Parameters for the PCC model."""

    bending_angles: List[float]
    rotation_angles: List[float]
    backbone_lengths: List[float]
    coupling_lengths: List[float]
    discretization_steps: int


def compute_pcc(params: PCCParams) -> List[np.ndarray]:
    """
    Compute the PCC model transformation matrices based on input parameters.
    """
    pcc = PCC(
        bending_angles=params.bending_angles,
        rotation_angles=params.rotation_angles,
        backbone_lengths=params.backbone_lengths,
        coupling_lengths=params.coupling_lengths,
        discretization_steps=params.discretization_steps,
    )

    T_all = pcc.build_model()
    # Extract XYZ coordinates from the transformation matrices
    return extract_xyz_coordinates(T_all)
