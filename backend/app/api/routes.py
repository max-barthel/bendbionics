from app.models import PCCParams
from app.services.pcc import compute_pcc
from fastapi import APIRouter

router = APIRouter()


@router.post("/pcc")
def run_pcc(params: PCCParams):
    # Already a list of lists (not numpy), so no need to convert again
    result = compute_pcc(params)
    return {"points": result}
