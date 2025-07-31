from pydantic import BaseModel


class PCCParams(BaseModel):
    backbone_lengths: list[float]
    coupling_lengths: list[float]
    bending_angles: list[float]
    rotation_angles: list[float]
    discretization_steps: int
