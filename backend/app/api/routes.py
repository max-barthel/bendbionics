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
            # Convert robot positions (list of numpy arrays)
            serializable_result[key] = [
                [
                    point.tolist() if hasattr(point, "tolist") else point
                    for point in segment
                ]
                for segment in value
            ]
        elif key == "coupling_data":
            # Convert coupling data
            coupling_data = {}
            for sub_key, sub_value in value.items():
                if sub_key == "positions":
                    coupling_data[sub_key] = [
                        pos.tolist() if hasattr(pos, "tolist") else pos
                        for pos in sub_value
                    ]
                elif sub_key == "orientations":
                    coupling_data[sub_key] = [
                        (
                            orient.tolist()
                            if hasattr(orient, "tolist")
                            else orient
                        )
                        for orient in sub_value
                    ]
                else:
                    coupling_data[sub_key] = sub_value
            serializable_result[key] = coupling_data
        elif key == "tendon_analysis":
            # Convert tendon analysis data
            tendon_data = {}
            for sub_key, sub_value in value.items():
                if isinstance(sub_value, np.ndarray):
                    tendon_data[sub_key] = sub_value.tolist()
                elif sub_key == "routing_points":
                    # Convert routing points (nested structure)
                    tendon_data[sub_key] = [
                        [
                            (
                                point.tolist()
                                if hasattr(point, "tolist")
                                else point
                            )
                            for point in element
                        ]
                        for element in sub_value
                    ]
                else:
                    tendon_data[sub_key] = sub_value
            serializable_result[key] = tendon_data
        elif key == "actuation_commands":
            serializable_result[key] = value
        else:
            serializable_result[key] = value

    return serializable_result
