"""Preset configuration helper utilities.

This module provides shared utilities for normalizing and processing
preset configurations, particularly for tendon radius normalization
and metadata extraction.
"""

from typing import Any, Dict, Optional


def normalize_tendon_radius(configuration: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize tendon radius from single value to array format.

    Converts a single radius value to an array with one value per coupling element,
    or ensures the radius array exists with default values if missing.

    Args:
        configuration: Configuration dictionary

    Returns:
        Normalized configuration dictionary with radius as array
    """
    normalized = configuration.copy()
    tendon_config = normalized.get("tendonConfig")
    if isinstance(tendon_config, dict):
        radius = tendon_config.get("radius")
        segments = normalized.get("segments", 5)
        coupling_count = segments + 1

        # Convert single radius value to array if needed
        if radius is not None and not isinstance(radius, list):
            tendon_config = tendon_config.copy()
            tendon_config["radius"] = [radius] * coupling_count
            normalized["tendonConfig"] = tendon_config
        elif radius is None:
            # Ensure radius array exists
            tendon_config = tendon_config.copy()
            tendon_config["radius"] = [0.01] * coupling_count
            normalized["tendonConfig"] = tendon_config

    return normalized


def extract_preset_metadata(
    configuration: Dict[str, Any],
) -> tuple[Optional[int], Optional[int]]:
    """Extract metadata from configuration.

    Extracts segments count and tendon count from the configuration dictionary
    for use in database metadata columns.

    Args:
        configuration: Configuration dictionary

    Returns:
        Tuple of (segments, tendon_count)
    """
    segments = configuration.get("segments")
    tendon_config = configuration.get("tendonConfig")
    tendon_count = None
    if isinstance(tendon_config, dict):
        tendon_count = tendon_config.get("count")

    return segments, tendon_count

