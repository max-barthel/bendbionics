from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api.responses import NotFoundError, created_response, success_response
from app.auth import get_current_user
from app.database import get_session
from app.models import PresetCreate, PresetUpdate
from app.models.user import User
from app.services.preset_service import (
    create_preset as create_preset_service,
)
from app.services.preset_service import (
    get_preset_for_user,
    get_user_preset_by_id,
    preset_to_response,
)
from app.services.preset_service import (
    get_public_presets as get_public_presets_service,
)
from app.services.preset_service import (
    get_user_presets as get_user_presets_service,
)
from app.services.preset_service import (
    update_preset as update_preset_service,
)

router = APIRouter(prefix="/presets", tags=["presets"])

# Constants
PRESET_NOT_FOUND_MSG = "Preset not found"


@router.post("/")
async def create_preset(
    preset_data: PresetCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Create a new preset for the current user"""

    preset = create_preset_service(session, preset_data, current_user.id)

    return created_response(
        data=preset_to_response(preset),
        message="Preset created successfully",
    )


@router.get("/")
async def get_user_presets(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get all presets for the current user"""

    presets = get_user_presets_service(session, current_user.id)

    preset_responses = [preset_to_response(preset) for preset in presets]

    return success_response(
        data=preset_responses,
        message="User presets retrieved successfully",
    )


@router.get("/public")
async def get_public_presets(session: Session = Depends(get_session)):
    """Get all public presets"""
    presets = get_public_presets_service(session)

    preset_responses = [preset_to_response(preset) for preset in presets]

    return success_response(
        data=preset_responses,
        message="Public presets retrieved successfully",
    )


@router.get("/{preset_id}")
async def get_preset(
    preset_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get a specific preset by ID"""

    preset = get_preset_for_user(session, preset_id, current_user.id)

    if not preset:
        raise NotFoundError(PRESET_NOT_FOUND_MSG)

    return success_response(
        data=preset_to_response(preset),
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

    preset = get_user_preset_by_id(session, preset_id, current_user.id)

    if not preset:
        raise NotFoundError(PRESET_NOT_FOUND_MSG)

    updated_preset = update_preset_service(session, preset, preset_data)

    return success_response(
        data=preset_to_response(updated_preset),
        message="Preset updated successfully",
    )


@router.delete("/{preset_id}")
async def delete_preset(
    preset_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete a preset"""

    preset = get_user_preset_by_id(session, preset_id, current_user.id)

    if not preset:
        raise NotFoundError(PRESET_NOT_FOUND_MSG)

    session.delete(preset)
    session.commit()

    return success_response(
        data={"deleted_id": preset_id}, message="Preset deleted successfully"
    )
