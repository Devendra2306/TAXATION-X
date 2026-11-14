import pytest
import asyncio
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch, MagicMock, AsyncMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
import httpx
from datetime import datetime, date

from app.database import Base
from app.models.user import User
from app.models.tax_profile import TaxProfile
from app.models.tax_computation import TaxComputation
from app.models.filing import Filing, FilingStatus
from app.schemas.itr import FilingRequest
from app.services import eri_service
from app.routers.itr import submit_tax_return, get_filing_status
from app.routers.profile import export_itr_json
from app.export.generator import generate_itr1_json

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture
def db_session():
    from sqlalchemy.pool import StaticPool
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
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
# Problem 1 & 7 Tests: Dynamic Assessment Year & No Dummy PAN Fallback
# ============================================================================

def test_export_itr_json_dynamic_ay_and_dates(db_session, sample_user):
    """Test: export_itr_json dynamically aligns AssessmentYear and creation dates with the requested AY."""
    today_str = datetime.now().strftime("%Y-%m-%d")

    # AY 2025-26 -> AssessmentYear "2025"
    payload_2025 = export_itr_json(assessment_year="2025-26", db=db_session, current_user=sample_user)
    form_2025 = payload_2025["ITR"]["ITR1"]["Form_ITR1"]
    creation_2025 = payload_2025["ITR"]["ITR1"]["CreationInfo"]
    assert form_2025["AssessmentYear"] == "2025"
    assert creation_2025["XMLCreationDate"] == today_str
    assert creation_2025["JSONCreationDate"] == today_str

    # AY 2026-27 -> AssessmentYear "2026"
    payload_2026 = export_itr_json(assessment_year="2026-27", db=db_session, current_user=sample_user)
    form_2026 = payload_2026["ITR"]["ITR1"]["Form_ITR1"]
    assert form_2026["AssessmentYear"] == "2026"


def test_export_itr_json_rejects_missing_or_invalid_pan(db_session, sample_user):
    """Test: export_itr_json refuses to proceed if PAN is missing or invalid (no dummy fallback)."""
    profile = db_session.query(TaxProfile).filter(TaxProfile.user_id == sample_user.id).first()

    # 1. Missing PAN
    profile.pan = None
    db_session.commit()
    with pytest.raises(HTTPException) as exc_missing:
        export_itr_json(assessment_year="2025-26", db=db_session, current_user=sample_user)
    assert exc_missing.value.status_code == 400
    assert "PAN is required" in exc_missing.value.detail

    # 2. Invalid PAN format
    profile.pan = "INVALID_PAN"
    db_session.commit()
    with pytest.raises(HTTPException) as exc_invalid:
        export_itr_json(assessment_year="2025-26", db=db_session, current_user=sample_user)
    assert exc_invalid.value.status_code == 400
    assert "Invalid PAN format" in exc_invalid.value.detail


def test_generator_py_requires_valid_pan_and_dynamic_ay():
    """Test: export/generator.py respects assessment_year and rejects missing PAN."""
    with pytest.raises(ValueError) as exc:
        generate_itr1_json(user_data={}, tax_computation={"recommendation": "new", "new_regime": {"taxable_income": 10, "tax": 0}})
    assert "Valid PAN is required" in str(exc.value)

    payload = generate_itr1_json(
        user_data={"pan": "ABCDE1234F"},
        tax_computation={"recommendation": "new", "new_regime": {"taxable_income": 1000000, "tax": 50000}},
        assessment_year="2026-27"
    )
    assert payload["ITR"]["ITR1"]["Form_ITR1"]["AssessmentYear"] == "2026"


# ============================================================================
# Problem 3 Tests: Rigorous Official ITD Schema Validation
# ============================================================================

def test_validate_itr1_schema_detects_ay_mismatch():
    """Test: validate_itr1_schema detects when JSON AssessmentYear disagrees with requested AY."""
    payload = {
        "ITR": {
            "ITR1": {
                "CreationInfo": {
                    "SWVersionNo": "1.0",
                    "SWCreatedBy": "NexTax",
                    "XMLCreationDate": "2026-05-01"
                },
                "Form_ITR1": {
                    "FormName": "ITR-1",
                    "AssessmentYear": "2025"  # Says 2025
                },
                "PersonalInfo": {
                    "AssesseeName": {"FirstName": "Devendra"},
                    "PAN": "ABCDE1234F",
                    "OptingNewTaxRegime": "Y"
                },
                "ITR1_IncomeDeductions": {
                    "GrossSalary": 1000000,
                    "TotalIncome": 950000
                },
                "ITR1_TaxComputation": {
                    "TotalTaxPayable": 50000,
                    "TDSClaimed": 50000,
                    "RefundDue": 0,
                    "TaxPayable": 0
                }
            }
        }
    }
    # Expected AY is 2026-27 (start year 2026), but payload has 2025
    errors = eri_service.validate_itr1_schema(payload, expected_ay="2026-27")
    assert any("AssessmentYear mismatch" in e for e in errors)


