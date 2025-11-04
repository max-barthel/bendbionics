from fastapi import APIRouter
from fastapi.responses import Response

from app.api.responses import success_response
from app.models.pcc.model import compute_pcc
from app.models.pcc.pcc_model import compute_pcc_with_tendons
from app.models.pcc.types import PCCParams
from app.utils.serialization import convert_result_to_serializable

router = APIRouter()


@router.post("/pcc")
async def run_pcc(params: PCCParams):
    """Compute PCC (Piecewise Constant Curvature) robot configuration."""
    result = compute_pcc(params)
    result_serializable = [[point.tolist() for point in segment] for segment in result]

    return success_response(
        data={"segments": result_serializable},
        message="PCC computation completed successfully",
    )


@router.options("/pcc")
async def options_pcc():
    """Handle CORS preflight requests.

    Note: CORS middleware should handle OPTIONS requests, but FastAPI requires
    an explicit route handler to avoid 405 errors. The middleware will add
    CORS headers to this response.
    """
    # Return empty response - CORS middleware will add headers after this handler
    return Response(status_code=200)


@router.post("/pcc-with-tendons")
async def run_pcc_with_tendons(params: PCCParams):
    """Compute PCC robot configuration with tendon analysis."""
    result = compute_pcc_with_tendons(params)
    # Convert numpy arrays to lists for JSON serialization
    result_serializable = convert_result_to_serializable(result)

    return success_response(
        data={"result": result_serializable},
        message="PCC with tendons computation completed successfully",
    )
