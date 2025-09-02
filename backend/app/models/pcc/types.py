from typing import Any, Dict, List, Protocol

import numpy as np
from pydantic import BaseModel, field_validator

from ..tendon.types import TendonConfig


class RobotModelInterface(Protocol):
    """
    Protocol defining the interface that any robot model must implement
    to work with the tendon calculation system.

    This makes the tendon system completely model-agnostic.
    """

    def compute_robot_position(self, params: Any) -> List[List[np.ndarray]]:
        """Compute robot position and return list of segment points."""
        ...

    def get_coupling_elements(
        self, robot_positions: List[List[np.ndarray]]
    ) -> Dict[str, List]:
        """Extract coupling element data from robot positions."""
        ...


class PCCParams(BaseModel):
    bending_angles: List[float]
    rotation_angles: List[float]
    backbone_lengths: List[float]
    coupling_lengths: List[float]
    discretization_steps: int
    tendon_config: TendonConfig = TendonConfig()  # Default tendon config

    @field_validator(
        "bending_angles",
        "rotation_angles",
        "backbone_lengths",
        "coupling_lengths",
    )
    @classmethod
    def validate_non_empty_arrays(cls, v):
        if not v:
            raise ValueError("Arrays cannot be empty")
        return v

    @field_validator("discretization_steps")
    @classmethod
    def validate_discretization_steps(cls, v):
        if v <= 0:
            raise ValueError("Discretization steps must be positive")
        if v > 10000:
            raise ValueError("Discretization steps cannot exceed 10000")
        return v