def test_validate_itr1_schema_detects_tax_reconciliation_error():
    """Test: Tax computation mathematical reconciliation fails if TaxPayable doesn't match TotalTaxPayable - TDS."""
    payload = {
        "ITR": {
            "ITR1": {
                "CreationInfo": {
                    "SWVersionNo": "1.0",
                    "SWCreatedBy": "NexTax",
                    "XMLCreationDate": "2025-05-01"
                },
                "Form_ITR1": {
                    "FormName": "ITR-1",
                    "AssessmentYear": "2025"
                },
                "PersonalInfo": {
                    "AssesseeName": {"FirstName": "Devendra"},
                    "PAN": "ABCDE1234F",
                    "OptingNewTaxRegime": "Y"
                },
                "ITR1_IncomeDeductions": {
                    "GrossSalary": 1000000,
                    "TotalIncome": 950000
                },
                "ITR1_TaxComputation": {
                    "TotalTaxPayable": 60000,
                    "TDSClaimed": 40000,
                    "TaxPayable": 10000,  # INCORRECT: should be 20000
                    "RefundDue": 0
                }
            }
        }
    }
    errors = eri_service.validate_itr1_schema(payload)
    assert any("TaxPayable" in e and "does not reconcile" in e for e in errors)


# ============================================================================
# Problem 4 Tests: Network Timeout & Submitting State Double-Filing Protection
# ============================================================================

@pytest.mark.asyncio
async def test_submit_network_timeout_sets_submitting_state(db_session, sample_user):
    """
    Test: Network timeout leaves filing in 'submitting' status and raises 504.
    A blind retry cannot file twice without verifying upstream status.
    """
    with patch("app.services.eri_service.submit_itr", side_effect=httpx.TimeoutException("Connection timed out")):
        with pytest.raises(HTTPException) as exc_info:
            await submit_tax_return(
                request=FilingRequest(assessment_year="2025-26", tax_computation_id=1),
                current_user=sample_user,
                db=db_session
            )
    assert exc_info.value.status_code == 504
    assert "submitting" in exc_info.value.detail.lower()

    # Verify DB state
    filing = db_session.query(Filing).filter(Filing.user_id == sample_user.id).first()
    assert filing is not None
    assert filing.status == FilingStatus.SUBMITTING.value


@pytest.mark.asyncio
async def test_submit_retry_checks_upstream_and_prevents_duplicate_filing(db_session, sample_user):
    """
    Test: When retrying a filing in 'submitting' status:
    If upstream already received the return, filing updates to 'everify_pending'
    WITHOUT invoking submit_itr a second time!
    """
    # 1. Create filing in SUBMITTING status
    filing = Filing(
        user_id=sample_user.id,
        assessment_year="2025-26",
        tax_computation_id=1,
        status=FilingStatus.SUBMITTING.value
    )
    db_session.add(filing)
    db_session.commit()

    # 2. Mock upstream status check returning that government portal DID receive the return
    mock_upstream_status = {
        "exists": True,
        "status": "SUBMITTED",
        "ack_number": "ACK_UPSTREAM_RECEIVED_999",
        "filed_date": "2025-05-01"
    }

    with patch("app.services.eri_service.check_upstream_filing_status", new_callable=AsyncMock) as mock_check:
        mock_check.return_value = mock_upstream_status
        with patch("app.services.eri_service.submit_itr", new_callable=AsyncMock) as mock_submit:
            res = await submit_tax_return(
                request=FilingRequest(assessment_year="2025-26", tax_computation_id=1),
                current_user=sample_user,
                db=db_session
            )
            # Submit should NOT be called again
            mock_submit.assert_not_called()

    assert res["status"] == "SUCCESS"
    assert res["ack_number"] == "ACK_UPSTREAM_RECEIVED_999"
    assert res["filing_status"] == FilingStatus.EVERIFY_PENDING.value

    db_session.refresh(filing)
    assert filing.status == FilingStatus.EVERIFY_PENDING.value
    assert filing.ack_number == "ACK_UPSTREAM_RECEIVED_999"


# ============================================================================
# Problem 5 Tests: Concurrency & Double Submission on Brand-New Filing
# ============================================================================

def test_concurrent_first_submits_only_call_sandbox_once(db_session, sample_user):
    """
    Test: Two simultaneous threads submitting for the very first time (when no filing row exists).
    Thanks to the filing mutex lock and atomic creation, exactly ONE call to Sandbox is executed.
    """
    import time

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_session.get_bind())
    user_id = sample_user.id
    call_count = 0

    async def mock_submit_itr(pan, payload):
        nonlocal call_count
        call_count += 1
        await asyncio.sleep(0.05)  # Simulate network latency
        return {
            "status": "SUCCESS",
            "message": "ITR Submitted",
            "ack_number": "ACK_CONCURRENT_123",
            "simulated": False
        }

    def run_submit():
        local_session = TestingSessionLocal()
        u = local_session.query(User).filter(User.id == user_id).first()
        try:
            return asyncio.run(
                submit_tax_return(
                    request=FilingRequest(assessment_year="2025-26", tax_computation_id=1),
                    current_user=u,
                    db=local_session
                )
            )
        finally:
            local_session.close()

    with patch("app.services.eri_service.submit_itr", side_effect=mock_submit_itr):
        with ThreadPoolExecutor(max_workers=2) as executor:
            fut1 = executor.submit(run_submit)
            fut2 = executor.submit(run_submit)
            res1 = fut1.result()
            res2 = fut2.result()

    # Exactly ONE Sandbox API call must have been made
    assert call_count == 1
    # Both callers receive the successful outcome and ack number
    assert res1["ack_number"] == "ACK_CONCURRENT_123"
    assert res2["ack_number"] == "ACK_CONCURRENT_123"

    # Only one filing record exists in DB
    verify_session = TestingSessionLocal()
    filings = verify_session.query(Filing).filter(Filing.user_id == 1).all()
    assert len(filings) == 1
    assert filings[0].status == FilingStatus.EVERIFY_PENDING.value
    verify_session.close()
