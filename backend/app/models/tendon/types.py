"""
Tendon system types and configuration.
"""

import numpy as np
from pydantic import BaseModel, field_validator


class TendonConfig(BaseModel):
    """Configuration for tendon routing in the robot."""

    count: int = 3  # Number of tendons
    radius: float = 0.03  # Distance from center to tendon eyelets (m)
    coupling_offset: float = 0.0  # Vertical offset of eyelets (m)

    @field_validator("count")
    @classmethod
    def validate_tendon_count(cls, v):
        if v < 3:
            msg = "Must have at least 3 tendons for stability"
            raise ValueError(msg)
        if v > 12:
            msg = "Tendon count cannot exceed 12 for practical reasons"
            raise ValueError(msg)
        return v

    @field_validator("radius")
    @classmethod
    def validate_radius(cls, v):
        if v <= 0:
            msg = "Tendon radius must be positive"
            raise ValueError(msg)
        if v > 0.1:  # Max 10cm
            msg = "Radius cannot exceed 10cm"
            raise ValueError(msg)
        return v

    @field_validator("coupling_offset")
    @classmethod
    def validate_offset(cls, v):
        if abs(v) > 0.05:  # 5cm max offset
            msg = "Coupling offset cannot exceed 5cm"
            raise ValueError(msg)
        return v


class TendonPoint:
    """Represents a 3D point in space."""

    def __init__(self, x: float, y: float, z: float):
        self.x = x
        self.y = y
        self.z = z

    def to_array(self) -> np.ndarray:
        """Convert to numpy array."""
        return np.array([self.x, self.y, self.z])

    def distance_to(self, other: "TendonPoint") -> float:
        """Calculate distance to another point."""
        return np.linalg.norm(self.to_array() - other.to_array())

    @classmethod
    def from_array(cls, arr: np.ndarray) -> "TendonPoint":
        """Create from numpy array."""
        return cls(float(arr[0]), float(arr[1]), float(arr[2]))


class TendonRouting:
    """Represents tendon routing between coupling elements."""

    def __init__(self, start_point: TendonPoint, end_point: TendonPoint):
        self.start_point = start_point
        self.end_point = end_point
        self.length = start_point.distance_to(end_point)

    def get_midpoint(self) -> TendonPoint:
        """Get the midpoint of the tendon routing."""
        mid_x = (self.start_point.x + self.end_point.x) / 2
        mid_y = (self.start_point.y + self.end_point.y) / 2
        mid_z = (self.start_point.z + self.end_point.z) / 2
        return TendonPoint(mid_x, mid_y, mid_z)
