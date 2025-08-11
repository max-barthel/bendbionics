from app.models.pcc.model import compute_pcc
from app.models.pcc.types import PCCParams
from app.utils.logging import logger
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

router = APIRouter()


@router.post("/pcc")
async def run_pcc(params: PCCParams):
    try:
        result = compute_pcc(params)
        result_serializable = [
            [point.tolist() for point in segment] for segment in result
        ]
        return {"segments": result_serializable}
    except Exception as e:
        logger.error(f"PCC computation failed: {e}")
        raise HTTPException(status_code=500, detail="Computation failed")


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
