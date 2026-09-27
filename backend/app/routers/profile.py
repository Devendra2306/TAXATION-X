from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.models.user import User
from app.models.tax_profile import TaxProfile
from app.routers.auth import get_current_user

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
def export_itr_json(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(TaxProfile).filter(TaxProfile.user_id == current_user.id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Tax profile not found. Please review data first.")
        
    # Standard Govt ITR-1 Schema Mock (simplified for MVP)
    itr_json = {
        "ITR": {
            "ITR1": {
                "CreationInfo": {
                    "SWVersionNo": "1.0",
                    "SWCreatedBy": "NexTax",
                    "XMLCreatedBy": "NexTax",
                    "XMLCreationDate": "2024-05-01",
                    "IntermediaryCity": "Mumbai"
                },
                "Form_ITR1": {
                    "FormName": "ITR-1",
                    "Description": "For individuals being a resident (other than not ordinarily resident) having total income upto Rs.50 lakh, having Income from Salaries, one house property, other sources (Interest etc.), and agricultural income upto Rs.5 thousand",
                    "AssessmentYear": "2024",
                    "SchemaVer": "1.0"
                },
                "PersonalInfo": {
                    "AssesseeName": {
                        "FirstName": current_user.full_name.split()[0] if current_user.full_name else "User",
                        "SurName": current_user.full_name.split()[-1] if current_user.full_name and " " in current_user.full_name else ""
                    },
                    "PAN": profile.pan or "ABCDE1234F"
                },
                "ITR1_IncomeDeductions": {
                    "GrossSalary": profile.gross_salary,
                    "IncomeFromHouseProperty": -profile.home_loan_interest,
                    "IncomeFromOtherSources": profile.other_income,
                    "UsrDeductUndChapVIA": {
                        "Section80C": min(profile.deductions_80c, 150000),
                        "TotalChapVIADeductions": min(profile.deductions_80c, 150000)
                    },
                    "TotalIncome": max(0, profile.gross_salary - profile.home_loan_interest + profile.other_income - min(profile.deductions_80c, 150000))
                },
                "ITR1_TaxComputation": {
                    "TotalTaxPayable": 0, # Assuming calculated externally
                    "TDSClaimed": profile.tds_deducted
                }
            }
        }
    }
    
    return itr_json
