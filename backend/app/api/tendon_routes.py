"""
API routes for tendon calculations and robot control.

This module provides endpoints for:
- Calculating tendon lengths for a given robot configuration
- Computing tendon actuation requirements
- Analyzing robot kinematics with tendon routing
"""

from typing import Any, Dict

from app.auth import get_current_user
from app.models.pcc.pcc_model import compute_pcc_with_tendons
from app.models.pcc.types import PCCParams
from app.models.user import User
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(prefix="/tendons", tags=["tendons"])


@router.post("/calculate")
async def calculate_tendon_lengths(
    params: PCCParams, current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Calculate tendon lengths and actuation requirements for a robot
    configuration.

    This endpoint takes robot parameters and returns:
    - Robot position in 3D space
    - Tendon routing points
    - Tendon lengths and required actuation
    """
    try:
        result = compute_pcc_with_tendons(params)
        return {
            "success": True,
            "data": result,
            "message": "Tendon calculation completed successfully",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating tendon lengths: {str(e)}",
        )


@router.post("/analyze")
async def analyze_tendon_configuration(
    params: PCCParams, current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Analyze tendon configuration and return detailed results.

    This endpoint provides comprehensive tendon analysis including:
    - Coupling element positions and orientations
    - Tendon routing visualization data
    - Actuation commands for control
    """
    try:
        result = compute_pcc_with_tendons(params)

        # Extract key information for analysis
        analysis = {
            "coupling_data": result.get("coupling_data", {}),
            "tendon_analysis": result.get("tendon_analysis", {}),
            "actuation_commands": result.get("actuation_commands", {}),
            "tendon_config": result.get("tendon_config", {}),
        }

        return {
            "success": True,
            "data": analysis,
            "message": "Tendon analysis completed successfully",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing tendon configuration: {str(e)}",
        )
