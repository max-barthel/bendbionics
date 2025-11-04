"""Preset service for preset-related database operations."""

import json
from typing import List, Optional

from sqlmodel import Session, select

from app.models.preset import Preset, PresetCreate, PresetResponse, PresetUpdate
from app.services.db_helpers import save_and_refresh


def create_preset(session: Session, preset_data: PresetCreate, user_id: int) -> Preset:
    """Create a new preset for a user.

    Args:
        session: Database session
        preset_data: Preset creation data
        user_id: ID of the user creating the preset

    Returns:
        Created Preset instance
    """
    preset = Preset(
        name=preset_data.name,
        description=preset_data.description,
        is_public=preset_data.is_public,
        configuration=json.dumps(preset_data.configuration),
        user_id=user_id,
    )

    return save_and_refresh(session, preset)


def get_preset_by_id(session: Session, preset_id: int) -> Optional[Preset]:
    """Get preset by ID."""
    return session.get(Preset, preset_id)


def get_user_presets(session: Session, user_id: int) -> List[Preset]:
    """Get all presets for a user."""
    return session.exec(select(Preset).where(Preset.user_id == user_id)).all()


def delete_user_presets(session: Session, user_id: int) -> None:
    """Delete all presets associated with a user.

    Args:
        session: Database session
        user_id: ID of the user whose presets should be deleted
    """
    presets = session.exec(select(Preset).where(Preset.user_id == user_id)).all()
    for preset in presets:
        session.delete(preset)


def get_public_presets(session: Session) -> List[Preset]:
    """Get all public presets."""
    return session.exec(select(Preset).where(Preset.is_public.is_(True))).all()


def get_preset_for_user(
    session: Session, preset_id: int, user_id: Optional[int] = None
) -> Optional[Preset]:
    """Get preset by ID, checking if user has access.

    Args:
        session: Database session
        preset_id: Preset ID
        user_id: User ID (if provided, allows access to user's private presets)

    Returns:
        Preset if found and accessible, None otherwise
    """
    query = select(Preset).where(Preset.id == preset_id)

    if user_id:
        # User can access their own presets or public presets
        query = query.where((Preset.user_id == user_id) | Preset.is_public.is_(True))
    else:
        # Only public presets if no user
        query = query.where(Preset.is_public.is_(True))

    return session.exec(query).first()


def get_user_preset_by_id(
    session: Session, preset_id: int, user_id: int
) -> Optional[Preset]:
    """Get preset by ID that belongs to a specific user."""
    return session.exec(
        select(Preset).where((Preset.id == preset_id) & (Preset.user_id == user_id))
    ).first()


def update_preset(
    session: Session, preset: Preset, preset_data: PresetUpdate
) -> Preset:
    """Update a preset with new data.

    Args:
        session: Database session
        preset: Preset instance to update
        preset_data: Update data

    Returns:
        Updated Preset instance
    """
    # Update fields if provided
    if preset_data.name is not None:
        preset.name = preset_data.name
    if preset_data.description is not None:
        preset.description = preset_data.description
    if preset_data.is_public is not None:
        preset.is_public = preset_data.is_public
    if preset_data.configuration is not None:
        preset.configuration = json.dumps(preset_data.configuration)

    return save_and_refresh(session, preset)


def delete_preset(session: Session, preset: Preset) -> None:
    """Delete a preset.

    Args:
        session: Database session
        preset: Preset instance to delete
    """
    session.delete(preset)
    session.commit()


def preset_to_response(preset: Preset) -> PresetResponse:
    """Convert Preset model to PresetResponse DTO."""
    return PresetResponse(
        id=preset.id,
        name=preset.name,
        description=preset.description,
        is_public=preset.is_public,
        configuration=preset.config_dict,
        created_at=preset.created_at,
        updated_at=preset.updated_at,
        user_id=preset.user_id,
    )
