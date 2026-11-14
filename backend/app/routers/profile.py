from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime, date
import re

from app.database import get_db
from app.models.user import User
from app.models.tax_profile import TaxProfile
from app.routers.auth import get_current_user
from app.core.assessment_year import validate_assessment_year

router = APIRouter()

@router.get("")
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(TaxProfile).filter(TaxProfile.user_id == current_user.id).first()
    if not profile:
        return {}
    
    return {
        "gross_salary": profile.gross_salary,
        "deductions_80c": profile.deductions_80c,
        "tds_deducted": profile.tds_deducted,
        "home_loan_interest": profile.home_loan_interest,
        "capital_gains": profile.capital_gains,
        "other_income": profile.other_income,
        "employer_name": profile.employer_name,
        "pan": profile.pan,
    }

@router.post("")
def save_profile(data: Dict[str, Any], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(TaxProfile).filter(TaxProfile.user_id == current_user.id).first()
    
    if not profile:
        profile = TaxProfile(user_id=current_user.id)
        db.add(profile)
        
    profile.gross_salary = data.get("gross_salary", profile.gross_salary)
    profile.deductions_80c = data.get("deductions_80c", profile.deductions_80c)
    profile.tds_deducted = data.get("tds_deducted", profile.tds_deducted)
    profile.home_loan_interest = data.get("home_loan_interest", profile.home_loan_interest)
    profile.capital_gains = data.get("capital_gains", profile.capital_gains)
    profile.other_income = data.get("other_income", profile.other_income)
    profile.employer_name = data.get("employer_name", profile.employer_name)
    profile.pan = data.get("pan", profile.pan)
    
    db.commit()
    return {"message": "Profile saved successfully"}

@router.get("/export-json")
def export_itr_json(
    assessment_year: str = Query(..., description="Assessment year in YYYY-YY format (e.g. '2026-27')"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        assessment_year = validate_assessment_year(assessment_year)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    profile = db.query(TaxProfile).filter(TaxProfile.user_id == current_user.id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Tax profile not found. Please review data first.")
        
    if not profile.pan:
        raise HTTPException(status_code=400, detail="PAN is required in tax profile to generate ITR JSON.")

    if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", profile.pan):
        raise HTTPException(status_code=400, detail=f"Invalid PAN format '{profile.pan}' in tax profile.")

    from app.models.tax_computation import TaxComputation
    computation = (
        db.query(TaxComputation)
        .filter(TaxComputation.user_id == current_user.id, TaxComputation.assessment_year == assessment_year)
        .order_by(TaxComputation.id.desc())
        .first()
    )
    if not computation:
        # Fallback to latest computation if specific AY record isn't explicitly tagged
        computation = (
            db.query(TaxComputation)
            .filter(TaxComputation.user_id == current_user.id)
            .order_by(TaxComputation.id.desc())
            .first()
        )
    
    if not computation:
        raise HTTPException(status_code=400, detail="Please visit the Compare Regimes page to compute your tax before downloading.")
        
    regime = computation.recommended_regime
    is_new = regime == "new"
    
    # Official ITD schema specifies the Assessment Year start year (e.g. '2025' for AY 2025-26, '2026' for AY 2026-27)
    ay_start_year = assessment_year.split("-")[0] if "-" in assessment_year else assessment_year
    creation_date = datetime.now().strftime("%Y-%m-%d")

    # Standard Govt ITR-1 Schema
    itr_json = {
        "ITR": {
            "ITR1": {
                "CreationInfo": {
                    "SWVersionNo": "1.0",
                    "SWCreatedBy": "NexTax",
                    "XMLCreatedBy": "NexTax",
                    "JSONCreatedBy": "NexTax",
                    "XMLCreationDate": creation_date,
                    "JSONCreationDate": creation_date,
                    "IntermediaryCity": "Mumbai"
                },
                "Form_ITR1": {
                    "FormName": "ITR-1",
                    "Description": "For individuals being a resident having total income upto Rs.50 lakh.",
                    "AssessmentYear": ay_start_year,
                    "SchemaVer": "1.0"
                },
                "PersonalInfo": {
                    "AssesseeName": {
                        "FirstName": current_user.full_name.split()[0] if current_user.full_name else "User",
                        "SurName": current_user.full_name.split()[-1] if current_user.full_name and " " in current_user.full_name else ""
                    },
                    "PAN": profile.pan,
                    "OptingNewTaxRegime": "Y" if is_new else "N"
                },
                "ITR1_IncomeDeductions": {
                    "GrossSalary": profile.gross_salary,
                    "IncomeFromHouseProperty": -profile.home_loan_interest if not is_new else 0,
                    "IncomeFromOtherSources": profile.other_income,
                    "UsrDeductUndChapVIA": {
                        "Section80C": min(profile.deductions_80c, 150000) if not is_new else 0,
                        "TotalChapVIADeductions": min(profile.deductions_80c, 150000) if not is_new else 0
                    },
                    "TotalIncome": computation.new_taxable_income if is_new else computation.old_taxable_income
                },
                "ITR1_TaxComputation": {
                    "TotalTaxPayable": computation.new_total_tax if is_new else computation.old_total_tax,
                    "TDSClaimed": profile.tds_deducted,
                    "RefundDue": max(0, profile.tds_deducted - (computation.new_total_tax if is_new else computation.old_total_tax)),
                    "TaxPayable": max(0, (computation.new_total_tax if is_new else computation.old_total_tax) - profile.tds_deducted)
                }
            }
        }
    }
    
    return itr_json

