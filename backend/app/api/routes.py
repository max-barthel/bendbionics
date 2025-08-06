from app.models.pcc.model import compute_pcc
from app.models.pcc.types import PCCParams
from fastapi import APIRouter

router = APIRouter()


@router.post("/pcc")
def run_pcc(params: PCCParams):
    result = compute_pcc(params)
    # Convert all NumPy arrays in the result to native lists
    result_serializable = [
        [point.tolist() for point in segment] for segment in result
    ]
    return {"segments": result_serializable}
