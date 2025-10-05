import numpy as np
from app.models.pcc.types import PCCParams
from app.utils.cache import (
    cache_result,
    clear_cache,
    create_params_hash,
    get_cached_result,
)


class TestCacheFunctions:
    """Test cache utility functions."""

    def setup_method(self):
        """Clear cache before each test."""
        clear_cache()

    def test_create_params_hash(self):
        """Test creating hash from PCC parameters."""
        params = PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        hash1 = create_params_hash(params)
        hash2 = create_params_hash(params)

        # Same parameters should produce same hash
        assert hash1 == hash2
        assert isinstance(hash1, str)
        assert len(hash1) == 64  # SHA256 hex digest length

    def test_create_params_hash_different_params(self):
        """Test that different parameters produce different hashes."""
        params1 = PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        params2 = PCCParams(
            bending_angles=[0.2, 0.3, 0.4],  # Different angles
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        hash1 = create_params_hash(params1)
        hash2 = create_params_hash(params2)

        # Different parameters should produce different hashes
        assert hash1 != hash2

    def test_cache_result_and_get_cached_result(self):
        """Test caching and retrieving results."""
        params = PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        # Create some test results
        result = [
            np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]),
            np.array([[1, 0, 0, 1], [0, 1, 0, 1], [0, 0, 1, 1], [0, 0, 0, 1]]),
        ]

        # Initially, no cached result
        cached = get_cached_result(params)
        assert cached is None

        # Cache the result
        cache_result(params, result)

        # Now should get the cached result
        cached = get_cached_result(params)
        assert cached is not None
        assert len(cached) == len(result)
        assert all(np.array_equal(cached[i], result[i]) for i in range(len(result)))

    def test_cache_result_different_params(self):
        """Test that different parameters don't interfere with each other."""
        params1 = PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        params2 = PCCParams(
            bending_angles=[0.2, 0.3, 0.4],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        result1 = [np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]])]
        result2 = [np.array([[2, 0, 0, 0], [0, 2, 0, 0], [0, 0, 2, 0], [0, 0, 0, 1]])]

        # Cache both results
        cache_result(params1, result1)
        cache_result(params2, result2)

        # Should get correct results for each
        cached1 = get_cached_result(params1)
        cached2 = get_cached_result(params2)

        assert cached1 is not None
        assert cached2 is not None
        assert np.array_equal(cached1[0], result1[0])
        assert np.array_equal(cached2[0], result2[0])

    def test_clear_cache(self):
        """Test clearing the cache."""
        params = PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        result = [np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]])]

        # Cache a result
        cache_result(params, result)
        assert get_cached_result(params) is not None

        # Clear cache
        clear_cache()

        # Should be empty now
        assert get_cached_result(params) is None

    def test_cache_size_limit(self):
        """Test that cache size is limited to prevent memory issues."""
        # Create many different parameter sets
        for i in range(110):  # More than the 100 limit
            params = PCCParams(
                bending_angles=[0.1 + i * 0.01, 0.2, 0.3],
                rotation_angles=[0, 0, 0],
                backbone_lengths=[0.07, 0.07, 0.07],
                coupling_lengths=[0.03, 0.03, 0.03, 0.015],
                discretization_steps=10,
            )
            result = [
                np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]])
            ]
            cache_result(params, result)

        # The cache should not exceed 100 entries
        # We can't directly access the internal cache, but we can verify
        # that some of the later entries are cached and some earlier ones are not
        early_params = PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        late_params = PCCParams(
            bending_angles=[1.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        # The late entry should be cached (it was added last)
        assert get_cached_result(late_params) is not None
        # The early entry should not be cached (it was evicted due to size limit)
        assert get_cached_result(early_params) is None
