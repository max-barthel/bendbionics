from app.models import PCCParams
from app.services.pcc import compute_pcc
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
