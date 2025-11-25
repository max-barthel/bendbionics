"""
PCC (Piecewise Constant Curvature) model implementation with tendon support.

This module implements the RobotModelInterface, making the PCC model
compatible with the new tendon calculation system.
"""

from typing import Any, Dict, List

import numpy as np

from app.models.tendon.engine import RobotModelInterface
from app.utils.math_tools import homogeneous_matrix

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
        Extract coupling element transformation matrices from PCC robot positions.

        This method recomputes the transformation chain to get accurate orientations
        from the accumulated transformation matrices, not just from direction vectors.

        Args:
            robot_positions: List of robot segment positions from PCC model

        Returns:
            Dictionary with coupling transformation matrices (4x4 homogeneous matrices)
            Maintains backward compatibility by also returning separate positions
            and orientations.
        """
        if not hasattr(self, "bending_angles"):
            return self._get_coupling_elements_from_directions(robot_positions)

        return self._compute_coupling_elements_from_transforms(robot_positions)

    def _compute_coupling_elements_from_transforms(
        self, robot_positions: List[List[np.ndarray]]
    ) -> Dict[str, List]:
        """Compute coupling elements by reconstructing transformation chain."""
        coupling_transforms = []
        coupling_positions = []
        coupling_orientations = []
        transform_matrix = np.eye(4)
        coupling_lengths = self.coupling_lengths

        # Process first coupling if present
        if self._has_first_coupling(robot_positions):
            transform_matrix = self._process_first_coupling(
                robot_positions[0],
                coupling_lengths[0],
                transform_matrix,
                coupling_transforms,
                coupling_positions,
                coupling_orientations,
            )

        # Process remaining segments
        backbone_index = 0
        coupling_index = 1
        for segment in robot_positions[1:]:
            if len(segment) == 2:
                transform_matrix = self._process_coupling_segment(
                    segment,
                    coupling_lengths,
                    coupling_index,
                    transform_matrix,
                    coupling_transforms,
                    coupling_positions,
                    coupling_orientations,
                )
                coupling_index += 1
            else:
                transform_matrix = self._process_backbone_segment(
                    segment, backbone_index, transform_matrix
                )
                backbone_index += 1

        return {
            "transforms": coupling_transforms,
            "positions": coupling_positions,
            "orientations": coupling_orientations,
        }

    def _add_base_coupling(
        self,
        coupling_transforms: List[np.ndarray],
        coupling_positions: List[np.ndarray],
        coupling_orientations: List[np.ndarray],
    ) -> None:
        """Add base coupling element at origin."""
        base_transform = homogeneous_matrix(np.eye(3), np.array([0.0, 0.0, 0.0]))
        coupling_transforms.append(base_transform)
        coupling_positions.append(np.array([0.0, 0.0, 0.0]))
        coupling_orientations.append(np.eye(3))

    def _has_first_coupling(self, robot_positions: List[List[np.ndarray]]) -> bool:
        """Check if first segment is a coupling element."""
        return len(robot_positions) > 0 and len(robot_positions[0]) == 2

    def _process_first_coupling(
        self,
        segment: List[np.ndarray],
        coupling_length: float,
        transform_matrix: np.ndarray,
        coupling_transforms: List[np.ndarray],
        coupling_positions: List[np.ndarray],
        coupling_orientations: List[np.ndarray],
    ) -> np.ndarray:
        """Process the first coupling segment."""
        from .transformations import transformation_matrix_coupling

        coupling_middle = (segment[0] + segment[1]) / 2
        t_coupling = transformation_matrix_coupling(coupling_length)
        transform_matrix = transform_matrix @ t_coupling

        coupling_transform = homogeneous_matrix(
            transform_matrix[:3, :3].copy(), coupling_middle
        )
        coupling_transforms.append(coupling_transform)
        coupling_positions.append(coupling_middle.copy())
        coupling_orientations.append(transform_matrix[:3, :3].copy())

        return transform_matrix

    def _process_coupling_segment(
        self,
        segment: List[np.ndarray],
        coupling_lengths: List[float],
        coupling_index: int,
        transform_matrix: np.ndarray,
        coupling_transforms: List[np.ndarray],
        coupling_positions: List[np.ndarray],
        coupling_orientations: List[np.ndarray],
    ) -> np.ndarray:
        """Process a coupling segment."""
        from .transformations import transformation_matrix_coupling

        coupling_middle = (segment[0] + segment[1]) / 2
        coupling_transform = homogeneous_matrix(
            transform_matrix[:3, :3].copy(), coupling_middle
        )
        coupling_transforms.append(coupling_transform)
        coupling_positions.append(coupling_middle.copy())
        coupling_orientations.append(transform_matrix[:3, :3].copy())

        if coupling_index < len(coupling_lengths):
            t_coupling = transformation_matrix_coupling(
                coupling_lengths[coupling_index]
            )
            transform_matrix = transform_matrix @ t_coupling

        return transform_matrix

    def _process_backbone_segment(
        self,
        segment: List[np.ndarray],
        backbone_index: int,
        transform_matrix: np.ndarray,
    ) -> np.ndarray:
        """Process a backbone segment."""
        from .transformations import transformation_matrix_backbone

        if backbone_index >= len(self.bending_angles):
            return transform_matrix

        theta = self.bending_angles[backbone_index]
        phi = self.rotation_angles[backbone_index]
        l_bb = self.backbone_lengths[backbone_index]
        steps = len(segment)

        t_bb = transformation_matrix_backbone(theta, phi, l_bb, steps)
        for t_step in t_bb:
            transform_matrix = transform_matrix @ t_step

        return transform_matrix

    def _get_coupling_elements_from_directions(
        self, robot_positions: List[List[np.ndarray]]
    ) -> Dict[str, List]:
        """Fallback method using direction vectors (old implementation)."""
        coupling_transforms = []
        coupling_positions = []
        coupling_orientations = []
        segment_index = 0

        current_position = np.array([0.0, 0.0, 0.0])
        current_orientation = np.eye(3)

        # Add base coupling element
        base_transform = homogeneous_matrix(
            current_orientation.copy(), current_position.copy()
        )
        coupling_transforms.append(base_transform)
        coupling_positions.append(current_position.copy())
        coupling_orientations.append(current_orientation.copy())

        for segment in robot_positions:
            if len(segment) == 2:
                # This is a coupling element
                start_pos = segment[0]
                end_pos = segment[1]
                coupling_middle = (start_pos + end_pos) / 2

                direction = end_pos - start_pos
                if np.linalg.norm(direction) > 1e-6:
                    z_axis = direction / np.linalg.norm(direction)
                    current_orientation = self._create_orientation_from_direction(
                        z_axis, segment_index
                    )

                current_position = coupling_middle
                current_transform = homogeneous_matrix(
                    current_orientation.copy(), current_position.copy()
                )
                coupling_transforms.append(current_transform)
                coupling_positions.append(current_position.copy())
                coupling_orientations.append(current_orientation.copy())
                segment_index += 1

            else:
                if len(segment) > 1:
                    segment_direction = segment[-1] - segment[0]
                    if np.linalg.norm(segment_direction) > 1e-6:
                        z_axis = segment_direction / np.linalg.norm(segment_direction)
                        current_orientation = self._create_orientation_from_direction(
                            z_axis, segment_index
                        )

        return {
            "transforms": coupling_transforms,
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

        # If the z-axis is close to the global z-axis (pointing up),
        # use global coordinates
        if z_axis[2] > 0.9:
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

        # Handle the 180-degree case properly
        # When theta is close to π (180 degrees), we need to ensure proper rotation
        if abs(theta - np.pi) < 1e-6:
            # For 180-degree bending, we need to rotate by π around the y-axis
            # and then apply the phi rotation
            cos_phi = np.cos(phi)
            sin_phi = np.sin(phi)

            # Create rotation matrix for 180-degree case
            # Rz(phi) * Ry(π) * Rz(-phi)
            rz_phi = np.array(
                [[cos_phi, -sin_phi, 0], [sin_phi, cos_phi, 0], [0, 0, 1]]
            )
            # 180-degree rotation around y
            ry_pi = np.array([[-1, 0, 0], [0, 1, 0], [0, 0, -1]])
            rz_neg_phi = rz_phi.T

            return rz_phi @ ry_pi @ rz_neg_phi

        # Create rotation matrices following the MATLAB approach
        # Rz(phi) * Ry(theta) * Rz(-phi)

        # Rotation around z-axis by phi
        cos_phi = np.cos(phi)
        sin_phi = np.sin(phi)
        rz_phi = np.array([[cos_phi, -sin_phi, 0], [sin_phi, cos_phi, 0], [0, 0, 1]])

        # Rotation around y-axis by theta
        cos_theta = np.cos(theta)
        sin_theta = np.sin(theta)
        ry_theta = np.array(
            [[cos_theta, 0, sin_theta], [0, 1, 0], [-sin_theta, 0, cos_theta]]
        )

        # Rotation around z-axis by -phi (transpose of rz_phi)
        rz_neg_phi = rz_phi.T

        # Combine rotations: Rz(phi) * Ry(theta) * Rz(-phi)
        return rz_phi @ ry_theta @ rz_neg_phi


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
