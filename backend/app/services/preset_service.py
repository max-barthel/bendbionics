"""Preset service for preset-related database operations."""

from typing import List, Optional

from sqlmodel import Session, select

from app.models.preset import Preset


def get_preset_by_id(session: Session, preset_id: int) -> Optional[Preset]:
    """Get preset by ID."""
    return session.get(Preset, preset_id)


def get_user_presets(session: Session, user_id: int) -> List[Preset]:
    """Get all presets for a user."""
    return session.exec(select(Preset).where(Preset.user_id == user_id)).all()


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
