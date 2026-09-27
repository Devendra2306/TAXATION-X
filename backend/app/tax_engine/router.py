from fastapi import APIRouter
from pydantic import BaseModel
from .calculator import compute_taxes

router = APIRouter(prefix="/api/tax", tags=["tax"])

class TaxComputationRequest(BaseModel):
    gross_salary: float
    standard_deduction: float
    chapter_vi_a_deductions: float
    total_tax_deducted: float

@router.post("/compute")
async def compute_tax_endpoint(request: TaxComputationRequest):
    result = compute_taxes(
        gross_salary=request.gross_salary,
        standard_deduction=request.standard_deduction,
        chapter_vi_a_deductions=request.chapter_vi_a_deductions,
        tds=request.total_tax_deducted
    )
    return result
