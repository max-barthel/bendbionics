import json

import pytest
from app.database import create_db_and_tables, get_session
from app.models import Preset, User
from sqlmodel import Session


class TestDatabaseFunctions:
    """Test database utility functions."""

    def test_create_db_and_tables(self):
        """Test database and tables creation."""
        # This should not raise any exceptions
        try:
            create_db_and_tables()
            assert True  # If we get here, no exception was raised
        except Exception as e:
            pytest.fail(f"create_db_and_tables raised an exception: {e}")

    def test_get_session_generator(self):
        """Test that get_session returns a generator."""
        # get_session is a generator function
        session_gen = get_session()
        assert hasattr(session_gen, "__iter__")

        # Get the first (and only) session
        session = next(session_gen)
        assert isinstance(session, Session)

        # Close the session
        session.close()


class TestDatabaseOperations:
    """Test database operations with real database."""

    def test_user_creation(self):
        """Test creating a user in the database."""
        from app.auth import get_password_hash

        # Get a database session
        session_gen = get_session()
        session = next(session_gen)

        try:
            # Create a test user
            user = User(
                username="testuser_db",
                email="test_db@example.com",
                hashed_password=get_password_hash("testpassword"),
                is_local=False,
                is_active=True,
            )

            # Add to database
            session.add(user)
            session.commit()
            session.refresh(user)

            # Verify user was created
            assert user.id is not None
            assert user.username == "testuser_db"
            assert user.email == "test_db@example.com"
            assert user.is_active is True

            # Clean up
            session.delete(user)
            session.commit()

        finally:
            session.close()

    def test_preset_creation(self):
        """Test creating a preset in the database."""
        from app.auth import get_password_hash

        # Get a database session
        session_gen = get_session()
        session = next(session_gen)

        try:
            # Create a test user first
            user = User(
                username="testuser_preset_2",
                email="test_preset_2@example.com",
                hashed_password=get_password_hash("testpassword"),
                is_local=False,
                is_active=True,
            )
            session.add(user)
            session.commit()
            session.refresh(user)

            # Create a test preset
            preset = Preset(
                name="Test Preset DB",
                description="A test preset for database testing",
                user_id=user.id,
                is_public=False,
                configuration=json.dumps(
                    {
                        "bending_angles": [0.1, 0.2, 0.3],
                        "rotation_angles": [0, 0, 0],
                        "backbone_lengths": [0.07, 0.07, 0.07],
                        "coupling_lengths": [0.03, 0.03, 0.03, 0.015],
                        "discretization_steps": 10,
                    }
                ),
            )

            # Add to database
            session.add(preset)
            session.commit()
            session.refresh(preset)

            # Verify preset was created
            assert preset.id is not None
            assert preset.name == "Test Preset DB"
            assert preset.user_id == user.id
            assert preset.is_public is False
            assert "bending_angles" in preset.config_dict

            # Clean up
            session.delete(preset)
            session.delete(user)
            session.commit()

        finally:
            session.close()

    def test_user_preset_relationship(self):
        """Test user-preset relationship."""
        from app.auth import get_password_hash

        # Get a database session
        session_gen = get_session()
        session = next(session_gen)

        try:
            # Create a test user
            user = User(
                username="testuser_rel_2",
                email="test_rel_2@example.com",
                hashed_password=get_password_hash("testpassword"),
                is_local=False,
                is_active=True,
            )
            session.add(user)
            session.commit()
            session.refresh(user)

            # Create multiple presets for the user
            preset1 = Preset(
                name="Preset 1 DB",
                description="First preset for relationship test",
                user_id=user.id,
                is_public=False,
                configuration=json.dumps({"test": "data1"}),
            )

            preset2 = Preset(
                name="Preset 2 DB",
                description="Second preset for relationship test",
                user_id=user.id,
                is_public=True,
                configuration=json.dumps({"test": "data2"}),
            )

            session.add_all([preset1, preset2])
            session.commit()

            # Query presets for the user
            from sqlmodel import select

            user_presets = session.exec(
                select(Preset).where(Preset.user_id == user.id)
            ).all()
            assert len(user_presets) == 2

            # Query public presets
            public_presets = session.exec(
                select(Preset).where(Preset.is_public.is_(True))
            ).all()
            assert len(public_presets) == 1
            assert public_presets[0].name == "Preset 2 DB"

            # Clean up
            session.delete(preset1)
            session.delete(preset2)
            session.delete(user)
            session.commit()

        finally:
            session.close()

    def test_preset_config_dict_property(self):
        """Test preset config_dict property."""
        # Test valid JSON
        preset = Preset(
            name="Test Preset",
            user_id=1,
            configuration='{"key": "value", "number": 42}',
        )
        assert preset.config_dict == {"key": "value", "number": 42}

        # Test invalid JSON
        preset.configuration = "invalid json"
        assert preset.config_dict == {}

        # Test setting config_dict
        preset.config_dict = {"new_key": "new_value"}
        assert preset.configuration == '{"new_key": "new_value"}'

    def test_preset_models(self):
        """Test PresetCreate and PresetUpdate models."""
        from app.models.preset import PresetCreate, PresetUpdate

        # Test PresetCreate
        preset_create = PresetCreate(
            name="Test Preset",
            description="Test Description",
            is_public=True,
            configuration={"param1": "value1"},
        )
        assert preset_create.name == "Test Preset"
        assert preset_create.is_public is True
        assert preset_create.configuration == {"param1": "value1"}

        # Test PresetUpdate
        preset_update = PresetUpdate(name="Updated Name", is_public=False)
        assert preset_update.name == "Updated Name"
        assert preset_update.is_public is False
        assert preset_update.configuration is None
