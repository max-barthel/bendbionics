import math
from typing import List

import numpy as np
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
        """Returns a single transformation matrix for a straight coupling."""
        translation_vector = [0, 0, length]
        rotation = np.eye(3)
        return homogeneous_matrix(rotation, translation_vector)

    def transformation_matrix_backbone(self, theta, phi, length):
        """
        Return local transformation steps (not accumulated).
        """
        delta_theta = theta / self.discretization_steps
        delta_length = length / self.discretization_steps
        T_steps = []

        for _ in range(self.discretization_steps):
            Rz = rotation_matrix_z(phi)
            Ry = rotation_matrix_y(delta_theta)
            Rz_inv = rotation_matrix_z(-phi)
            R = Rz @ Ry @ Rz_inv

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

            T_steps.append(homogeneous_matrix(R, t))

        return T_steps

    def build_model(self):
        T_all = []

        # First coupling starts at identity
        T = np.eye(4)
        T_start = T.copy()

        T_coupling = self.transformation_matrix_coupling(
            self.coupling_lengths[0]
        )
        T = T @ T_coupling
        T_all.append(
            np.array([T_start[:3, 3], T[:3, 3]])
        )  # just start & end points

        for i, (theta, phi, l_bb, l_coup) in enumerate(
            zip(
                self.bending_angles,
                self.rotation_angles,
                self.backbone_lengths,
                self.coupling_lengths[1:],
            )
        ):
            # Backbone
            T_steps = self.transformation_matrix_backbone(theta, phi, l_bb)
            T_bb_global = []

            for step in T_steps:
                T = T @ step
                T_bb_global.append(T.copy())

            T_all.append([T_i[:3, 3] for T_i in T_bb_global])

            # Coupling
            T_start = T_bb_global[-1].copy()
            T_coupling = self.transformation_matrix_coupling(l_coup)
            T = T_start @ T_coupling
            T_all.append(
                np.array([T_start[:3, 3], T[:3, 3]])
            )  # just start & end points

        return T_all


class PCCParams(BaseModel):
    """Parameters for the PCC model."""

    bending_angles: List[float]
    rotation_angles: List[float]
    backbone_lengths: List[float]
    coupling_lengths: List[float]
    discretization_steps: int


def compute_pcc(params: PCCParams) -> List[List[np.ndarray]]:
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

    return pcc.build_model()
