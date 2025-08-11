from hashlib import sha256
from json import dumps
from typing import Dict, List

import numpy as np
from app.models.pcc.types import PCCParams


def create_params_hash(params: PCCParams) -> str:
    """Create a hash of the PCC parameters for caching."""
    # Convert params to a JSON-serializable dict
    params_dict = {
        "bending_angles": params.bending_angles,
        "rotation_angles": params.rotation_angles,
        "backbone_lengths": params.backbone_lengths,
        "coupling_lengths": params.coupling_lengths,
        "discretization_steps": params.discretization_steps,
    }

    # Create hash from JSON string
    params_json = dumps(params_dict, sort_keys=True)
    return sha256(params_json.encode()).hexdigest()


# Cache for storing computation results
_computation_cache: Dict[str, List[np.ndarray]] = {}


def get_cached_result(params: PCCParams) -> List[np.ndarray] | None:
    """Get cached result if available."""
    params_hash = create_params_hash(params)
    return _computation_cache.get(params_hash)


def cache_result(params: PCCParams, result: List[np.ndarray]) -> None:
    """Cache the computation result."""
    params_hash = create_params_hash(params)
    _computation_cache[params_hash] = result

    # Limit cache size to prevent memory issues
    if len(_computation_cache) > 100:
        # Remove oldest entries (simple FIFO)
        oldest_key = next(iter(_computation_cache))
        del _computation_cache[oldest_key]


def clear_cache() -> None:
    """Clear all cached results."""
    _computation_cache.clear()
