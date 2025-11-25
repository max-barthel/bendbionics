"""
Serialization utilities for converting numpy arrays and complex data structures
to JSON-serializable formats.
"""

from typing import Any

import numpy as np


def convert_numpy_to_serializable(value: Any) -> Any:
    """
    Recursively convert numpy arrays and scalars to JSON-serializable types.

    This function handles:
    - numpy arrays -> lists
    - numpy scalars -> Python native types
    - nested dicts, lists, tuples -> recursively converted
    - other types -> returned as-is

    Args:
        value: Any value that may contain numpy arrays

    Returns:
        JSON-serializable equivalent of the input
    """
    # Handle numpy arrays
    if isinstance(value, np.ndarray):
        return value.tolist()

    # Handle numpy scalars (e.g., np.float64, np.int32)
    if isinstance(value, (np.integer, np.floating)):
        return value.item()

    # Handle numpy dtype objects
    if isinstance(value, np.generic):
        return value.item()

    # Handle dicts - recursively convert values
    if isinstance(value, dict):
        return {key: convert_numpy_to_serializable(val) for key, val in value.items()}

    # Handle lists and tuples - recursively convert items
    if isinstance(value, (list, tuple)):
        return [convert_numpy_to_serializable(item) for item in value]

    # Return primitives and other types as-is
    return value


def convert_result_to_serializable(result: dict) -> dict:
    """
    Convert numpy arrays in result to lists for JSON serialization.

    This function now recursively handles all nested structures and numpy arrays,
    ensuring complete serialization of the result dictionary.
    """
    # Use recursive conversion for all values
    return convert_numpy_to_serializable(result)
