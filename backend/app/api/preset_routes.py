import json
from typing import List

from app.auth import get_current_user, security
from app.database import get_session
from app.models import Preset, PresetCreate, PresetResponse, PresetUpdate
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlmodel import Session, select

router = APIRouter(prefix="/presets", tags=["presets"])


@router.post("/", response_model=PresetResponse)
async def create_preset(
    preset_data: PresetCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
):
    """Create a new preset for the current user"""
    current_user = get_current_user(credentials, session)

    preset = Preset(
        name=preset_data.name,
        description=preset_data.description,
        is_public=preset_data.is_public,
        configuration=json.dumps(preset_data.configuration),
        user_id=current_user.id,
    )

    session.add(preset)
    session.commit()
    session.refresh(preset)

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


@router.get("/", response_model=List[PresetResponse])
async def get_user_presets(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
):
    """Get all presets for the current user"""
    current_user = get_current_user(credentials, session)

    presets = session.exec(
        select(Preset).where(Preset.user_id == current_user.id)
    ).all()

    return [
        PresetResponse(
            id=preset.id,
            name=preset.name,
            description=preset.description,
            is_public=preset.is_public,
            configuration=preset.config_dict,
            created_at=preset.created_at,
            updated_at=preset.updated_at,
            user_id=preset.user_id,
        )
        for preset in presets
    ]


@router.get("/public", response_model=List[PresetResponse])
async def get_public_presets(session: Session = Depends(get_session)):
    """Get all public presets"""
    presets = session.exec(
        select(Preset).where(Preset.is_public.is_(True))
    ).all()

    return [
        PresetResponse(
            id=preset.id,
            name=preset.name,
            description=preset.description,
            is_public=preset.is_public,
            configuration=preset.config_dict,
            created_at=preset.created_at,
            updated_at=preset.updated_at,
            user_id=preset.user_id,
        )
        for preset in presets
    ]


@router.get("/{preset_id}", response_model=PresetResponse)
async def get_preset(
    preset_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
):
    """Get a specific preset by ID"""
    current_user = get_current_user(credentials, session)

    preset = session.exec(
        select(Preset).where(
            (Preset.id == preset_id)
            & (
                (Preset.user_id == current_user.id)
                | Preset.is_public.is_(True)
            )
        )
    ).first()

    if not preset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Preset not found"
        )

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


@router.put("/{preset_id}", response_model=PresetResponse)
async def update_preset(
    preset_id: int,
    preset_data: PresetUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
):
    """Update a preset"""
    current_user = get_current_user(credentials, session)

    preset = session.exec(
        select(Preset).where(
            (Preset.id == preset_id) & (Preset.user_id == current_user.id)
        )
    ).first()

    if not preset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Preset not found"
        )

    # Update fields if provided
    if preset_data.name is not None:
        preset.name = preset_data.name
    if preset_data.description is not None:
        preset.description = preset_data.description
    if preset_data.is_public is not None:
        preset.is_public = preset_data.is_public
    if preset_data.configuration is not None:
        preset.configuration = json.dumps(preset_data.configuration)

    session.add(preset)
    session.commit()
    session.refresh(preset)

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


@router.delete("/{preset_id}")
async def delete_preset(
    preset_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
):
    """Delete a preset"""
    current_user = get_current_user(credentials, session)

    preset = session.exec(
        select(Preset).where(
            (Preset.id == preset_id) & (Preset.user_id == current_user.id)
        )
    ).first()

    if not preset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Preset not found"
        )

    session.delete(preset)
    session.commit()

    return {"message": "Preset deleted successfully"}
