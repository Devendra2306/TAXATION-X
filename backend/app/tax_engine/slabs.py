"""
Tax slabs and statutory parameters for Indian Income Tax.
Supports both Assessment Year 2026-27 (Financial Year 2025-26) and AY 2025-26 (FY 2024-25).
"""

from typing import Dict, Any, List

# --- AY 2026-27 (FY 2025-26) Slabs as per Finance Act 2025 / Budget 2025 ---
AY_2026_27_NEW_SLABS = [
    {"limit": 400000, "rate": 0.0},
    {"limit": 800000, "rate": 0.05},
    {"limit": 1200000, "rate": 0.10},
    {"limit": 1600000, "rate": 0.15},
    {"limit": 2000000, "rate": 0.20},
    {"limit": 2400000, "rate": 0.25},
    {"limit": float('inf'), "rate": 0.30},
]

AY_2026_27_OLD_SLABS = [
    {"limit": 250000, "rate": 0.0},
    {"limit": 500000, "rate": 0.05},
    {"limit": 1000000, "rate": 0.20},
    {"limit": float('inf'), "rate": 0.30},
]

# --- AY 2025-26 (FY 2024-25) Slabs ---
AY_2025_26_NEW_SLABS = [
    {"limit": 300000, "rate": 0.0},
    {"limit": 700000, "rate": 0.05},
    {"limit": 1000000, "rate": 0.10},
    {"limit": 1200000, "rate": 0.15},
    {"limit": 1500000, "rate": 0.20},
    {"limit": float('inf'), "rate": 0.30},
]

AY_2025_26_OLD_SLABS = [
    {"limit": 250000, "rate": 0.0},
    {"limit": 500000, "rate": 0.05},
    {"limit": 1000000, "rate": 0.20},
    {"limit": float('inf'), "rate": 0.30},
]

RULES_BY_AY: Dict[str, Dict[str, Any]] = {
    "2026-27": {
        "new_regime": {
            "slabs": AY_2026_27_NEW_SLABS,
            "standard_deduction": 75000.0,
            "rebate_limit": 1200000.0,
            "max_rebate": 60000.0,
            "marginal_relief": True,
        },
        "old_regime": {
            "slabs": AY_2026_27_OLD_SLABS,
            "standard_deduction": 50000.0,
            "rebate_limit": 500000.0,
            "max_rebate": 12500.0,
            "marginal_relief": False,
            "max_80c": 150000.0,
            "max_home_loan": 200000.0,
        },
        "cess_rate": 0.04,
    },
    "2025-26": {
        "new_regime": {
            "slabs": AY_2025_26_NEW_SLABS,
            "standard_deduction": 75000.0,
            "rebate_limit": 700000.0,
            "max_rebate": 25000.0,
            "marginal_relief": True,
        },
        "old_regime": {
            "slabs": AY_2025_26_OLD_SLABS,
            "standard_deduction": 50000.0,
            "rebate_limit": 500000.0,
            "max_rebate": 12500.0,
            "marginal_relief": False,
            "max_80c": 150000.0,
            "max_home_loan": 200000.0,
        },
        "cess_rate": 0.04,
    },
}

DEFAULT_ASSESSMENT_YEAR = "2026-27"


class UnsupportedAssessmentYear(ValueError):
    """Raised when the requested assessment year is not supported by statutory rules."""
    pass


def get_supported_assessment_years() -> List[str]:
    """Returns sorted list of statutory assessment years supported by the tax engine."""
    return sorted(list(RULES_BY_AY.keys()))


def get_tax_rules(assessment_year: str = DEFAULT_ASSESSMENT_YEAR) -> Dict[str, Any]:
    """
    Returns the tax rules dictionary for the specified assessment year.
    Raises UnsupportedAssessmentYear if assessment_year is not supported.
    """
    if assessment_year not in RULES_BY_AY:
        supported = ", ".join(get_supported_assessment_years())
        raise UnsupportedAssessmentYear(
            f"Assessment year '{assessment_year}' is not supported. Supported: {supported}."
        )
    return RULES_BY_AY[assessment_year]


def calculate_tax_from_slabs(income: float, slabs: List[Dict[str, Any]]) -> float:
    """
    Computes slab tax progressively on taxable income.
    """
    tax = 0.0
    previous_limit = 0.0

    for slab in slabs:
        if income > previous_limit:
            taxable_amount = min(income, slab["limit"]) - previous_limit
            tax += taxable_amount * slab["rate"]
            previous_limit = slab["limit"]
        else:
            break

    return tax
