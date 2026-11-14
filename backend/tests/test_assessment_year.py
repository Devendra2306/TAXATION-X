import pytest
from datetime import date
from pydantic import ValidationError
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.user import User
from app.core.assessment_year import (
    current_assessment_year,
    validate_assessment_year,
    parse_assessment_year_start
)
from app.schemas.itr import FilingRequest, EVerifyRequest, ITRStatusResponse
from app.routers.itr import get_filing_status, get_current_ay
from app.routers.profile import export_itr_json

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
    return user


# ============================================================================
# 1. current_assessment_year date calculation tests
# ============================================================================

def test_current_assessment_year_dates():
    # November 2026 (FY 2025-26) -> AY 2026-27
    assert current_assessment_year(date(2026, 11, 14)) == "2026-27"
    # January 2027 (FY 2025-26) -> AY 2026-27
    assert current_assessment_year(date(2027, 1, 15)) == "2026-27"
    # March 31, 2027 (FY 2025-26) -> AY 2026-27
    assert current_assessment_year(date(2027, 3, 31)) == "2026-27"
    # April 1, 2027 (FY 2026-27) -> AY 2027-28
    assert current_assessment_year(date(2027, 4, 1)) == "2027-28"
    # March 31, 2026 (FY 2024-25) -> AY 2025-26
    assert current_assessment_year(date(2026, 3, 31)) == "2025-26"
    # Century transition: April 2099 -> "2099-00"
    assert current_assessment_year(date(2099, 4, 1)) == "2099-00"


# ============================================================================
# 2. validate_assessment_year logic tests
# ============================================================================

def test_validate_assessment_year_valid():
    assert validate_assessment_year("2026-27") == "2026-27"
    assert validate_assessment_year("2025-26") == "2025-26"
    assert validate_assessment_year("2099-00") == "2099-00"
    assert parse_assessment_year_start("2026-27") == "2026"


def test_validate_assessment_year_malformed():
    # Regex mismatches
    with pytest.raises(ValueError):
        validate_assessment_year("2026")
    with pytest.raises(ValueError):
        validate_assessment_year("26-27")
    with pytest.raises(ValueError):
        validate_assessment_year("2026/27")
    with pytest.raises(ValueError):
        validate_assessment_year("abcd-ef")

    # Second part not equal to first year + 1 (mod 100)
    with pytest.raises(ValueError) as exc1:
        validate_assessment_year("2026-28")
    assert "Invalid assessment year" in str(exc1.value)

    with pytest.raises(ValueError) as exc2:
        validate_assessment_year("2026-25")
    assert "Invalid assessment year" in str(exc2.value)


# ============================================================================
# 3. Pydantic request schema validation tests (no defaults, required)
# ============================================================================

def test_filing_request_schema_requires_valid_ay():
    # Missing assessment_year -> ValidationError (422)
    with pytest.raises(ValidationError):
        FilingRequest(tax_computation_id=1)

    # Malformed assessment_year -> ValidationError (422)
    with pytest.raises(ValidationError):
        FilingRequest(assessment_year="2026-28", tax_computation_id=1)

    # Valid assessment_year succeeds
    req = FilingRequest(assessment_year="2026-27", tax_computation_id=1)
    assert req.assessment_year == "2026-27"


def test_everify_request_schema_requires_valid_ay():
    # Missing assessment_year -> ValidationError (422)
    with pytest.raises(ValidationError):
        EVerifyRequest(otp="123456")

    # Malformed assessment_year -> ValidationError (422)
    with pytest.raises(ValidationError):
        EVerifyRequest(otp="123456", assessment_year="invalid")

    # Valid succeeds
    req = EVerifyRequest(otp="123456", assessment_year="2026-27")
    assert req.assessment_year == "2026-27"


# ============================================================================
# 4. Route query parameter validation tests
# ============================================================================

@pytest.mark.asyncio
async def test_get_filing_status_rejects_malformed_ay(db_session, sample_user):
    with pytest.raises(HTTPException) as exc:
        await get_filing_status(assessment_year="2026-28", current_user=sample_user, db=db_session)
    assert exc.value.status_code == 422


def test_export_itr_json_rejects_malformed_ay(db_session, sample_user):
    with pytest.raises(HTTPException) as exc:
        export_itr_json(assessment_year="invalid", db=db_session, current_user=sample_user)
    assert exc.value.status_code == 422


def test_get_current_ay_endpoint():
    res = get_current_ay()
    assert "assessment_year" in res
    assert validate_assessment_year(res["assessment_year"]) == res["assessment_year"]
