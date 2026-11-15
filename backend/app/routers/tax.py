from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.user import User
from app.models.tax_profile import TaxProfile
from app.models.tax_computation import TaxComputation
from app.routers.auth import get_current_user
from app.core.assessment_year import validate_assessment_year
from app.tax_engine.calculator import (
    calculate_old_regime,
    calculate_new_regime,
    compute_regimes
)
from app.tax_engine.slabs import (
    UnsupportedAssessmentYear,
    get_supported_assessment_years
)

router = APIRouter(prefix="/api/tax", tags=["Tax Computation"])


@router.get("/supported-years")
def get_supported_years():
    """
    Returns the list of statutory assessment years supported by the tax engine.
    """
    return {"supported_assessment_years": get_supported_assessment_years()}


class TaxComputeRequest(BaseModel):
    assessment_year: str = Field(..., description="Assessment year in YYYY-YY format, e.g. '2026-27'")


@router.post("/compute")
def compute_taxes(
    request_data: Optional[TaxComputeRequest] = Body(None),
    assessment_year: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Computes tax liabilities under both Old and New Tax Regimes for the current user's profile.
    Requires assessment_year explicitly in the body (JSON) or query string.
    """
    raw_ay = None
    if request_data and request_data.assessment_year:
        raw_ay = request_data.assessment_year.strip()
    elif assessment_year:
        raw_ay = assessment_year.strip()

    if not raw_ay:
        raise HTTPException(
            status_code=422,
            detail="Field 'assessment_year' is required in request body or query parameter (e.g. '2026-27')."
        )

    try:
        validated_ay = validate_assessment_year(raw_ay)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    profile = db.query(TaxProfile).filter(TaxProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Tax profile not found. Please review data first.")

    # Calculate using unified tax engine
    try:
        result = compute_regimes(
            gross_salary=profile.gross_salary,
            other_income=profile.other_income,
            deductions_80c=profile.deductions_80c,
            home_loan_interest=profile.home_loan_interest,
            tds_deducted=profile.tds_deducted,
            assessment_year=validated_ay
        )
    except UnsupportedAssessmentYear as e:
        raise HTTPException(status_code=422, detail=str(e))

    old_res = result["old_regime"]
    new_res = result["new_regime"]
    recommendation = result["recommendation"]

    # Save computation record associated with the validated assessment year
    computation = (
        db.query(TaxComputation)
        .filter(
            TaxComputation.user_id == current_user.id,
            TaxComputation.assessment_year == validated_ay
        )
        .first()
    )
    if not computation:
        computation = TaxComputation(user_id=current_user.id, assessment_year=validated_ay)
        db.add(computation)

    computation.assessment_year = validated_ay
    computation.old_taxable_income = old_res["taxable_income"]
    computation.old_tax_liability = old_res["tax_liability"]
    computation.old_cess = old_res["cess"]
    computation.old_total_tax = old_res["total_tax"]
    computation.set_old_details(old_res)

    computation.new_taxable_income = new_res["taxable_income"]
    computation.new_tax_liability = new_res["tax_liability"]
    computation.new_cess = new_res["cess"]
    computation.new_total_tax = new_res["total_tax"]
    computation.set_new_details(new_res)

    computation.recommended_regime = recommendation["regime"]
    computation.tax_savings = recommendation["savings"]
    computation.refund_due = recommendation["refund"]

    db.commit()

    return result
