from .slabs import OLD_REGIME_SLABS, NEW_REGIME_SLABS, calculate_tax_from_slabs

def compute_taxes(gross_salary: float, standard_deduction: float, chapter_vi_a_deductions: float, tds: float) -> dict:
    # 1. Old Regime Calculation
    # Standard deduction is applicable in both regimes (recently updated for new regime too)
    old_taxable_income = max(0, gross_salary - standard_deduction - chapter_vi_a_deductions)
    old_tax = calculate_tax_from_slabs(old_taxable_income, OLD_REGIME_SLABS)
    
    # Rebate 87A for Old Regime (up to 5L)
    if old_taxable_income <= 500000:
        old_tax = max(0, old_tax - 12500)
        
    old_cess = old_tax * 0.04
    old_total_tax = old_tax + old_cess
    
    # 2. New Regime Calculation
    # Chapter VI A deductions (like 80C) are NOT allowed in the new regime. 
    # Standard deduction IS allowed.
    new_taxable_income = max(0, gross_salary - standard_deduction)
    new_tax = calculate_tax_from_slabs(new_taxable_income, NEW_REGIME_SLABS)
    
    # Rebate 87A for New Regime (up to 7L income limit)
    if new_taxable_income <= 700000:
        new_tax = max(0, new_tax - 25000)
        
    new_cess = new_tax * 0.04
    new_total_tax = new_tax + new_cess
    
    # Compare
    recommended = "new" if new_total_tax <= old_total_tax else "old"
    savings = abs(old_total_tax - new_total_tax)
    
    return {
        "old_regime": {
            "taxable_income": old_taxable_income,
            "tax": old_total_tax,
            "payable_or_refund": old_total_tax - tds
        },
        "new_regime": {
            "taxable_income": new_taxable_income,
            "tax": new_total_tax,
            "payable_or_refund": new_total_tax - tds
        },
        "recommendation": recommended,
        "savings": savings
    }
