from typing import List

from pydantic import BaseModel


class PCCParams(BaseModel):
    bending_angles: List[float]
    rotation_angles: List[float]
    backbone_lengths: List[float]
    coupling_lengths: List[float]
    discretization_steps: int
