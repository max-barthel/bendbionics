"""
Core tendon calculator for computing tendon lengths and actuation.
"""

from typing import Any, Dict, List

import numpy as np

from app.api.responses import ValidationError

from .eyelet_math import compute_eyelets_from_origin
from .types import TendonConfig


class TendonCalculator:
    """
    Calculates tendon lengths and actuation requirements for a robot
    configuration.

    This is a clean, simple implementation that focuses on accuracy and
    reliability.
    """

    def __init__(self, config: TendonConfig):
        """
        Initialize the tendon calculator.

        Args:
            config: Tendon configuration parameters
        """
        self.config = config

    def calculate_tendon_lengths(
        self,
        coupling_transforms: List[np.ndarray],
    ) -> Dict[str, Any]:
        """
        Calculate tendon lengths based on coupling element transformation matrices.

        Args:
            coupling_transforms: List of 4x4 homogeneous transformation matrices
                                for each coupling element

        Returns:
            Dictionary with tendon analysis results
        """
        num_elements = len(coupling_transforms)
        num_tendons = self.config.count

        # Calculate tendon routing points in global coordinates
        routing_points = self._calculate_routing_points(coupling_transforms)

        # Calculate tendon lengths between consecutive coupling elements
        segment_lengths = np.zeros((num_tendons, num_elements - 1))

        # Always calculate segment lengths through eyelets for accuracy
        for i in range(num_elements - 1):
            for j in range(num_tendons):
                start_point = routing_points[i][j]
                end_point = routing_points[i + 1][j]
                segment_lengths[j, i] = np.linalg.norm(end_point - start_point)

        # Calculate total tendon lengths from base to each coupling element
        total_lengths = np.zeros((num_tendons, num_elements))
        total_lengths[:, 0] = 0  # Base position

        for i in range(1, num_elements):
            total_lengths[:, i] = total_lengths[:, i - 1] + segment_lengths[:, i - 1]

        # Calculate length changes (how much each tendon needs to be pulled)
        # Reference is the straight configuration - calculate segment-by-segment deltas
        reference_segment_lengths = self._calculate_reference_segment_lengths(coupling_transforms)

        # Calculate segment length changes: bent - reference
        # Positive = tendon shortened = needs pulling
        # Negative = tendon lengthened = needs releasing
        segment_length_changes = segment_lengths - reference_segment_lengths

        # Calculate cumulative length changes from base to each coupling element
        total_length_changes = np.zeros((num_tendons, num_elements))
        total_length_changes[:, 0] = 0  # Base position

        for i in range(1, num_elements):
            total_length_changes[:, i] = (
                total_length_changes[:, i - 1] + segment_length_changes[:, i - 1]
            )

        return {
            "segment_lengths": segment_lengths.tolist(),
            "total_lengths": total_lengths.tolist(),
            "length_changes": total_length_changes.tolist(),
            "segment_length_changes": segment_length_changes.tolist(),
            "routing_points": routing_points.tolist(),
        }

    def _calculate_routing_points(
        self,
        coupling_transforms: List[np.ndarray],
    ) -> np.ndarray:
        """
        Calculate the global 3D positions of tendon routing points.

        Uses the new eyelet math to compute eyelet transformation matrices
        from each coupling element, then extracts positions.

        Args:
            coupling_transforms: List of 4x4 transformation matrices for each
                                coupling element

        Returns:
            Array of routing points for each coupling element and tendon
            Shape: (num_elements, num_tendons, 3)
        """
        num_elements = len(coupling_transforms)
        num_tendons = self.config.count

        # Validate radius array length matches number of coupling elements
        if len(self.config.radius) != num_elements:
            msg = (
                f"Radius array length ({len(self.config.radius)}) must match "
                f"number of coupling elements ({num_elements})"
            )
            raise ValidationError(
                msg,
                details={
                    "radius_array_length": len(self.config.radius),
                    "coupling_elements_count": num_elements,
                },
            )

        routing_points = np.zeros((num_elements, num_tendons, 3))

        for i in range(num_elements):
            origin_matrix = coupling_transforms[i]

            # Compute eyelet transformation matrices using new eyelet math
            # Use radius[i] for each coupling element
            eyelet_matrices = compute_eyelets_from_origin(
                origin_matrix, num_tendons, self.config.radius[i]
            )

            # Extract positions from eyelet transformation matrices
            for j in range(num_tendons):
                # Position is stored in translation vector
                # (first 3 elements of last column)
                routing_points[i, j] = eyelet_matrices[j][:3, 3]

        return routing_points

    def _calculate_reference_segment_lengths(
        self,
        coupling_transforms: List[np.ndarray],
    ) -> np.ndarray:
        """
        Calculate reference tendon segment lengths for straight configuration.

        This method constructs a straight robot configuration (all segments pointing
        up the Z-axis) and calculates the distances between eyelets in consecutive
        coupling elements.

        Args:
            coupling_transforms: List of 4x4 transformation matrices for
                                 coupling elements

        Returns:
            Array of reference segment lengths for each tendon and segment
        """
        from app.utils.math_tools import homogeneous_matrix

        num_elements = len(coupling_transforms)
        num_tendons = self.config.count

        # Create straight configuration transformation matrices
        # All coupling elements at x=0, y=0, with increasing z based on actual geometry
        straight_transforms = []
        cumulative_z = 0.0

        for i in range(num_elements):
            # Use actual coupling element position as reference for z-coordinate
            # This preserves the actual segment lengths from the robot configuration
            if i == 0:
                cumulative_z = 0.0
            else:
                # Calculate z-distance from previous coupling element
                prev_pos = coupling_transforms[i - 1][:3, 3]
                curr_pos = coupling_transforms[i][:3, 3]
                z_distance = np.linalg.norm(curr_pos - prev_pos)
                cumulative_z += z_distance

            # Create identity rotation (no rotation for straight configuration)
            identity_rotation = np.eye(3)
            straight_position = np.array([0.0, 0.0, cumulative_z])
            straight_transform = homogeneous_matrix(identity_rotation, straight_position)
            straight_transforms.append(straight_transform)

        # Calculate routing points for straight configuration
        straight_routing_points = self._calculate_routing_points(straight_transforms)

        # Calculate segment lengths between consecutive coupling elements
        reference_segment_lengths = np.zeros((num_tendons, num_elements - 1))

        for i in range(num_elements - 1):
            for j in range(num_tendons):
                start_point = straight_routing_points[i][j]
                end_point = straight_routing_points[i + 1][j]
                reference_segment_lengths[j, i] = np.linalg.norm(end_point - start_point)

        return reference_segment_lengths

    def get_actuation_commands(self, length_changes: np.ndarray) -> Dict[str, Dict[str, Any]]:
        """
        Generate practical actuation commands for tendon control.

        Args:
            length_changes: Array of tendon length changes

        Returns:
            Dictionary mapping tendon IDs to actuation values
        """
        commands = {}

        for i in range(length_changes.shape[0]):
            # Get the final length change for this tendon
            final_change = length_changes[i, -1]

            # Determine pull direction based on first principles calculation
            # Negative change = tendon shortened = needs pulling
            # Positive change = tendon lengthened = needs releasing
            if final_change > 0:
                pull_direction = "release"  # Positive = tendon gets longer
            elif final_change < 0:
                pull_direction = "pull"  # Negative = tendon gets shorter
            else:
                pull_direction = "hold"

            # Use 1-based indexing for tendon names (1,2,3 instead of 0,1,2)
            commands[str(i + 1)] = {
                "length_change_m": float(final_change),
                "pull_direction": pull_direction,
                "magnitude": abs(final_change),
            }

        return commands
