import json

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.api.responses import NotFoundError, created_response, success_response
from app.auth import get_current_user
from app.database import get_session
from app.models import Preset, PresetCreate, PresetResponse, PresetUpdate
from app.models.user import User

router = APIRouter(prefix="/presets", tags=["presets"])

# Constants
PRESET_NOT_FOUND_MSG = "Preset not found"


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


@router.post("/")
async def create_preset(
    preset_data: PresetCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Create a new preset for the current user"""

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

    return created_response(
        data=preset_to_response(preset).model_dump(mode="json"),
        message="Preset created successfully",
    )


@router.get("/")
async def get_user_presets(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get all presets for the current user"""

    presets = session.exec(
        select(Preset).where(Preset.user_id == current_user.id)
    ).all()

    preset_responses = [preset_to_response(preset) for preset in presets]

    return success_response(
        data=[pr.model_dump(mode="json") for pr in preset_responses],
        message="User presets retrieved successfully",
    )


@router.get("/public")
async def get_public_presets(session: Session = Depends(get_session)):
    """Get all public presets"""
    presets = session.exec(select(Preset).where(Preset.is_public.is_(True))).all()

    preset_responses = [preset_to_response(preset) for preset in presets]

    return success_response(
        data=[pr.model_dump(mode="json") for pr in preset_responses],
        message="Public presets retrieved successfully",
    )


@router.get("/{preset_id}")
async def get_preset(
    preset_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get a specific preset by ID"""

    preset = session.exec(
        select(Preset).where(
            (Preset.id == preset_id)
            & ((Preset.user_id == current_user.id) | Preset.is_public.is_(True))
        )
    ).first()

    if not preset:
        raise NotFoundError(PRESET_NOT_FOUND_MSG)

    return success_response(
        data=preset_to_response(preset).model_dump(mode="json"),
        message="Preset retrieved successfully",
    )


@router.put("/{preset_id}")
async def update_preset(
    preset_id: int,
    preset_data: PresetUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Update a preset"""

    preset = session.exec(
        select(Preset).where(
            (Preset.id == preset_id) & (Preset.user_id == current_user.id)
        )
    ).first()

    if not preset:
        raise NotFoundError(PRESET_NOT_FOUND_MSG)

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

    return success_response(
        data=preset_to_response(preset).model_dump(mode="json"),
        message="Preset updated successfully",
    )


@router.delete("/{preset_id}")
async def delete_preset(
    preset_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete a preset"""

    preset = session.exec(
        select(Preset).where(
            (Preset.id == preset_id) & (Preset.user_id == current_user.id)
        )
    ).first()

    if not preset:
        raise NotFoundError(PRESET_NOT_FOUND_MSG)

    session.delete(preset)
    session.commit()

    return success_response(
        data={"deleted_id": preset_id}, message="Preset deleted successfully"
    )
