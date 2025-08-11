from typing import List

from pydantic import BaseModel, field_validator


class PCCParams(BaseModel):
    bending_angles: List[float]
    rotation_angles: List[float]
    backbone_lengths: List[float]
    coupling_lengths: List[float]
    discretization_steps: int

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
