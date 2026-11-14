import os
import pytest
import asyncio
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.user import User
from app.models.tax_profile import TaxProfile
from app.models.tax_computation import TaxComputation
from app.models.filing import Filing, FilingStatus
from app.schemas.itr import FilingRequest
from app.routers.itr import submit_tax_return


TEST_POSTGRES_URL = os.getenv("TEST_POSTGRES_URL")


@pytest.mark.skipif(
    not TEST_POSTGRES_URL,
    reason="TEST_POSTGRES_URL environment variable is not set; skipping live PostgreSQL concurrency test. "
           "Run with: TEST_POSTGRES_URL=postgresql://postgres:postgrespassword@localhost:5432/ofs_tax"
)
def test_postgres_concurrent_first_submits_only_call_sandbox_once():
    """
    Live PostgreSQL Concurrency Test:
    Tests that N (8) simultaneous first-time submit requests for the same user and assessment year
    serialize correctly via PostgreSQL UniqueConstraint and row-level locking (SELECT ... FOR UPDATE),
    resulting in EXACTLY ONE upstream Sandbox call and ONE Filing row in PostgreSQL.
    """
    engine = create_engine(TEST_POSTGRES_URL, pool_size=10, max_overflow=5)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    test_email = "pg_concurrent_test_user@ofstax.in"
    ay = "2026-27"

    # Setup test taxpayer in PostgreSQL
    setup_session = TestingSession()
    # Clean up any leftover from previous runs
    existing_user = setup_session.query(User).filter(User.email == test_email).first()
    if existing_user:
        setup_session.query(Filing).filter(Filing.user_id == existing_user.id).delete()
        setup_session.query(TaxComputation).filter(TaxComputation.user_id == existing_user.id).delete()
        setup_session.query(TaxProfile).filter(TaxProfile.user_id == existing_user.id).delete()
        setup_session.query(User).filter(User.id == existing_user.id).delete()
        setup_session.commit()

    test_user = User(email=test_email, full_name="Postgres Tester", hashed_password="mockpassword123")
    setup_session.add(test_user)
    setup_session.commit()
    setup_session.refresh(test_user)
    user_id = test_user.id

    profile = TaxProfile(
        user_id=user_id,
        pan="ABCDE1234F",
        gross_salary=1200000,
        deductions_80c=150000,
        tds_deducted=85000,
        employer_name="Postgres Tech Corp"
    )
    computation = TaxComputation(
        user_id=user_id,
        assessment_year=ay,
        new_taxable_income=1125000,
        new_total_tax=62500,
        old_taxable_income=1050000,
        old_total_tax=85000,
        recommended_regime="new"
    )
    setup_session.add(profile)
    setup_session.add(computation)
    setup_session.commit()
    computation_id = computation.id
    setup_session.close()

    call_count = 0

    async def mock_submit_itr(pan, payload):
        nonlocal call_count
        call_count += 1
        await asyncio.sleep(0.08)  # Simulate network latency to amplify race conditions
        return {
            "status": "SUCCESS",
            "message": "ITR Submitted to ITD",
            "ack_number": "ACK_PG_CONCURRENT_888",
            "simulated": False
        }

    def worker_submit():
        local_db = TestingSession()
        try:
            u = local_db.query(User).filter(User.id == user_id).first()
            return asyncio.run(
                submit_tax_return(
                    request=FilingRequest(assessment_year=ay, tax_computation_id=computation_id),
                    current_user=u,
                    db=local_db
                )
            )
        finally:
            local_db.close()

    # Launch 8 simultaneous threads
    workers_count = 8
    with patch("app.services.eri_service.submit_itr", side_effect=mock_submit_itr):
        with ThreadPoolExecutor(max_workers=workers_count) as executor:
            futures = [executor.submit(worker_submit) for _ in range(workers_count)]
            results = [f.result() for f in futures]

    # Verification:
    # 1. Exactly ONE upstream call must have reached Sandbox
    assert call_count == 1, f"Expected exactly 1 Sandbox call, but got {call_count}"

    # 2. All 8 workers received a successful response with the acknowledgement number
    for idx, r in enumerate(results):
        assert r["status"] == "SUCCESS", f"Worker {idx} failed with {r}"
        assert r["ack_number"] == "ACK_PG_CONCURRENT_888"

    # 3. Exactly ONE Filing row exists in PostgreSQL for this user and AY
    verify_session = TestingSession()
    filings = verify_session.query(Filing).filter(Filing.user_id == user_id, Filing.assessment_year == ay).all()
    assert len(filings) == 1, f"Expected 1 Filing row in DB, found {len(filings)}"
    assert filings[0].status == FilingStatus.EVERIFY_PENDING.value
    assert filings[0].ack_number == "ACK_PG_CONCURRENT_888"

    # Teardown test data
    verify_session.query(Filing).filter(Filing.user_id == user_id).delete()
    verify_session.query(TaxComputation).filter(TaxComputation.user_id == user_id).delete()
    verify_session.query(TaxProfile).filter(TaxProfile.user_id == user_id).delete()
    verify_session.query(User).filter(User.id == user_id).delete()
    verify_session.commit()
    verify_session.close()
