import pytest
from unittest.mock import patch, AsyncMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.database import Base
from app.models.user import User
from app.models.tax_profile import TaxProfile
from app.models.tax_computation import TaxComputation
from app.models.filing import Filing, FilingStatus
from app.schemas.itr import FilingRequest
from app.routers.itr import submit_tax_return, get_filing_status

# Test in-memory SQLite DB
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


@pytest.mark.asyncio
async def test_submit_idempotent_single_sandbox_call(db_session, sample_user):
    """
    Test: Calling submit twice results in exactly ONE Sandbox call.
    The second call returns the existing acknowledgement and status.
    """
    req = FilingRequest(assessment_year="2025-26", tax_computation_id=1)
    mock_sandbox_return = {
        "status": "SUCCESS",
        "message": "ITR Submitted Successfully",
        "ack_number": "ACK_REAL_9876543210",
        "simulated": False
    }

    with patch("app.services.eri_service.submit_itr", new_callable=AsyncMock) as mock_submit:
        mock_submit.return_value = mock_sandbox_return

        # 1st submit
        res1 = await submit_tax_return(req, sample_user, db_session)
        assert res1["status"] == "SUCCESS"
        assert res1["ack_number"] == "ACK_REAL_9876543210"
        assert res1["filing_status"] == FilingStatus.SUBMITTED.value

        # 2nd submit (idempotent call)
        res2 = await submit_tax_return(req, sample_user, db_session)
        assert res2["status"] == "SUCCESS"
        assert res2["ack_number"] == "ACK_REAL_9876543210"
        assert "already submitted" in res2["message"]

        # CRITICAL ACCEPTANCE: Mock submit was called exactly ONCE
        assert mock_submit.call_count == 1


@pytest.mark.asyncio
async def test_submit_failure_allows_retry(db_session, sample_user):
    """
    Test: A failed submit can be retried and succeeds.
    """
    req = FilingRequest(assessment_year="2025-26", tax_computation_id=1)

    with patch("app.services.eri_service.submit_itr", new_callable=AsyncMock) as mock_submit:
        # 1st attempt: raises HTTPException (e.g. 502 upstream error)
        mock_submit.side_effect = HTTPException(status_code=502, detail="Upstream Sandbox timeout")

        with pytest.raises(HTTPException) as exc:
            await submit_tax_return(req, sample_user, db_session)
        assert exc.value.status_code == 502

        # Check that filing is now in 'failed' status with reason recorded
        filing = db_session.query(Filing).filter(Filing.user_id == sample_user.id).first()
        assert filing is not None
        assert filing.status == FilingStatus.FAILED.value
        assert "Upstream Sandbox timeout" in filing.failure_reason

        # 2nd attempt (retry): mock now succeeds
        mock_submit.side_effect = None
        mock_submit.return_value = {
            "status": "SUCCESS",
            "message": "ITR Submitted Successfully",
            "ack_number": "ACK_RETRY_SUCCESS_111",
            "simulated": False
        }

        res_retry = await submit_tax_return(req, sample_user, db_session)
        assert res_retry["status"] == "SUCCESS"
        assert res_retry["ack_number"] == "ACK_RETRY_SUCCESS_111"
        assert res_retry["filing_status"] == FilingStatus.SUBMITTED.value

        # DB updated to submitted
        db_session.refresh(filing)
        assert filing.status == FilingStatus.SUBMITTED.value
        assert filing.ack_number == "ACK_RETRY_SUCCESS_111"
        assert filing.failure_reason is None


@pytest.mark.asyncio
async def test_submit_refused_in_wrong_state(db_session, sample_user):
    """
    Test: Submit is refused if filing is in an invalid/unsupported state (e.g. 'archived' or 'locked').
    """
    filing = Filing(
        user_id=sample_user.id,
        assessment_year="2025-26",
        tax_computation_id=1,
        status="archived" # Wrong state
    )
    db_session.add(filing)
    db_session.commit()

    req = FilingRequest(assessment_year="2025-26", tax_computation_id=1)
    with pytest.raises(HTTPException) as exc:
        await submit_tax_return(req, sample_user, db_session)
    assert exc.value.status_code == 400
    assert "Filing cannot be submitted in 'archived' status" in exc.value.detail


@pytest.mark.asyncio
async def test_get_filing_status_endpoint(db_session, sample_user):
    """
    Test: GET /api/itr/status returns current status and ack number.
    """
    # 1. Before filing: status is draft
    status_res1 = await get_filing_status("2025-26", sample_user, db_session)
    assert status_res1.status == "draft"
    assert status_res1.acknowledgement_number is None

    # 2. Add submitted filing
    filing = Filing(
        user_id=sample_user.id,
        assessment_year="2025-26",
        status=FilingStatus.SUBMITTED.value,
        ack_number="ACK_TEST_STATUS_123"
    )
    db_session.add(filing)
    db_session.commit()

    status_res2 = await get_filing_status("2025-26", sample_user, db_session)
    assert status_res2.status == FilingStatus.SUBMITTED.value
    assert status_res2.acknowledgement_number == "ACK_TEST_STATUS_123"
