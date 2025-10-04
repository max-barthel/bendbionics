import numpy as np
from fastapi import APIRouter
from fastapi.responses import Response

from app.api.responses import ComputationError, success_response
from app.models.pcc.model import compute_pcc
from app.models.pcc.pcc_model import compute_pcc_with_tendons
from app.models.pcc.types import PCCParams
from app.utils.logging import logger

router = APIRouter()


@router.post("/pcc")
async def run_pcc(params: PCCParams):
    """Compute PCC (Piecewise Constant Curvature) robot configuration."""
    try:
        result = compute_pcc(params)
        result_serializable = [
            [point.tolist() for point in segment] for segment in result
        ]

        return success_response(
            data={"segments": result_serializable},
            message="PCC computation completed successfully",
        )
    except Exception as e:
        logger.error(f"PCC computation failed: {e}")
        raise ComputationError(
            message="PCC computation failed", details={"error": str(e)}
        )


@router.post("/pcc-with-tendons")
async def run_pcc_with_tendons(params: PCCParams):
    """Compute PCC robot configuration with tendon analysis."""
    try:
        result = compute_pcc_with_tendons(params)
        # Convert numpy arrays to lists for JSON serialization
        result_serializable = _convert_result_to_serializable(result)

        return success_response(
            data={"result": result_serializable},
            message="PCC with tendons computation completed successfully",
        )
    except Exception as e:
        logger.error(f"PCC with tendons computation failed: {e}")
        raise ComputationError(
            message="PCC with tendons computation failed",
            details={"error": str(e)},
        )


@router.options("/pcc")
async def options_pcc():
    """Handle CORS preflight requests."""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    )


def _convert_result_to_serializable(result: dict) -> dict:
    """Convert numpy arrays in result to lists for JSON serialization."""
    serializable_result = {}

    for key, value in result.items():
        if key == "robot_positions":
            serializable_result[key] = _convert_robot_positions(value)
        elif key == "coupling_data":
            serializable_result[key] = _convert_coupling_data(value)
        elif key == "tendon_analysis":
            serializable_result[key] = _convert_tendon_analysis(value)
        else:
            serializable_result[key] = value

    return serializable_result


def _convert_robot_positions(value):
    """Convert robot positions to serializable format."""
    return [
        [
            point.tolist() if hasattr(point, "tolist") else point
            for point in segment
        ]
        for segment in value
    ]


def _convert_coupling_data(value):
    """Convert coupling data to serializable format."""
    coupling_data = {}
    for sub_key, sub_value in value.items():
        if sub_key == "positions":
            coupling_data[sub_key] = _convert_positions(sub_value)
        elif sub_key == "orientations":
            coupling_data[sub_key] = _convert_orientations(sub_value)
        else:
            coupling_data[sub_key] = sub_value
    return coupling_data


def _convert_positions(positions):
    """Convert positions to serializable format."""
    return [
        pos.tolist() if hasattr(pos, "tolist") else pos
        for pos in positions
    ]


def _convert_orientations(orientations):
    """Convert orientations to serializable format."""
    return [
        orient.tolist() if hasattr(orient, "tolist") else orient
        for orient in orientations
    ]


def _convert_tendon_analysis(value):
    """Convert tendon analysis data to serializable format."""
    tendon_data = {}
    for sub_key, sub_value in value.items():
        if isinstance(sub_value, np.ndarray):
            tendon_data[sub_key] = sub_value.tolist()
        elif sub_key == "routing_points":
            tendon_data[sub_key] = _convert_routing_points(sub_value)
        else:
            tendon_data[sub_key] = sub_value
    return tendon_data


def _convert_routing_points(routing_points):
    """Convert routing points to serializable format."""
    return [
        [
            point.tolist() if hasattr(point, "tolist") else point
            for point in element
        ]
        for element in routing_points
    ]
