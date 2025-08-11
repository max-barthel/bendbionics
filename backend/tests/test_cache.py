import numpy as np
from app.models.pcc.types import PCCParams
from app.utils.cache import (
    _computation_cache,
    cache_result,
    clear_cache,
    create_params_hash,
    get_cached_result,
)


class TestCacheFunctionality:
    """Test cases for the caching system."""

    def setup_method(self):
        """Clear cache before each test."""
        clear_cache()

    def test_create_params_hash(self):
        """Test that parameter hashing works correctly."""
        params1 = PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        params2 = PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        # Same parameters should produce same hash
        hash1 = create_params_hash(params1)
        hash2 = create_params_hash(params2)
        assert hash1 == hash2
        assert isinstance(hash1, str)
        assert len(hash1) == 64  # SHA256 hash length

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
            bending_angles=[0.2, 0.3, 0.4],  # Different values
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        hash1 = create_params_hash(params1)
        hash2 = create_params_hash(params2)
        assert hash1 != hash2

    def test_cache_result_and_get_cached_result(self):
        """Test storing and retrieving results from cache."""
        params = PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        # Create a mock result
        mock_result = [
            np.array([[0, 0, 0], [1, 1, 1]]),
            np.array([[2, 2, 2], [3, 3, 3]]),
        ]

        # Initially, no cached result
        cached_result = get_cached_result(params)
        assert cached_result is None

        # Cache the result
        cache_result(params, mock_result)

        # Now should retrieve the cached result
        cached_result = get_cached_result(params)
        assert cached_result is not None
        assert len(cached_result) == len(mock_result)

        # Check that the cached result matches the original
        for i, segment in enumerate(cached_result):
            np.testing.assert_array_equal(segment, mock_result[i])

    def test_cache_miss_scenario(self):
        """Test cache miss when parameters don't match."""
        params1 = PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        params2 = PCCParams(
            bending_angles=[0.2, 0.3, 0.4],  # Different parameters
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        mock_result = [np.array([[0, 0, 0], [1, 1, 1]])]

        # Cache result for params1
        cache_result(params1, mock_result)

        # Try to get cached result for params2 (should miss)
        cached_result = get_cached_result(params2)
        assert cached_result is None

        # Should still get cached result for params1
        cached_result = get_cached_result(params1)
        assert cached_result is not None

    def test_cache_size_limits(self):
        """Test that cache size is limited to prevent memory issues."""
        # Clear cache first
        clear_cache()

        # Add more than 100 entries to trigger size limit
        for i in range(105):
            params = PCCParams(
                bending_angles=[float(i), 0.2, 0.3],
                rotation_angles=[0, 0, 0],
                backbone_lengths=[0.07, 0.07, 0.07],
                coupling_lengths=[0.03, 0.03, 0.03, 0.015],
                discretization_steps=10,
            )
            mock_result = [np.array([[i, i, i], [i + 1, i + 1, i + 1]])]
            cache_result(params, mock_result)

        # Cache should be limited to 100 entries
        assert len(_computation_cache) <= 100

        # Oldest entries should be removed (FIFO)
        # Check that some recent entries still exist
        recent_params = PCCParams(
            bending_angles=[104.0, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )
        recent_result = get_cached_result(recent_params)
        assert recent_result is not None

    def test_clear_cache(self):
        """Test that cache clearing works correctly."""
        params = PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        mock_result = [np.array([[0, 0, 0], [1, 1, 1]])]

        # Cache a result
        cache_result(params, mock_result)
        assert len(_computation_cache) > 0

        # Clear cache
        clear_cache()
        assert len(_computation_cache) == 0

        # Should not find cached result after clearing
        cached_result = get_cached_result(params)
        assert cached_result is None

    def test_cache_with_different_discretization_steps(self):
        """Test that different discretization steps are cached separately."""
        params1 = PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        params2 = PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=100,  # Different discretization
        )

        mock_result1 = [np.array([[0, 0, 0], [1, 1, 1]])]
        mock_result2 = [np.array([[2, 2, 2], [3, 3, 3]])]

        # Cache both results
        cache_result(params1, mock_result1)
        cache_result(params2, mock_result2)

        # Should retrieve correct results
        cached1 = get_cached_result(params1)
        cached2 = get_cached_result(params2)

        assert cached1 is not None
        assert cached2 is not None
        # Check that the cached results are different
        assert len(cached1) == len(cached2)  # Same number of segments
        # But the actual data should be different
        assert not np.array_equal(cached1[0], cached2[0])

    def test_cache_hash_consistency(self):
        """Test that hash generation is consistent across different calls."""
        params = PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        # Generate hash multiple times
        hash1 = create_params_hash(params)
        hash2 = create_params_hash(params)
        hash3 = create_params_hash(params)

        # All hashes should be identical
        assert hash1 == hash2 == hash3

    def test_cache_with_empty_arrays(self):
        """Test caching behavior with edge case parameters."""
        params = PCCParams(
            bending_angles=[0.0, 0.0, 0.0],  # All zeros
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=1,  # Minimum discretization
        )

        mock_result = [np.array([[0, 0, 0]])]

        # Should cache and retrieve correctly
        cache_result(params, mock_result)
        cached_result = get_cached_result(params)

        assert cached_result is not None
        assert len(cached_result) == len(mock_result)

    def test_cache_performance(self):
        """Test that cache retrieval is fast."""
        import time

        params = PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0, 0, 0],
            backbone_lengths=[0.07, 0.07, 0.07],
            coupling_lengths=[0.03, 0.03, 0.03, 0.015],
            discretization_steps=10,
        )

        mock_result = [np.array([[0, 0, 0], [1, 1, 1]])]

        # Cache the result
        cache_result(params, mock_result)

        # Measure retrieval time
        start_time = time.time()
        cached_result = get_cached_result(params)
        end_time = time.time()

        retrieval_time = end_time - start_time

        assert cached_result is not None
        assert retrieval_time < 0.001  # Should be very fast (< 1ms)
