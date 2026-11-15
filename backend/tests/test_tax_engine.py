import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.tax_profile import TaxProfile
from app.models.tax_computation import TaxComputation
from app.core.security import create_access_token
from app.tax_engine.calculator import (
    calculate_new_regime,
    calculate_old_regime,
    compute_regimes
)
from app.tax_engine.slabs import (
    get_tax_rules,
    UnsupportedAssessmentYear,
    get_supported_assessment_years
)

# In-memory SQLite for testing
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_tax_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


# ==============================================================================
# Unit Tests for Tax Engine (AY 2026-27 / FY 2025-26)
# ==============================================================================

def test_new_regime_case_1_income_12L_zero_tax():
    """Gross 12,75,000 -> Taxable 12,00,000 -> Slab 60,000 -> Rebate 60,000 -> Tax 0"""
    res = calculate_new_regime(gross_salary=1275000.0, assessment_year="2026-27")
    assert res["gross_income"] == 1275000.0
    assert res["standard_deduction"] == 75000.0
    assert res["taxable_income"] == 1200000.0
    assert res["slab_tax"] == 60000.0
    assert res["rebate_87a"] == 60000.0
    assert res["marginal_relief"] == 0.0
    assert res["tax_liability"] == 0.0
    assert res["cess"] == 0.0
    assert res["total_tax"] == 0.0


def test_new_regime_case_2_income_15L_no_marginal_relief():
    """Gross 15,75,000 -> Taxable 15,00,000 -> Slab 1,05,000 -> Cess 4,200 -> Total 1,09,200"""
    res = calculate_new_regime(gross_salary=1575000.0, assessment_year="2026-27")
    assert res["taxable_income"] == 1500000.0
    assert res["slab_tax"] == 105000.0
    assert res["rebate_87a"] == 0.0
    assert res["marginal_relief"] == 0.0
    assert res["tax_liability"] == 105000.0
    assert res["cess"] == 4200.0
    assert res["total_tax"] == 109200.0


def test_new_regime_case_3_marginal_relief_applied():
    """Gross 13,25,000 -> Taxable 12,50,000 -> Slab 67,500 -> Marginal relief caps at 50,000 -> Cess 2,000 -> Total 52,000"""
    res = calculate_new_regime(gross_salary=1325000.0, assessment_year="2026-27")
    assert res["taxable_income"] == 1250000.0
    assert res["slab_tax"] == 67500.0
    assert res["rebate_87a"] == 0.0
    assert res["marginal_relief"] == 17500.0
    assert res["tax_liability"] == 50000.0
    assert res["cess"] == 2000.0
    assert res["total_tax"] == 52000.0


def test_new_regime_case_4_low_income_zero_tax():
    """Gross 4,75,000 -> Taxable 4,00,000 -> Tax 0"""
    res = calculate_new_regime(gross_salary=475000.0, assessment_year="2026-27")
    assert res["taxable_income"] == 400000.0
    assert res["slab_tax"] == 0.0
    assert res["total_tax"] == 0.0


def test_new_regime_boundary_at_12L():
    """Boundary: Taxable 12,00,000 vs 12,00,001"""
    # At exact 12,00,000 taxable (gross = 12,75,000)
    res_exact = calculate_new_regime(gross_salary=1275000.0, assessment_year="2026-27")
    assert res_exact["taxable_income"] == 1200000.0
    assert res_exact["total_tax"] == 0.0

    # At 12,00,001 taxable (gross = 12,75,001)
    res_boundary = calculate_new_regime(gross_salary=1275001.0, assessment_year="2026-27")
    assert res_boundary["taxable_income"] == 1200001.0
    # Slab tax: 20000 (4-8L) + 40000 (8-12L) + 1 * 0.15 = 60000.15
    assert abs(res_boundary["slab_tax"] - 60000.15) < 0.01
    # Excess income over 12L is 1.00 -> marginal relief caps tax liability at 1.00
    assert abs(res_boundary["tax_liability"] - 1.00) < 0.01
    assert abs(res_boundary["marginal_relief"] - 59999.15) < 0.01
    assert abs(res_boundary["cess"] - 0.04) < 0.01
    assert abs(res_boundary["total_tax"] - 1.04) < 0.01


