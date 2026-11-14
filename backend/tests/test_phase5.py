import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.database import Base
from app.models.user import User
from app.models.tax_profile import TaxProfile
from app.models.tax_computation import TaxComputation
from app.models.filing import Filing, FilingStatus
from app.models.api_usage import ApiUsageLog
from app.schemas.itr import FilingRequest
from app.services import eri_service
from app.routers.itr import (
    submit_tax_return,
    log_sandbox_usage,
    get_usage_stats,
    fetch_prefill
)
from app.schemas.itr import OTPVerify

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture
def db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_user(db_session):
    user = User(
        email="devendra@ofstax.in",
        full_name="Devendra Diwakar",
        hashed_password="mockhashedpassword"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    profile = TaxProfile(
        user_id=user.id,
        pan="ABCDE1234F",
        gross_salary=1200000,
        deductions_80c=150000,
        tds_deducted=85000,
        home_loan_interest=0,
        capital_gains=0,
        other_income=25000,
        employer_name="Tech Solutions Ltd"
    )
    db_session.add(profile)

    computation = TaxComputation(
        user_id=user.id,
        assessment_year="2025-26",
        new_taxable_income=1125000,
        new_total_tax=62500,
        old_taxable_income=1050000,
        old_total_tax=85000,
        recommended_regime="new"
    )
    db_session.add(computation)
    db_session.commit()
    return user


# ============================================================================
# 1. Redis Token Cache & In-Memory Fallback Tests
# ============================================================================

@pytest.mark.asyncio
async def test_redis_token_cache_hit():
    """Test: When Redis has a valid cached token, return it immediately without network request."""
    mock_redis = MagicMock()
    mock_redis.get.return_value = "CACHED_REDIS_ACCESS_TOKEN_XYZ"

    with patch.object(eri_service, "_get_redis", return_value=mock_redis):
        token = await eri_service.get_sandbox_token()
        assert token == "CACHED_REDIS_ACCESS_TOKEN_XYZ"
        mock_redis.get.assert_called_once_with(eri_service.REDIS_TOKEN_KEY)


@pytest.mark.asyncio
async def test_redis_token_cache_graceful_fallback():
    """Test: When Redis raises an error, fallback gracefully to in-memory or authenticate call."""
    mock_redis = MagicMock()
    mock_redis.get.side_effect = Exception("Redis connection refused")

    # Clear memory cache first
    eri_service._cached_token = "IN_MEMORY_TOKEN_ABC"
    eri_service._cached_token_expiry = 9999999999.0

    with patch.object(eri_service, "_get_redis", return_value=mock_redis):
        token = await eri_service.get_sandbox_token()
        assert token == "IN_MEMORY_TOKEN_ABC"

    # Reset
    eri_service._cached_token = None
    eri_service._cached_token_expiry = 0.0


# ============================================================================
# 2. ITR-1 Eligibility & Extended Prefill Mapping Tests
# ============================================================================

def test_check_itr1_eligibility():
    # Eligible case: Under 50L, no capital gains, no business income
    eligible, reason = eri_service.check_itr1_eligibility(
        gross_salary=1200000, interest_income=25000, dividend_income=5000
    )
    assert eligible is True
    assert reason is None

    # Ineligible: Total income > 50 Lakhs
    eligible_50l, reason_50l = eri_service.check_itr1_eligibility(
        gross_salary=5100000, interest_income=10000
    )
    assert eligible_50l is False
    assert "exceeds ₹50 Lakh" in reason_50l
    assert "ITR-2" in reason_50l

    # Ineligible: Capital gains present
    eligible_cg, reason_cg = eri_service.check_itr1_eligibility(
        gross_salary=1000000, capital_gains=75000
    )
    assert eligible_cg is False
    assert "Capital gains" in reason_cg
    assert "ITR-2" in reason_cg

    # Ineligible: Business income present
    eligible_biz, reason_biz = eri_service.check_itr1_eligibility(
        gross_salary=1000000, business_income=200000
    )
    assert eligible_biz is False
    assert "Business/professional income" in reason_biz
    assert "ITR-3" in reason_biz


@pytest.mark.asyncio
async def test_fetch_prefill_extended_fields_and_eligibility():
    """Test: Prefill correctly maps interest, dividend, capital gains, 80D and checks eligibility."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": {
            "income_details": {
                "salary_income": 1500000,
                "interest_income": 35000,
                "dividend_income": 8000,
                "capital_gains": 0,
                "business_income": 0,
                "employer_name": "Infosys Ltd"
            },
            "deductions": {
                "section_80c": 150000,
                "section_80d": 25000
            },
            "taxes_paid": {
                "total_tds": 110000
            }
        }
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        with patch.object(eri_service, "get_sandbox_token", new_callable=AsyncMock) as mock_token:
            mock_token.return_value = "VALID_TOKEN"
            data = await eri_service.fetch_prefill_data("ABCDE1234F", "123456")

    assert data["gross_salary"] == 1500000.0
    assert data["interest_income"] == 35000.0
    assert data["dividend_income"] == 8000.0
    assert data["section_80d"] == 25000.0
    assert data["capital_gains"] == 0.0
    assert data["itr1_eligible"] is True
    assert data["unsupported_reason"] is None


# ============================================================================
# 3. Official ITR-1 Schema Validation Tests
# ============================================================================

def test_validate_itr1_schema_valid():
    valid_payload = {
        "ITR": {
            "ITR1": {
                "CreationInfo": {
                    "SWVersionNo": "1.0",
                    "SWCreatedBy": "NexTax"
                },
                "Form_ITR1": {
                    "FormName": "ITR-1",
                    "AssessmentYear": "2025"
                },
                "PersonalInfo": {
                    "AssesseeName": {"FirstName": "Devendra", "SurName": "Diwakar"},
                    "PAN": "ABCDE1234F",
                    "OptingNewTaxRegime": "Y"
                },
                "ITR1_IncomeDeductions": {
                    "GrossSalary": 1200000,
                    "TotalIncome": 1125000
                },
                "ITR1_TaxComputation": {
                    "TotalTaxPayable": 62500,
                    "TDSClaimed": 85000,
                    "RefundDue": 22500
                }
            }
        }
    }
    errors = eri_service.validate_itr1_schema(valid_payload)
    assert errors == []


def test_validate_itr1_schema_catches_invalid_data():
    invalid_payload = {
        "ITR": {
            "ITR1": {
                "Form_ITR1": {
                    "FormName": "ITR-4",  # Wrong form name
                    "AssessmentYear": "2025"
                },
                "PersonalInfo": {
                    "AssesseeName": {},  # Missing FirstName
                    "PAN": "INVALID_PAN_123",  # Bad PAN regex
                    "OptingNewTaxRegime": "INVALID"
                },
                "ITR1_IncomeDeductions": {
                    "GrossSalary": -5000,  # Negative salary
                    "TotalIncome": 6000000  # Exceeds 50L limit
                },
                "ITR1_TaxComputation": {
                    "TotalTaxPayable": -100,
                    "TDSClaimed": 0
                }
            }
        }
    }
    errors = eri_service.validate_itr1_schema(invalid_payload)
    assert len(errors) >= 5
    assert any("ITR-1" in e for e in errors)
    assert any("PAN" in e for e in errors)
    assert any("FirstName" in e for e in errors)
    assert any("GrossSalary" in e for e in errors)
    assert any("50,00,000" in e for e in errors)


# ============================================================================
# 4. Submit Route ITR-1 Eligibility & Schema Validation Tests
# ============================================================================

@pytest.mark.asyncio
async def test_submit_refuses_when_capital_gains_present(db_session, sample_user):
    """Test: Submit route rejects ITR-1 with 422 if capital gains exist."""
    profile = db_session.query(TaxProfile).filter(TaxProfile.user_id == sample_user.id).first()
    profile.capital_gains = 45000.0
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        await submit_tax_return(
            request=FilingRequest(assessment_year="2025-26", tax_computation_id=1),
            current_user=sample_user,
            db=db_session
        )
    assert exc_info.value.status_code == 422
    assert "Capital gains detected" in exc_info.value.detail
    assert "ITR-2" in exc_info.value.detail


@pytest.mark.asyncio
async def test_submit_refuses_when_total_income_exceeds_50_lakhs(db_session, sample_user):
    """Test: Submit route rejects ITR-1 with 422 if income > 50L."""
    profile = db_session.query(TaxProfile).filter(TaxProfile.user_id == sample_user.id).first()
    profile.gross_salary = 5500000.0
    profile.capital_gains = 0.0
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        await submit_tax_return(
            request=FilingRequest(assessment_year="2025-26", tax_computation_id=1),
            current_user=sample_user,
            db=db_session
        )
    assert exc_info.value.status_code == 422
    assert "exceeds the ₹50 Lakh threshold" in exc_info.value.detail
    assert "ITR-2" in exc_info.value.detail


# ============================================================================
# 5. API Cost and Usage Logger Tests
# ============================================================================

@pytest.mark.asyncio
async def test_api_usage_logging_and_stats_endpoint(db_session, sample_user):
    """
    Test: Logging records calls and calculates estimated costs @ ₹0.90 per live call.
    Simulated calls carry ₹0.00 cost, while live calls carry ₹0.90.
    """
    # 1. Log a mix of live and simulated calls
    log_sandbox_usage(db_session, "/kyc/pan", 200, simulated=False, user_id=sample_user.id)
    log_sandbox_usage(db_session, "/tax/itr/generate-otp", 200, simulated=False, user_id=sample_user.id)
    log_sandbox_usage(db_session, "/tax/itr/prefill", 200, simulated=True, user_id=sample_user.id)
    log_sandbox_usage(db_session, "/tax/itr/submit", 200, simulated=False, user_id=sample_user.id)

    # Log an action for a different user
    log_sandbox_usage(db_session, "/kyc/pan", 200, simulated=False, user_id=999)

    # 2. Query usage stats
    stats = await get_usage_stats(current_user=sample_user, db=db_session)

    # Total: 5 calls (4 for sample_user, 1 for user 999)
    assert stats.total_calls == 5
    assert stats.live_calls == 4
    assert stats.simulated_calls == 1
    # 4 live calls * 0.90 = 3.60
    assert stats.total_estimated_cost_inr == 3.60
    assert stats.unit_cost_estimate_inr == 0.90

    # User specific: 4 calls, 3 live * 0.90 = 2.70
    assert stats.user_calls == 4
    assert stats.user_estimated_cost_inr == 2.70

    # Endpoint breakdown
    assert stats.calls_by_endpoint["/kyc/pan"] == 2
    assert stats.calls_by_endpoint["/tax/itr/submit"] == 1
