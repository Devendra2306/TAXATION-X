from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.models.user import User
from app.models.tax_profile import TaxProfile
from app.models.tax_computation import TaxComputation
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/tax", tags=["Tax Computation"])

def calculate_old_regime(gross_salary: float, d80c: float, home_loan_interest: float, other_income: float) -> dict:
    standard_deduction = 50000
    capped_80c = min(d80c, 150000)
    capped_home_loan = min(home_loan_interest, 200000)
    
    total_deductions = standard_deduction + capped_80c + capped_home_loan
    gross_total_income = gross_salary + other_income
    taxable_income = max(0, gross_total_income - total_deductions)
    
    tax = 0.0
    if taxable_income > 1000000:
        tax += (taxable_income - 1000000) * 0.30
        tax += 100000 + 12500  # 20% of 5L + 5% of 2.5L
    elif taxable_income > 500000:
        tax += (taxable_income - 500000) * 0.20
        tax += 12500
    elif taxable_income > 250000:
        tax += (taxable_income - 250000) * 0.05

    # 87A Rebate for Old Regime (taxable income <= 5L gets full rebate up to 12.5k)
    if taxable_income <= 500000:
        tax = max(0, tax - 12500)
        
    cess = tax * 0.04
    total_tax = tax + cess
    
    return {
        "gross_income": gross_total_income,
        "total_deductions": total_deductions,
        "taxable_income": taxable_income,
        "tax_liability": tax,
        "cess": cess,
        "total_tax": total_tax
    }

def calculate_new_regime(gross_salary: float, other_income: float) -> dict:
    # FY 2024-25 (AY 2025-26) slabs
    standard_deduction = 75000
    gross_total_income = gross_salary + other_income
    taxable_income = max(0, gross_total_income - standard_deduction)
    
    tax = 0.0
    if taxable_income > 1500000:
        tax += (taxable_income - 1500000) * 0.30
        tax += 150000  # Sum of previous slabs
    elif taxable_income > 1200000:
        tax += (taxable_income - 1200000) * 0.20
        tax += 90000
    elif taxable_income > 1000000:
        tax += (taxable_income - 1000000) * 0.15
        tax += 60000
    elif taxable_income > 700000:
        tax += (taxable_income - 700000) * 0.10
        tax += 30000
    elif taxable_income > 300000:
        tax += (taxable_income - 300000) * 0.05

    # 87A Rebate for New Regime (taxable income <= 7L gets full rebate up to 25k)
    if taxable_income <= 700000:
        tax = max(0, tax - 25000)
        
    cess = tax * 0.04
    total_tax = tax + cess
    
    return {
        "gross_income": gross_total_income,
        "total_deductions": standard_deduction,
        "taxable_income": taxable_income,
        "tax_liability": tax,
        "cess": cess,
        "total_tax": total_tax
    }

@router.post("/compute")
def compute_taxes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(TaxProfile).filter(TaxProfile.user_id == current_user.id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Tax profile not found. Please review data first.")
        
    # Calculate
    old_res = calculate_old_regime(profile.gross_salary, profile.deductions_80c, profile.home_loan_interest, profile.other_income)
    new_res = calculate_new_regime(profile.gross_salary, profile.other_income)
    
    # Recommendation
    recommended = "new" if new_res["total_tax"] <= old_res["total_tax"] else "old"
    tax_savings = abs(old_res["total_tax"] - new_res["total_tax"])
    
    best_tax = min(old_res["total_tax"], new_res["total_tax"])
    refund = profile.tds_deducted - best_tax
    
    # Save computation
    computation = db.query(TaxComputation).filter(TaxComputation.user_id == current_user.id).first()
    if not computation:
        computation = TaxComputation(user_id=current_user.id)
        db.add(computation)
        
    computation.old_taxable_income = old_res["taxable_income"]
    computation.old_total_tax = old_res["total_tax"]
    computation.set_old_details(old_res)
    
    computation.new_taxable_income = new_res["taxable_income"]
    computation.new_total_tax = new_res["total_tax"]
    computation.set_new_details(new_res)
    
    computation.recommended_regime = recommended
    computation.tax_savings = tax_savings
    computation.refund_due = refund
    
    db.commit()
    
    return {
        "old_regime": old_res,
        "new_regime": new_res,
        "recommendation": {
            "regime": recommended,
            "savings": tax_savings,
            "refund": refund
        }
    }
