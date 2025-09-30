"""
PCC (Piecewise Constant Curvature) model implementation with tendon support.

This module implements the RobotModelInterface, making the PCC model
compatible with the new tendon calculation system.
"""

from typing import Any, Dict, List

import numpy as np

from app.models.tendon.engine import RobotModelInterface

from .model import compute_pcc
from .types import PCCParams


class PCCRobotModel(RobotModelInterface):
    """
    PCC robot model that implements RobotModelInterface.

    This class wraps the existing PCC model and makes it compatible
    with the new tendon calculation system.
    """

    def __init__(self):
        """Initialize the PCC robot model."""
        self.model_type = "pcc"

    def compute_robot_position(self, params: PCCParams) -> List[List[np.ndarray]]:
        """
        Compute robot position using the PCC model.

        Args:
            params: PCC parameters

        Returns:
            List of robot segment positions
        """
        # Store parameters for orientation calculations
        self.bending_angles = params.bending_angles
        self.rotation_angles = params.rotation_angles
        self.backbone_lengths = params.backbone_lengths
        self.coupling_lengths = params.coupling_lengths

        return compute_pcc(params)

    def get_coupling_elements(
        self, robot_positions: List[List[np.ndarray]]
    ) -> Dict[str, List]:
        """
        Extract coupling element data from PCC robot positions.

        Args:
            robot_positions: List of robot segment positions from PCC model

        Returns:
            Dictionary with coupling positions and orientations
        """
        coupling_positions = []
        coupling_orientations = []
        segment_index = 0

        # The robot_positions structure alternates between:
        # - Backbone segments (multiple points)
        # - Coupling elements (2 points: start and end)

        current_position = np.array([0.0, 0.0, 0.0])
        current_orientation = np.eye(3)

        # Add base coupling element
        coupling_positions.append(current_position.copy())
        coupling_orientations.append(current_orientation.copy())

        for segment in robot_positions:
            if len(segment) == 2:
                # This is a coupling element
                start_pos = segment[0]
                end_pos = segment[1]

                # Use the MIDDLE of the coupling, not the end
                coupling_middle = (start_pos + end_pos) / 2

                # Update current position and orientation
                direction = end_pos - start_pos
                if np.linalg.norm(direction) > 1e-6:
                    # Calculate orientation based on direction
                    z_axis = direction / np.linalg.norm(direction)
                    current_orientation = self._create_orientation_from_direction(
                        z_axis, segment_index
                    )

                current_position = coupling_middle
                coupling_positions.append(current_position.copy())
                coupling_orientations.append(current_orientation.copy())
                segment_index += 1

            else:
                # This is a backbone segment - update orientation based on
                # curvature
                if len(segment) > 1:
                    # Calculate average direction of the curved segment
                    segment_direction = segment[-1] - segment[0]
                    if np.linalg.norm(segment_direction) > 1e-6:
                        z_axis = segment_direction / np.linalg.norm(segment_direction)
                        current_orientation = self._create_orientation_from_direction(
                            z_axis, segment_index
                        )

        return {
            "positions": coupling_positions,
            "orientations": coupling_orientations,
        }

    def _create_orientation_from_direction(
        self, z_axis: np.ndarray, segment_index: int = 0
    ) -> np.ndarray:
        """
        Create orientation matrix for eyelet positioning using the MATLAB
        approach.

        This method prevents torsion by using the Rz * Ry * Rz^T method:
        1. Rotate around z-axis by phi (bending direction)
        2. Rotate around y-axis by theta (bending angle)
        3. Rotate back around z-axis by -phi (to cancel initial z-rotation)

        This creates pure bending without torsion.

        Args:
            z_axis: Direction vector of the coupling
            segment_index: Index of the current segment

        Returns:
            3x3 orientation matrix
        """
        # Normalize the z-axis (direction)
        z_axis = z_axis / np.linalg.norm(z_axis)

        # If the z-axis is close to the global z-axis, use global coordinates
        if abs(z_axis[2]) > 0.9:
            return np.eye(3)

        # Calculate the bending angle (theta) and direction (phi)
        # theta is the angle between current z-axis and global z-axis
        theta = np.arccos(np.clip(z_axis[2], -1.0, 1.0))

        # phi is the angle in the xy-plane (bending direction)
        if abs(theta) < 1e-6:
            # No bending, return identity
            return np.eye(3)

        # Calculate phi from the x and y components
        phi = np.arctan2(z_axis[1], z_axis[0])

        # Create rotation matrices following the MATLAB approach
        # Rz(phi) * Ry(theta) * Rz(-phi)

        # Rotation around z-axis by phi
        cos_phi = np.cos(phi)
        sin_phi = np.sin(phi)
        Rz_phi = np.array([[cos_phi, -sin_phi, 0], [sin_phi, cos_phi, 0], [0, 0, 1]])

        # Rotation around y-axis by theta
        cos_theta = np.cos(theta)
        sin_theta = np.sin(theta)
        Ry_theta = np.array(
            [[cos_theta, 0, sin_theta], [0, 1, 0], [-sin_theta, 0, cos_theta]]
        )

        # Rotation around z-axis by -phi (transpose of Rz_phi)
        Rz_neg_phi = Rz_phi.T

        # Combine rotations: Rz(phi) * Ry(theta) * Rz(-phi)
        return Rz_phi @ Ry_theta @ Rz_neg_phi


# Convenience function for backward compatibility
def compute_pcc_with_tendons(params: PCCParams) -> Dict[str, Any]:
    """
    Compute PCC transformation chain and tendon lengths.

    This function maintains backward compatibility while using the
    new tendon system.

    Args:
        params: PCC parameters including tendon configuration

    Returns:
        Dictionary containing robot position and tendon analysis
    """
    from app.models.tendon.engine import TendonAnalysisEngine

    # Create the PCC robot model
    pcc_model = PCCRobotModel()

    # Create the tendon analysis engine
    tendon_engine = TendonAnalysisEngine(params.tendon_config)

    # Analyze the robot with tendons
    return tendon_engine.analyze_robot_with_tendons(pcc_model, params)
