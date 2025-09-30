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
            z = self.config.coupling_offset
            self.tendon_positions.append(np.array([x, y, z]))

    def calculate_tendon_lengths(
        self,
        coupling_positions: List[np.ndarray],
        coupling_orientations: List[np.ndarray],
        backbone_lengths: List[float] | None = None,
        coupling_lengths: List[float] | None = None,
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

        # Check if robot is straight (all coupling positions have same x,y)
        is_straight = all(
            abs(coupling_positions[i][0]) < 1e-6
            and abs(coupling_positions[i][1]) < 1e-6
            for i in range(num_elements)
        )

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
        # Reference is the straight configuration
        reference_lengths = self._calculate_reference_lengths(
            coupling_positions,
            backbone_lengths,
            coupling_lengths,
            is_straight,
            total_lengths,
        )
        length_changes = total_lengths - reference_lengths

        return {
            "segment_lengths": segment_lengths.tolist(),
            "total_lengths": total_lengths.tolist(),
            "length_changes": length_changes.tolist(),
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

    def _calculate_reference_lengths(
        self,
        coupling_positions: List[np.ndarray],
        backbone_lengths: List[float] | None = None,
        coupling_lengths: List[float] | None = None,
        is_straight: bool = False,
        total_lengths: np.ndarray = None,
    ) -> np.ndarray:
        """
        Calculate reference tendon lengths for straight configuration.

        Following the MATLAB approach: calculate the straight-line distance
        from base to each coupling point, representing what the tendon
        length would be if the robot was completely straight.

        Args:
            coupling_positions: List of coupling element positions

        Returns:
            Reference tendon lengths
        """
        num_elements = len(coupling_positions)
        num_tendons = self.config.count

        reference_lengths = np.zeros((num_tendons, num_elements))

        # In straight configuration, tendons follow a straight path
        # Calculate the straight-line distance from base to each coupling
        if backbone_lengths and coupling_lengths:
            # Use the MATLAB approach: sum of backbone + coupling lengths
            # This represents the tendon length when robot is straight

            # For a straight robot, use the actual tendon path length as
            # reference
            if is_straight:
                # For straight robot, reference = actual tendon path length
                # This matches the MATLAB approach exactly
                for i in range(num_elements):
                    if i == 0:
                        reference_lengths[:, i] = 0
                    else:
                        # Use the actual tendon path length from routing points
                        # This gives us the true reference length for straight
                        # robot
                        reference_lengths[:, i] = total_lengths[0, i]
            else:
                # For bent robot, use center path as reference
                for i in range(num_elements):
                    if i == 0:
                        reference_lengths[:, i] = 0
                    else:
                        # Calculate cumulative length: sum of backbone +
                        # coupling
                        # lengths up to the current coupling element
                        cumulative_length = 0
                        for j in range(i):
                            if j < len(backbone_lengths):
                                cumulative_length += backbone_lengths[j]
                            if j + 1 < len(coupling_lengths):
                                cumulative_length += coupling_lengths[j + 1]

                        # All tendons have the same reference length in
                        # straight
                        # config
                        reference_lengths[:, i] = cumulative_length
        else:
            # Fallback: use current bent positions (less accurate)
            for i in range(num_elements):
                if i == 0:
                    reference_lengths[:, i] = 0
                else:
                    # Get the base position (first coupling)
                    base_pos = coupling_positions[0]
                    # Get the current coupling position
                    current_pos = coupling_positions[i]
                    # Calculate the straight-line distance from base to current
                    straight_distance = np.linalg.norm(current_pos - base_pos)
                    # All tendons have the same reference length in straight
                    # config
                    reference_lengths[:, i] = straight_distance

        return reference_lengths

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

            # Determine pull direction (corrected sign convention)
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
