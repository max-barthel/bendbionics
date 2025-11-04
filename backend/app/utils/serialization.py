"""
Serialization utilities for converting numpy arrays and complex data structures
to JSON-serializable formats.
"""

from typing import Any, Dict, List

import numpy as np


def convert_result_to_serializable(result: dict) -> dict:
    """Convert numpy arrays in result to lists for JSON serialization."""
    serializable_result = {}

    for key, value in result.items():
        if key == "robot_positions":
            serializable_result[key] = convert_robot_positions(value)
        elif key == "coupling_data":
            serializable_result[key] = convert_coupling_data(value)
        elif key == "tendon_analysis":
            serializable_result[key] = convert_tendon_analysis(value)
        else:
            serializable_result[key] = value

    return serializable_result


def convert_robot_positions(value: List) -> List:
    """Convert robot positions to serializable format."""
    return [
        [point.tolist() if hasattr(point, "tolist") else point for point in segment]
        for segment in value
    ]


def convert_coupling_data(value: Dict[str, Any]) -> Dict[str, Any]:
    """Convert coupling data to serializable format."""
    coupling_data = {}
    for sub_key, sub_value in value.items():
        if sub_key == "positions":
            coupling_data[sub_key] = convert_positions(sub_value)
        elif sub_key == "orientations":
            coupling_data[sub_key] = convert_orientations(sub_value)
        else:
            coupling_data[sub_key] = sub_value
    return coupling_data


def convert_positions(positions: List) -> List:
    """Convert positions to serializable format."""
    return [pos.tolist() if hasattr(pos, "tolist") else pos for pos in positions]


def convert_orientations(orientations: List) -> List:
    """Convert orientations to serializable format."""
    return [
        orient.tolist() if hasattr(orient, "tolist") else orient
        for orient in orientations
    ]


def convert_tendon_analysis(value: Dict[str, Any]) -> Dict[str, Any]:
    """Convert tendon analysis data to serializable format."""
    tendon_data = {}
    for sub_key, sub_value in value.items():
        if isinstance(sub_value, np.ndarray):
            tendon_data[sub_key] = sub_value.tolist()
        elif sub_key == "routing_points":
            tendon_data[sub_key] = convert_routing_points(sub_value)
        else:
            tendon_data[sub_key] = sub_value
    return tendon_data


def convert_routing_points(routing_points: List) -> List:
    """Convert routing points to serializable format."""
    return [
        [point.tolist() if hasattr(point, "tolist") else point for point in element]
        for element in routing_points
    ]
