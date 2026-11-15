from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from .calculator import compute_regimes
from .slabs import UnsupportedAssessmentYear
from app.core.assessment_year import validate_assessment_year

router = APIRouter(prefix="/api/tax", tags=["tax"])

class TaxComputationRequest(BaseModel):
    gross_salary: float
    standard_deduction: float = 75000.0
    chapter_vi_a_deductions: float = 0.0
    total_tax_deducted: float = 0.0
    assessment_year: str = Field(..., description="Assessment year in YYYY-YY format, e.g. '2026-27'")

@router.post("/compute-direct")
async def compute_tax_endpoint(request: TaxComputationRequest):
    try:
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
    except (ValueError, UnsupportedAssessmentYear) as e:
        raise HTTPException(status_code=422, detail=str(e))
