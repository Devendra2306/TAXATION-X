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
from app.schemas.itr import FilingRequest, EVerifyRequest
from app.routers.itr import submit_tax_return, everify_tax_return, get_filing_status

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
async def test_submit_moves_to_everify_pending(db_session, sample_user):
    """
    Test: Submitting moves status to 'everify_pending' (NOT immediately verified).
    """
    req = FilingRequest(assessment_year="2025-26", tax_computation_id=1)
    with patch("app.services.eri_service.submit_itr", new_callable=AsyncMock) as mock_submit:
        mock_submit.return_value = {
            "status": "SUCCESS",
            "message": "ITR Submitted",
            "ack_number": "ACK_TEST_EVERIFY_999",
            "simulated": False
        }
        res = await submit_tax_return(req, sample_user, db_session)
        assert res["status"] == "SUCCESS"
        assert res["filing_status"] == FilingStatus.EVERIFY_PENDING.value
        assert res["ack_number"] == "ACK_TEST_EVERIFY_999"

        filing = db_session.query(Filing).filter(Filing.user_id == sample_user.id).first()
        assert filing.status == FilingStatus.EVERIFY_PENDING.value
        assert filing.ack_number == "ACK_TEST_EVERIFY_999"


@pytest.mark.asyncio
async def test_everify_success_moves_to_verified(db_session, sample_user):
    """
    Test: Submitting then e-verifying moves status to 'verified'.
    """
    # 1. Create a filing in everify_pending
    filing = Filing(
        user_id=sample_user.id,
        assessment_year="2025-26",
        status=FilingStatus.EVERIFY_PENDING.value,
        ack_number="ACK_TEST_EVERIFY_999"
    )
    db_session.add(filing)
    db_session.commit()

    everify_req = EVerifyRequest(
        otp="123456",
        acknowledgement_number="ACK_TEST_EVERIFY_999",
        assessment_year="2025-26"
    )

    with patch("app.services.eri_service.everify_itr", new_callable=AsyncMock) as mock_everify:
        mock_everify.return_value = {
            "status": "SUCCESS",
            "message": "ITR e-verified successfully",
            "ack_number": "ACK_TEST_EVERIFY_999",
            "simulated": False
        }
        res = await everify_tax_return(everify_req, sample_user, db_session)
        assert res["status"] == "SUCCESS"
        assert res["filing_status"] == FilingStatus.VERIFIED.value

        db_session.refresh(filing)
        assert filing.status == FilingStatus.VERIFIED.value
        assert filing.failure_reason is None


@pytest.mark.asyncio
async def test_everify_failure_records_reason(db_session, sample_user):
    """
    Test: Invalid OTP in e-verification raises error and records failure reason.
    """
    filing = Filing(
        user_id=sample_user.id,
        assessment_year="2025-26",
        status=FilingStatus.EVERIFY_PENDING.value,
        ack_number="ACK_TEST_EVERIFY_999"
    )
    db_session.add(filing)
    db_session.commit()

    everify_req = EVerifyRequest(
        otp="000000",
        acknowledgement_number="ACK_TEST_EVERIFY_999",
        assessment_year="2025-26"
    )

    with patch("app.services.eri_service.everify_itr", new_callable=AsyncMock) as mock_everify:
        mock_everify.side_effect = HTTPException(status_code=400, detail="Invalid Aadhaar OTP provided.")

        with pytest.raises(HTTPException) as exc:
            await everify_tax_return(everify_req, sample_user, db_session)
        assert exc.value.status_code == 400
        assert "Invalid Aadhaar OTP" in exc.value.detail

        db_session.refresh(filing)
        assert filing.status != FilingStatus.VERIFIED.value
        assert "Invalid Aadhaar OTP" in filing.failure_reason


@pytest.mark.asyncio
async def test_everify_refused_on_draft(db_session, sample_user):
    """
    Test: e-Verify is refused if return has not been submitted yet (status is 'draft').
    """
    filing = Filing(
        user_id=sample_user.id,
        assessment_year="2025-26",
        status=FilingStatus.DRAFT.value
    )
    db_session.add(filing)
    db_session.commit()

    everify_req = EVerifyRequest(
        otp="123456",
        assessment_year="2025-26"
    )

    with pytest.raises(HTTPException) as exc:
        await everify_tax_return(everify_req, sample_user, db_session)
    assert exc.value.status_code == 400
    assert "Submit return first" in exc.value.detail


@pytest.mark.asyncio
async def test_everify_idempotent_when_already_verified(db_session, sample_user):
    """
    Test: e-Verify is idempotent if already verified.
    """
    filing = Filing(
        user_id=sample_user.id,
        assessment_year="2025-26",
        status=FilingStatus.VERIFIED.value,
        ack_number="ACK_ALREADY_VERIFIED_777"
    )
    db_session.add(filing)
    db_session.commit()

    everify_req = EVerifyRequest(
        otp="123456",
        acknowledgement_number="ACK_ALREADY_VERIFIED_777",
        assessment_year="2025-26"
    )

    with patch("app.services.eri_service.everify_itr", new_callable=AsyncMock) as mock_everify:
        res = await everify_tax_return(everify_req, sample_user, db_session)
        assert res["status"] == "SUCCESS"
        assert "already e-verified" in res["message"]
        # Upstream was not called
        assert mock_everify.call_count == 0
