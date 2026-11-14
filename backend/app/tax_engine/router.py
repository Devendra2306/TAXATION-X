from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
from .calculator import compute_regimes
from .slabs import DEFAULT_ASSESSMENT_YEAR
from app.core.assessment_year import validate_assessment_year

router = APIRouter(prefix="/api/tax", tags=["tax"])

class TaxComputationRequest(BaseModel):
    gross_salary: float
    standard_deduction: float = 75000.0
    chapter_vi_a_deductions: float = 0.0
    total_tax_deducted: float = 0.0
    assessment_year: str = Field(default=DEFAULT_ASSESSMENT_YEAR)

@router.post("/compute-direct")
async def compute_tax_endpoint(request: TaxComputationRequest):
    ay = validate_assessment_year(request.assessment_year)
    result = compute_regimes(
        gross_salary=request.gross_salary,
        other_income=0.0,
        deductions_80c=request.chapter_vi_a_deductions,
        home_loan_interest=0.0,
        tds_deducted=request.total_tax_deducted,
        assessment_year=ay
    )
    return result
