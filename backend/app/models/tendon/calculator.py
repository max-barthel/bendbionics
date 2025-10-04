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
        """Calculate reference tendon lengths for straight configuration."""
        num_elements = len(coupling_positions)
        num_tendons = self.config.count
        reference_lengths = np.zeros((num_tendons, num_elements))

        if backbone_lengths and coupling_lengths:
            if is_straight:
                self._calculate_straight_reference(
                    reference_lengths, total_lengths, num_elements
                )
            else:
                self._calculate_bent_reference(
                    reference_lengths, backbone_lengths, coupling_lengths, num_elements
                )
        else:
            self._calculate_fallback_reference(
                reference_lengths, coupling_positions, num_elements
            )

        return reference_lengths

    def _calculate_straight_reference(
        self,
        reference_lengths: np.ndarray,
        total_lengths: np.ndarray,
        num_elements: int,
    ):
        """Calculate reference for straight robot configuration."""
        for i in range(num_elements):
            if i == 0:
                reference_lengths[:, i] = 0
            else:
                reference_lengths[:, i] = total_lengths[0, i]

    def _calculate_bent_reference(
        self,
        reference_lengths: np.ndarray,
        backbone_lengths: List[float],
        coupling_lengths: List[float],
        num_elements: int,
    ):
        """Calculate reference for bent robot configuration."""
        for i in range(num_elements):
            if i == 0:
                reference_lengths[:, i] = 0
            else:
                cumulative_length = self._calculate_cumulative_length(
                    backbone_lengths, coupling_lengths, i
                )
                reference_lengths[:, i] = cumulative_length

    def _calculate_cumulative_length(
        self, backbone_lengths: List[float], coupling_lengths: List[float], i: int
    ) -> float:
        """Calculate cumulative length up to element i."""
        cumulative_length = 0
        for j in range(i):
            if j < len(backbone_lengths):
                cumulative_length += backbone_lengths[j]
            if j + 1 < len(coupling_lengths):
                cumulative_length += coupling_lengths[j + 1]
        return cumulative_length

    def _calculate_fallback_reference(
        self,
        reference_lengths: np.ndarray,
        coupling_positions: List[np.ndarray],
        num_elements: int,
    ):
        """Calculate fallback reference using straight-line distances."""
        for i in range(num_elements):
            if i == 0:
                reference_lengths[:, i] = 0
            else:
                base_pos = coupling_positions[0]
                current_pos = coupling_positions[i]
                straight_distance = np.linalg.norm(current_pos - base_pos)
                reference_lengths[:, i] = straight_distance

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
