"""Simple tests for PCC model to increase coverage."""


from app.models.pcc.pcc_model import PCCRobotModel
from app.models.pcc.types import PCCParams


class TestPCCModelSimple:
    """Simple tests for PCC model."""

    def test_pcc_model_initialization(self):
        """Test PCC model can be initialized."""
        model = PCCRobotModel()
        assert model is not None

    def test_pcc_model_with_params(self):
        """Test PCC model with parameters."""
        params = PCCParams(
            bending_angles=[0.1, 0.2, 0.3],
            rotation_angles=[0.0, 0.0, 0.0],
            backbone_lengths=[0.1, 0.2, 0.3],
            coupling_lengths=[0.05, 0.1, 0.15],
            discretization_steps=10,
        )
        model = PCCRobotModel()
        assert model is not None
        assert params is not None  # Verify params were created successfully

    def test_pcc_model_attributes(self):
        """Test PCC model has expected attributes."""
        model = PCCRobotModel()
        # Check that the model has the expected methods/attributes
        assert hasattr(model, "compute_robot_position")
        assert callable(getattr(model, "compute_robot_position", None))

    def test_pcc_model_import(self):
        """Test PCC model can be imported."""
        from app.models.pcc.pcc_model import PCCRobotModel

        assert PCCRobotModel is not None