def test_old_regime_verified_cases():
    """Old regime calculations with verified statutory formulas."""
    # Case A: Taxable 5,00,000 gets full 87A rebate (up to 12.5k)
    res_a = calculate_old_regime(gross_salary=550000.0, assessment_year="2026-27")
    assert res_a["standard_deduction"] == 50000.0
    assert res_a["taxable_income"] == 500000.0
    assert res_a["slab_tax"] == 12500.0
    assert res_a["rebate_87a"] == 12500.0
    assert res_a["total_tax"] == 0.0

    # Case B: Gross 10,50,000 with 80C 1,50,000 -> Taxable 8,50,000
    # Slab: 12,500 (2.5-5L) + 70,000 (3.5L @ 20%) = 82,500
    # Cess: 4% of 82,500 = 3,300 -> Total = 85,800
    res_b = calculate_old_regime(
        gross_salary=1050000.0,
        d80c=150000.0,
        assessment_year="2026-27"
    )
    assert res_b["taxable_income"] == 850000.0
    assert res_b["slab_tax"] == 82500.0
    assert res_b["rebate_87a"] == 0.0
    assert res_b["cess"] == 3300.0
    assert res_b["total_tax"] == 85800.0


def test_old_regime_statutory_caps_and_cess():
    """Verify Section 80C cap (1.5L) and Home Loan Interest cap (2.0L) are strictly enforced."""
    res = calculate_old_regime(
        gross_salary=2000000.0,
        d80c=300000.0,               # Exceeds 1.5L
        home_loan_interest=450000.0, # Exceeds 2.0L
        assessment_year="2026-27"
    )
    assert res["deductions_80c"] == 150000.0
    assert res["home_loan_interest"] == 200000.0
    assert res["standard_deduction"] == 50000.0
    assert res["total_deductions"] == 400000.0
    # Taxable: 20L - 4L = 16L
    # Slab: 12.5k (2.5-5L) + 100k (5-10L) + 180k (6L @ 30%) = 2,92,500
    # Cess: 4% of 2,92,500 = 11,700
    # Total: 3,04,200
    assert res["taxable_income"] == 1600000.0
    assert res["slab_tax"] == 292500.0
    assert res["cess"] == 11700.0
    assert res["total_tax"] == 304200.0


def test_high_income_flag_and_itr1_ineligibility():
    """Verify incomes exceeding 50L flag surcharge applicability and ITR-1 ineligibility."""
    res_high = compute_regimes(gross_salary=6000000.0, assessment_year="2026-27")
    assert res_high["itr1_eligible"] is False
    assert res_high["old_regime"]["surcharge_applicable"] is True
    assert res_high["new_regime"]["surcharge_applicable"] is True
    assert any("exceeds ₹50 Lakh statutory limit" in w for w in res_high["warnings"])

    res_eligible = compute_regimes(gross_salary=1500000.0, assessment_year="2026-27")
    assert res_eligible["itr1_eligible"] is True
    assert res_eligible["old_regime"]["surcharge_applicable"] is False
    assert res_eligible["new_regime"]["surcharge_applicable"] is False
    assert len(res_eligible["warnings"]) == 0


# ==============================================================================
# Integration Tests for POST /api/tax/compute
# ==============================================================================

def test_api_tax_compute_requires_assessment_year(client, db_session):
    """POST /api/tax/compute returns 422 if assessment_year is omitted."""
    user = User(email="tax_ay_test@example.com", hashed_password="pw", full_name="Tax Tester")
    db_session.add(user)
    db_session.commit()
    token = create_access_token({"sub": user.email})

    # Missing assessment_year in body and query
    res = client.post(
        "/api/tax/compute",
        headers={"Authorization": f"Bearer {token}"},
        json={}
    )
    assert res.status_code == 422


def test_api_tax_compute_rejects_malformed_ay(client, db_session):
    """POST /api/tax/compute returns 422 if assessment_year is malformed."""
    user = User(email="tax_malformed@example.com", hashed_password="pw", full_name="Tax Malformed")
    db_session.add(user)
    db_session.commit()
    token = create_access_token({"sub": user.email})

    # Bad format (not YYYY-YY or invalid suffix)
    res1 = client.post(
        "/api/tax/compute",
        headers={"Authorization": f"Bearer {token}"},
        json={"assessment_year": "2026"}
    )
    assert res1.status_code == 422

    res2 = client.post(
        "/api/tax/compute",
        headers={"Authorization": f"Bearer {token}"},
        json={"assessment_year": "2026-28"}  # should be 2026-27
    )
    assert res2.status_code == 422


