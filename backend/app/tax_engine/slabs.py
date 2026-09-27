# Tax Slabs for FY 2025-26 (AY 2026-27)

OLD_REGIME_SLABS = [
    {"limit": 250000, "rate": 0.0},
    {"limit": 500000, "rate": 0.05},
    {"limit": 1000000, "rate": 0.20},
    {"limit": float('inf'), "rate": 0.30},
]

# Assuming standard new regime slabs
NEW_REGIME_SLABS = [
    {"limit": 300000, "rate": 0.0},
    {"limit": 700000, "rate": 0.05},
    {"limit": 1000000, "rate": 0.10},
    {"limit": 1200000, "rate": 0.15},
    {"limit": 1500000, "rate": 0.20},
    {"limit": float('inf'), "rate": 0.30},
]

def calculate_tax_from_slabs(income: float, slabs: list) -> float:
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
