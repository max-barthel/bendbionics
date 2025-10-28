"""
Core tendon calculator for computing tendon lengths and actuation.
"""

from typing import Any, Dict, List

import numpy as np

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
        self._generate_tendon_positions()

    def _generate_tendon_positions(self):
        """Generate the angular positions of tendons around the coupling
        element."""
        # Distribute tendons evenly around the circumference
        angles = np.linspace(0, 2 * np.pi, self.config.count, endpoint=False)

        # Calculate x, y positions for each tendon at the specified radius
        self.tendon_positions = []
        for angle in angles:
            x = self.config.radius * np.cos(angle)
            y = self.config.radius * np.sin(angle)
            z = 0.0  # No vertical offset
            self.tendon_positions.append(np.array([x, y, z]))

    def calculate_tendon_lengths(
        self,
        coupling_positions: List[np.ndarray],
        coupling_orientations: List[np.ndarray],
    ) -> Dict[str, Any]:
        """
        Calculate tendon lengths based on coupling element data.

        Args:
            coupling_positions: List of 3D positions for each coupling element
            coupling_orientations: List of 3x3 rotation matrices for each
            coupling element

        Returns:
            Dictionary with tendon analysis results
        """
        if len(coupling_positions) != len(coupling_orientations):
            msg = "Positions and orientations must have same length"
            raise ValueError(msg)

        num_elements = len(coupling_positions)
        num_tendons = self.config.count

        # Calculate tendon routing points in global coordinates
        routing_points = self._calculate_routing_points(
            coupling_positions, coupling_orientations
        )

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
        reference_segment_lengths = self._calculate_reference_segment_lengths(
            coupling_positions
        )

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
        coupling_positions: List[np.ndarray],
        coupling_orientations: List[np.ndarray],
    ) -> np.ndarray:
        """
        Calculate the global 3D positions of tendon routing points.

        Args:
            coupling_positions: List of coupling element positions
            coupling_orientations: List of coupling element orientations

        Returns:
            Array of routing points for each coupling element and tendon
        """
        num_elements = len(coupling_positions)
        num_tendons = len(self.tendon_positions)

        routing_points = np.zeros((num_elements, num_tendons, 3))

        for i in range(num_elements):
            position = coupling_positions[i]
            orientation = coupling_orientations[i]

            for j in range(num_tendons):
                # Get local tendon position
                local_pos = self.tendon_positions[j]

                # Transform to global coordinates using rotation matrix
                global_pos = position + orientation @ local_pos
                routing_points[i, j] = global_pos

        return routing_points

    def _calculate_reference_segment_lengths(
        self,
        coupling_positions: List[np.ndarray],
    ) -> np.ndarray:
        """
        Calculate reference tendon segment lengths for straight configuration.

        This method constructs a straight robot configuration (all segments pointing
        up the Z-axis) and calculates the distances between eyelets in consecutive
        coupling elements.

        Args:
            coupling_positions: List of coupling element positions

        Returns:
            Array of reference segment lengths for each tendon and segment
        """
        num_elements = len(coupling_positions)
        num_tendons = self.config.count

        # Create straight configuration positions
        # All coupling elements at x=0, y=0, with increasing z based on actual geometry
        straight_positions = []
        cumulative_z = 0.0

        for i in range(num_elements):
            # Use actual coupling element position as reference for z-coordinate
            # This preserves the actual segment lengths from the robot configuration
            if i == 0:
                cumulative_z = 0.0
            else:
                # Calculate z-distance from previous coupling element
                prev_pos = coupling_positions[i - 1]
                curr_pos = coupling_positions[i]
                z_distance = np.linalg.norm(curr_pos - prev_pos)
                cumulative_z += z_distance

            straight_positions.append(np.array([0.0, 0.0, cumulative_z]))

        # Create identity orientations (no rotation for straight configuration)
        straight_orientations = [np.eye(3) for _ in range(num_elements)]

        # Calculate routing points for straight configuration
        straight_routing_points = self._calculate_routing_points(
            straight_positions, straight_orientations
        )

        # Calculate segment lengths between consecutive coupling elements
        reference_segment_lengths = np.zeros((num_tendons, num_elements - 1))

        for i in range(num_elements - 1):
            for j in range(num_tendons):
                start_point = straight_routing_points[i][j]
                end_point = straight_routing_points[i + 1][j]
                reference_segment_lengths[j, i] = np.linalg.norm(
                    end_point - start_point
                )

        return reference_segment_lengths

    def get_actuation_commands(
        self, length_changes: np.ndarray
    ) -> Dict[str, Dict[str, Any]]:
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