def test_api_tax_compute_success_ay2026_27(client, db_session):
    """POST /api/tax/compute calculates using AY 2026-27 rules and persists computation record."""
    user = User(email="tax_success@example.com", hashed_password="pw", full_name="Tax Success")
    db_session.add(user)
    db_session.commit()

    profile = TaxProfile(
        user_id=user.id,
        pan="ABCDE1234F",
        gross_salary=1325000.0,
        other_income=0.0,
        deductions_80c=150000.0,
        home_loan_interest=0.0,
        tds_deducted=60000.0
    )
    db_session.add(profile)
    db_session.commit()

    token = create_access_token({"sub": user.email})

    res = client.post(
        "/api/tax/compute",
        headers={"Authorization": f"Bearer {token}"},
        json={"assessment_year": "2026-27"}
    )
    assert res.status_code == 200
    data = res.json()

    # Gross 13,25,000 -> Taxable New = 12,50,000 -> Marginal relief tax = 52,000
    assert data["new_regime"]["taxable_income"] == 1250000.0
    assert data["new_regime"]["total_tax"] == 52000.0
    assert data["recommendation"]["regime"] == "new"
    # Refund = 60,000 - 52,000 = 8,000
    assert data["recommendation"]["refund"] == 8000.0

    # Verify persisted record
    comp = db_session.query(TaxComputation).filter(TaxComputation.user_id == user.id).first()
    assert comp is not None
    assert comp.assessment_year == "2026-27"
    assert comp.new_total_tax == 52000.0
    assert comp.recommended_regime == "new"


def test_unsupported_assessment_year_raises():
    """get_tax_rules raises UnsupportedAssessmentYear for unknown year."""
    with pytest.raises(UnsupportedAssessmentYear) as exc_info:
        get_tax_rules("2031-32")
    assert "2031-32" in str(exc_info.value)
    assert "Supported: 2025-26, 2026-27" in str(exc_info.value)


def test_supported_years_endpoint(client):
    """GET /api/tax/supported-years returns list of statutory assessment years."""
    res = client.get("/api/tax/supported-years")
    assert res.status_code == 200
    data = res.json()
    assert "supported_assessment_years" in data
    assert data["supported_assessment_years"] == ["2025-26", "2026-27"]


def test_api_tax_compute_rejects_unsupported_year(client, db_session):
    """POST /api/tax/compute returns 422 with supported years when year is syntactically valid but unsupported."""
    user = User(email="tax_unsupported@example.com", hashed_password="pw", full_name="Tax Unsupported")
    db_session.add(user)
    db_session.commit()

    profile = TaxProfile(
        user_id=user.id,
        pan="ABCDE1234F",
        gross_salary=1000000.0,
        other_income=0.0,
        deductions_80c=0.0,
        home_loan_interest=0.0,
        tds_deducted=0.0
    )
    db_session.add(profile)
    db_session.commit()

    token = create_access_token({"sub": user.email})

    res = client.post(
        "/api/tax/compute",
        headers={"Authorization": f"Bearer {token}"},
        json={"assessment_year": "2031-32"}
    )
    assert res.status_code == 422
    assert "Assessment year '2031-32' is not supported" in res.json()["detail"]
    assert "Supported: 2025-26, 2026-27" in res.json()["detail"]


def test_api_tax_compute_direct_rejects_unsupported_year(client):
    """POST /api/tax/compute-direct returns 422 for unsupported assessment year."""
    payload = {
        "gross_salary": 1200000.0,
        "standard_deduction": 75000.0,
        "chapter_vi_a_deductions": 50000.0,
        "total_tax_deducted": 10000.0,
        "assessment_year": "2031-32"
    }
    res = client.post("/api/tax/compute-direct", json=payload)
    assert res.status_code == 422
    assert "2031-32" in res.json()["detail"]


def test_api_tax_compute_direct_requires_assessment_year(client):
    """POST /api/tax/compute-direct returns 422 when assessment_year is omitted."""
    payload = {
        "gross_salary": 1200000.0,
        "standard_deduction": 75000.0,
        "chapter_vi_a_deductions": 50000.0,
        "total_tax_deducted": 10000.0
    }
    res = client.post("/api/tax/compute-direct", json=payload)
    assert res.status_code == 422


def test_api_tax_compute_direct_success(client):
    """POST /api/tax/compute-direct calculates correctly when valid assessment_year is passed."""
    payload = {
        "gross_salary": 1275000.0,
        "standard_deduction": 75000.0,
        "chapter_vi_a_deductions": 0.0,
        "total_tax_deducted": 0.0,
        "assessment_year": "2026-27"
    }
    res = client.post("/api/tax/compute-direct", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["new_regime"]["taxable_income"] == 1200000.0
    assert data["new_regime"]["total_tax"] == 0.0
