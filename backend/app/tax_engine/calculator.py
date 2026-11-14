"""
Tax Calculator Engine for Indian Income Tax.
Provides unified calculation for Old Regime and New Regime with Assessment Year support.
"""

from typing import Dict, Any, Optional
from .slabs import get_tax_rules, calculate_tax_from_slabs, DEFAULT_ASSESSMENT_YEAR


def calculate_old_regime(
    gross_salary: float,
    d80c: float = 0.0,
    home_loan_interest: float = 0.0,
    other_income: float = 0.0,
    assessment_year: str = DEFAULT_ASSESSMENT_YEAR
) -> Dict[str, Any]:
    """
    Computes tax under the Old Tax Regime for a given Assessment Year.
    """
    rules = get_tax_rules(assessment_year)["old_regime"]
    cess_rate = get_tax_rules(assessment_year)["cess_rate"]

    standard_deduction = float(rules.get("standard_deduction", 50000.0))
    capped_80c = min(float(d80c), float(rules.get("max_80c", 150000.0)))
    capped_home_loan = min(float(home_loan_interest), float(rules.get("max_home_loan", 200000.0)))

    total_deductions = standard_deduction + capped_80c + capped_home_loan
    gross_total_income = float(gross_salary) + float(other_income)
    taxable_income = max(0.0, gross_total_income - total_deductions)

    slab_tax = calculate_tax_from_slabs(taxable_income, rules["slabs"])

    # Section 87A Rebate for Old Regime
    rebate_limit = float(rules.get("rebate_limit", 500000.0))
    max_rebate = float(rules.get("max_rebate", 12500.0))
    rebate_87a = 0.0

    if taxable_income <= rebate_limit:
        rebate_87a = min(slab_tax, max_rebate)

    tax_after_rebate = max(0.0, slab_tax - rebate_87a)
    marginal_relief = 0.0
    tax_liability = tax_after_rebate

    cess = tax_liability * cess_rate
    total_tax = tax_liability + cess

    return {
        "gross_income": gross_total_income,
        "standard_deduction": standard_deduction,
        "deductions_80c": capped_80c,
        "home_loan_interest": capped_home_loan,
        "total_deductions": total_deductions,
        "taxable_income": taxable_income,
        "slab_tax": slab_tax,
        "rebate_87a": rebate_87a,
        "marginal_relief": marginal_relief,
        "tax_liability": tax_liability,
        "cess": cess,
        "total_tax": total_tax,
        "assessment_year": assessment_year,
        "regime": "old"
    }


def calculate_new_regime(
    gross_salary: float,
    other_income: float = 0.0,
    assessment_year: str = DEFAULT_ASSESSMENT_YEAR
) -> Dict[str, Any]:
    """
    Computes tax under the New Tax Regime (Section 115BAC) for a given Assessment Year.
    Includes Section 87A rebate and marginal relief.
    """
    rules = get_tax_rules(assessment_year)["new_regime"]
    cess_rate = get_tax_rules(assessment_year)["cess_rate"]

    standard_deduction = float(rules.get("standard_deduction", 75000.0))
    gross_total_income = float(gross_salary) + float(other_income)
    taxable_income = max(0.0, gross_total_income - standard_deduction)

    slab_tax = calculate_tax_from_slabs(taxable_income, rules["slabs"])

    rebate_limit = float(rules.get("rebate_limit", 1200000.0))
    max_rebate = float(rules.get("max_rebate", 60000.0))
    has_marginal_relief = rules.get("marginal_relief", True)

    rebate_87a = 0.0
    marginal_relief = 0.0

    if taxable_income <= rebate_limit:
        # Full or partial rebate up to max_rebate
        rebate_87a = min(slab_tax, max_rebate)
        tax_liability = max(0.0, slab_tax - rebate_87a)
    else:
        # Taxable income exceeds rebate limit
        rebate_87a = 0.0
        tax_liability = slab_tax

        # Marginal relief under Section 87A:
        # Tax payable cannot exceed the amount by which total income exceeds rebate_limit.
        if has_marginal_relief:
            excess_income = taxable_income - rebate_limit
            if slab_tax > excess_income:
                marginal_relief = slab_tax - excess_income
                tax_liability = excess_income

    cess = tax_liability * cess_rate
    total_tax = tax_liability + cess

    return {
        "gross_income": gross_total_income,
        "standard_deduction": standard_deduction,
        "total_deductions": standard_deduction,
        "taxable_income": taxable_income,
        "slab_tax": slab_tax,
        "rebate_87a": rebate_87a,
        "marginal_relief": marginal_relief,
        "tax_liability": tax_liability,
        "cess": cess,
        "total_tax": total_tax,
        "assessment_year": assessment_year,
        "regime": "new"
    }


def compute_regimes(
    gross_salary: float,
    other_income: float = 0.0,
    deductions_80c: float = 0.0,
    home_loan_interest: float = 0.0,
    tds_deducted: float = 0.0,
    assessment_year: str = DEFAULT_ASSESSMENT_YEAR
) -> Dict[str, Any]:
    """
    Computes tax under both Old and New regimes and provides regime comparison and recommendation.
    """
    old_res = calculate_old_regime(
        gross_salary=gross_salary,
        d80c=deductions_80c,
        home_loan_interest=home_loan_interest,
        other_income=other_income,
        assessment_year=assessment_year
    )

    new_res = calculate_new_regime(
        gross_salary=gross_salary,
        other_income=other_income,
        assessment_year=assessment_year
    )

    recommended = "new" if new_res["total_tax"] <= old_res["total_tax"] else "old"
    tax_savings = abs(old_res["total_tax"] - new_res["total_tax"])
    best_tax = min(old_res["total_tax"], new_res["total_tax"])
    refund = float(tds_deducted) - best_tax

    return {
        "old_regime": old_res,
        "new_regime": new_res,
        "recommendation": {
            "regime": recommended,
            "savings": tax_savings,
            "refund": refund,
            "best_tax": best_tax
        },
        "assessment_year": assessment_year
    }


# Backwards-compatible signature matching original calculator.py
def compute_taxes(
    gross_salary: float,
    standard_deduction: float = 75000.0,
    chapter_vi_a_deductions: float = 0.0,
    tds: float = 0.0,
    assessment_year: str = DEFAULT_ASSESSMENT_YEAR
) -> Dict[str, Any]:
    """Legacy helper function mapped to unified compute_regimes."""
    return compute_regimes(
        gross_salary=gross_salary,
        other_income=0.0,
        deductions_80c=chapter_vi_a_deductions,
        home_loan_interest=0.0,
        tds_deducted=tds,
        assessment_year=assessment_year
    )
