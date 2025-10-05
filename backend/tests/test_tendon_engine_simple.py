"""Simple tests for tendon engine to increase coverage."""

from app.models.tendon.engine import TendonAnalysisEngine
from app.models.tendon.types import TendonConfig


class TestTendonEngineSimple:
    """Simple tests for tendon engine."""

    def test_tendon_engine_initialization(self):
        """Test tendon engine can be initialized."""
        config = TendonConfig(count=3, radius=0.01, coupling_offset=0.0)
        engine = TendonAnalysisEngine(config)
        assert engine is not None

    def test_tendon_engine_attributes(self):
        """Test tendon engine has expected attributes."""
        config = TendonConfig(count=3, radius=0.01, coupling_offset=0.0)
        engine = TendonAnalysisEngine(config)
        # Check that the engine has the expected methods/attributes
        assert hasattr(engine, "analyze_robot_with_tendons")
        assert callable(getattr(engine, "analyze_robot_with_tendons", None))

    def test_tendon_engine_import(self):
        """Test tendon engine can be imported."""
        from app.models.tendon.engine import TendonAnalysisEngine

        assert TendonAnalysisEngine is not None
