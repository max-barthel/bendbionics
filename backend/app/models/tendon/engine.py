"""
Main tendon analysis engine for robot control.
"""

from typing import Any, Dict, List, Protocol

import numpy as np

from app.utils.math_tools import homogeneous_matrix

from .calculator import TendonCalculator
from .types import TendonConfig


class RobotModelInterface(Protocol):
    """
    Protocol defining the interface that any robot model must implement.
    """

    def compute_robot_position(self, params: Any) -> List[List[np.ndarray]]:
        """Compute robot position and return list of segment points."""
        ...

    def get_coupling_elements(self, robot_positions: List[List[np.ndarray]]) -> Dict[str, List]:
        """Extract coupling element data from robot positions."""
        ...


class TendonAnalysisEngine:
    """
    High-level tendon analysis engine that works with any robot model.

    This class orchestrates the tendon calculations and provides a
    unified interface regardless of the underlying robot model.
    """

    def __init__(self, tendon_config: TendonConfig):
        """
        Initialize the tendon analysis engine.

        Args:
            tendon_config: Configuration for tendon routing
        """
        self.tendon_calculator = TendonCalculator(tendon_config)
        self.config = tendon_config

    def analyze_robot_with_tendons(
        self, robot_model: RobotModelInterface, params: Any
    ) -> Dict[str, Any]:
        """
        Analyze any robot model with tendon calculations.

        Args:
            robot_model: Any robot model implementing RobotModelInterface
            params: Parameters for the robot model

        Returns:
            Dictionary containing robot position and tendon analysis
        """
        # Step 1: Use the robot model to compute positions
        robot_positions = robot_model.compute_robot_position(params)

        # Step 2: Extract coupling element data using the model's method
        coupling_data = robot_model.get_coupling_elements(robot_positions)

        # Step 3: Get coupling transformation matrices (4x4 homogeneous matrices)
        # Use "transforms" if available (new format), otherwise construct
        # from positions/orientations
        if "transforms" in coupling_data:
            coupling_transforms = coupling_data["transforms"]
        else:
            # Backward compatibility: construct 4x4 matrices from
            # positions and orientations
            coupling_transforms = []
            positions = coupling_data.get("positions", [])
            orientations = coupling_data.get("orientations", [])
            for pos, orient in zip(positions, orientations):
                transform = homogeneous_matrix(orient, pos)
                coupling_transforms.append(transform)

        # Step 3: Calculate tendon lengths using transformation matrices
        tendon_analysis = self.tendon_calculator.calculate_tendon_lengths(coupling_transforms)

        # Step 4: Get practical actuation commands
        actuation_commands = self.tendon_calculator.get_actuation_commands(
            np.array(tendon_analysis["length_changes"])
        )

        # Step 5: Return comprehensive analysis
        return {
            "robot_positions": robot_positions,
            "coupling_data": {
                "positions": coupling_data["positions"],
                "orientations": coupling_data["orientations"],
            },
            "tendon_analysis": tendon_analysis,
            "actuation_commands": actuation_commands,
            "model_type": getattr(robot_model, "model_type", "unknown"),
            "tendon_config": self.config.model_dump(mode="json"),
        }
