import pytest
import io
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.tax_profile import TaxProfile
from app.models.tax_computation import TaxComputation
from app.models.payment import Payment
from app.core.security import create_access_token, get_password_hash
from app.main_limiter import limiter
from app.services.payu_service import PayUService

# Create in-memory SQLite DB for isolated API test suite
api_test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
ApiTestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=api_test_engine)


@pytest.fixture(autouse=True)
def setup_api_test_db():
    Base.metadata.create_all(bind=api_test_engine)
    # Disable rate limiter during general test execution to prevent 429 flakiness
    limiter.enabled = False
    yield
    Base.metadata.drop_all(bind=api_test_engine)
    limiter.enabled = True


@pytest.fixture
def db_session():
    db = ApiTestingSessionLocal()
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
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_user(db_session):
    user = User(
        email="testuser@ofstax.in",
        full_name="Test Taxpayer",
        hashed_password=get_password_hash("SecretPassword123!")
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(auth_user):
    token = create_access_token({"sub": auth_user.email})
    return {"Authorization": f"Bearer {token}"}


# ==============================================================================
# 1. Root, Health & Security Middleware Tests
# ==============================================================================

def test_api_root_endpoint(client):
    res = client.get("/")
    assert res.status_code == 200
    assert res.json() == {"message": "Welcome to OFS Taxation API"}


def test_api_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy"}


def test_api_security_headers_middleware(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("X-XSS-Protection") == "1; mode=block"
    assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "camera=()" in res.headers.get("Permissions-Policy", "")


def test_api_cors_preflight_headers(client):
    res = client.options(
        "/api/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST"
        }
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "http://localhost:3000"


# ==============================================================================
# 2. Authentication API Tests (/api/auth)
# ==============================================================================

def test_auth_register_success(client):
    payload = {
        "email": "newtaxpayer@ofstax.in",
        "full_name": "New Taxpayer",
        "password": "StrongPassword789!"
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "newtaxpayer@ofstax.in"
    assert data["full_name"] == "New Taxpayer"
    assert "id" in data


def test_auth_register_duplicate_email(client, auth_user):
    payload = {
        "email": auth_user.email,
        "full_name": "Duplicate User",
        "password": "AnotherPassword456!"
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"].lower()


def test_auth_login_success(client, auth_user):
    login_data = {
        "username": auth_user.email,
        "password": "SecretPassword123!"
    }
    res = client.post("/api/auth/login", data=login_data)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_auth_login_invalid_password(client, auth_user):
    login_data = {
        "username": auth_user.email,
        "password": "WrongPassword999!"
    }
    res = client.post("/api/auth/login", data=login_data)
    assert res.status_code == 401
    assert "incorrect email or password" in res.json()["detail"].lower()


def test_auth_login_nonexistent_user(client):
    login_data = {
        "username": "nonexistent@ofstax.in",
        "password": "AnyPassword123!"
    }
    res = client.post("/api/auth/login", data=login_data)
    assert res.status_code == 401


def test_auth_read_me_authenticated(client, auth_headers, auth_user):
    res = client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == auth_user.email
    assert data["full_name"] == auth_user.full_name


def test_auth_read_me_unauthenticated(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_auth_read_me_invalid_token(client):
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_garbage_token"})
    assert res.status_code == 401


def test_auth_google_login_success(client):
    mock_decoded_token = {
        "email": "google_user@ofstax.in",
        "name": "Google Verified User"
    }
    with patch("google.oauth2.id_token.verify_firebase_token", return_value=mock_decoded_token):
        res = client.post("/api/auth/google", json={"id_token": "valid_firebase_test_token"})
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"


def test_auth_google_login_invalid_token(client):
    with patch("google.oauth2.id_token.verify_firebase_token", side_effect=Exception("Expired token")):
        res = client.post("/api/auth/google", json={"id_token": "expired_token_123"})
        assert res.status_code == 401
        assert "invalid or expired google" in res.json()["detail"].lower()


# ==============================================================================
# 3. Tax Profile API Tests (/api/profile)
# ==============================================================================

def test_profile_get_empty_when_not_created(client, auth_headers):
    res = client.get("/api/profile", headers=auth_headers)
    assert res.status_code == 200
    assert res.json() == {}


def test_profile_save_and_retrieve(client, auth_headers):
    save_payload = {
        "gross_salary": 1400000.0,
        "deductions_80c": 150000.0,
        "tds_deducted": 75000.0,
        "home_loan_interest": 50000.0,
        "capital_gains": 25000.0,
        "other_income": 10000.0,
        "employer_name": "Apex Technologies India",
        "pan": "ABCDE1234F"
    }
    post_res = client.post("/api/profile", headers=auth_headers, json=save_payload)
    assert post_res.status_code == 200
    assert post_res.json()["message"] == "Profile saved successfully"

    get_res = client.get("/api/profile", headers=auth_headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["gross_salary"] == 1400000.0
    assert data["deductions_80c"] == 150000.0
    assert data["pan"] == "ABCDE1234F"
    assert data["employer_name"] == "Apex Technologies India"


def test_profile_export_json_validations_and_export(client, auth_headers, auth_user, db_session):
    # 1. Missing assessment year in query parameter
    res1 = client.get("/api/profile/export-json", headers=auth_headers)
    assert res1.status_code == 422

    # 2. Malformed assessment year
    res2 = client.get("/api/profile/export-json?assessment_year=2026-28", headers=auth_headers)
    assert res2.status_code == 422

    # 3. Missing profile (404)
    res3 = client.get("/api/profile/export-json?assessment_year=2026-27", headers=auth_headers)
    assert res3.status_code == 404

    # 4. Profile without PAN (400)
    profile = TaxProfile(user_id=auth_user.id, gross_salary=1000000.0, pan="")
    db_session.add(profile)
    db_session.commit()
    res4 = client.get("/api/profile/export-json?assessment_year=2026-27", headers=auth_headers)
    assert res4.status_code == 400
    assert "pan is required" in res4.json()["detail"].lower()

    # 5. Invalid PAN format (400)
    profile.pan = "INVALID_PAN_123"
    db_session.commit()
    res5 = client.get("/api/profile/export-json?assessment_year=2026-27", headers=auth_headers)
    assert res5.status_code == 400
    assert "invalid pan format" in res5.json()["detail"].lower()

    # 6. Valid PAN but no tax computation (400)
    profile.pan = "ABCDE1234F"
    db_session.commit()
    res6 = client.get("/api/profile/export-json?assessment_year=2026-27", headers=auth_headers)
    assert res6.status_code == 400
    assert "compare regimes page" in res6.json()["detail"].lower()

    # 7. Add computation record and verify successful ITR JSON export
    comp = TaxComputation(
        user_id=auth_user.id,
        assessment_year="2026-27",
        recommended_regime="new",
        new_tax_liability=0.0,
        new_taxable_income=1200000.0,
        old_tax_liability=50000.0,
        old_taxable_income=1200000.0
    )
    db_session.add(comp)
    db_session.commit()

    res7 = client.get("/api/profile/export-json?assessment_year=2026-27", headers=auth_headers)
    assert res7.status_code == 200
    itr_json = res7.json()
    assert "ITR" in itr_json
    assert itr_json["ITR"]["ITR1"]["Form_ITR1"]["AssessmentYear"] == "2026"
    assert itr_json["ITR"]["ITR1"]["PersonalInfo"]["PAN"] == "ABCDE1234F"


# ==============================================================================
# 4. AI Chat Assistant API Tests (/api/chat)
# ==============================================================================

def test_chat_empty_messages_validation(client):
    res = client.post("/api/chat", json={"messages": []})
    assert res.status_code == 400
    assert "at least one message is required" in res.json()["detail"].lower()


def test_chat_ca_fallback_regime_comparison(client):
    payload = {
        "messages": [
            {"role": "user", "content": "Can you compare old vs new tax regime for me?"}
        ]
    }
    res = client.post("/api/chat", json=payload)
    assert res.status_code == 200
    reply = res.json()["reply"]
    assert "115BAC" in reply
    assert "12.75 Lakhs" in reply or "12 Lakh" in reply


def test_chat_ca_fallback_deductions_advice(client):
    payload = {
        "messages": [
            {"role": "user", "content": "What 80C and 80D tax deductions can I claim?"}
        ]
    }
    res = client.post("/api/chat", json=payload)
    assert res.status_code == 200
    reply = res.json()["reply"]
    assert "80C" in reply
    assert "1.50 Lakhs" in reply or "1.5 Lakh" in reply


def test_chat_ca_fallback_hra(client):
    payload = {
        "messages": [
            {"role": "user", "content": "How is HRA rent allowance calculated?"}
        ]
    }
    res = client.post("/api/chat", json=payload)
    assert res.status_code == 200
    reply = res.json()["reply"]
    assert "Section 10(13A)" in reply


def test_chat_with_mocked_gemini_model(client):
    mock_model = MagicMock()
    mock_chat = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Hello! Under the New Regime AY 2026-27, zero tax applies up to ₹12.75 Lakhs."
    mock_chat.send_message.return_value = mock_response
    mock_model.start_chat.return_value = mock_chat

    with patch("app.routers.chat.gemini_model", mock_model):
        payload = {
            "messages": [
                {"role": "user", "content": "What is the zero tax limit?"}
            ]
        }
        res = client.post("/api/chat", json=payload)
        assert res.status_code == 200
        assert res.json()["reply"] == "Hello! Under the New Regime AY 2026-27, zero tax applies up to ₹12.75 Lakhs."


# ==============================================================================
# 5. Payment API Tests (/api/payment)
# ==============================================================================

def test_payment_initiate_success(client, auth_headers):
    payload = {
        "amount": 499.0,
        "productinfo": "ITR-1 Assisted E-Filing Plan",
        "firstname": "Devendra",
        "email": "devendra@ofstax.in",
        "phone": "9876543210"
    }
    res = client.post("/api/payment/initiate", headers=auth_headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "txnid" in data
    assert data["txnid"].startswith("OFS_")
    assert "action_url" in data
    assert "params" in data
    assert data["params"]["amount"] == "499.00"


def test_payment_initiate_invalid_amount(client, auth_headers):
    payload = {
        "amount": -50.0,
        "productinfo": "Invalid Plan"
    }
    res = client.post("/api/payment/initiate", headers=auth_headers, json=payload)
    assert res.status_code == 422


def test_payment_simulate_success_and_get_status(client, auth_headers, db_session):
    # 1. Initiate a transaction
    init_res = client.post(
        "/api/payment/initiate",
        headers=auth_headers,
        json={"amount": 999.0, "productinfo": "Premium Plan"}
    )
    assert init_res.status_code == 200
    txnid = init_res.json()["txnid"]

    # 2. Check initial pending status
    status_res = client.get(f"/api/payment/status/{txnid}")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "pending"

    # 3. Simulate success
    sim_res = client.post(
        "/api/payment/simulate-success",
        json={"txnid": txnid, "status": "success"}
    )
    assert sim_res.status_code == 200
    assert sim_res.json()["status"] == "success"

    # 4. Verify updated status
    status_res2 = client.get(f"/api/payment/status/{txnid}")
    assert status_res2.status_code == 200
    assert status_res2.json()["status"] == "success"


def test_payment_simulate_nonexistent_transaction(client):
    res = client.post(
        "/api/payment/simulate-success",
        json={"txnid": "NONEXISTENT_TXN_999", "status": "success"}
    )
    assert res.status_code == 404


def test_payment_status_nonexistent_transaction(client):
    res = client.get("/api/payment/status/UNKNOWN_TXN_123")
    assert res.status_code == 404


def test_payment_callback_success_redirect(client, auth_headers, db_session):
    init_res = client.post(
        "/api/payment/initiate",
        headers=auth_headers,
        json={"amount": 499.0, "productinfo": "Plan A"}
    )
    txnid = init_res.json()["txnid"]

    form_payload = {
        "txnid": txnid,
        "status": "success",
        "mihpayid": "PAYU_MIHPAYID_12345",
        "mode": "CC",
        "bank_ref_num": "BANK_REF_987"
    }

    with patch.object(PayUService, "verify_response_hash", return_value=True):
        res = client.post("/api/payment/callback/success", data=form_payload, follow_redirects=False)
        assert res.status_code == 303
        assert "export?payment=success" in res.headers["location"]
        assert f"txnid={txnid}" in res.headers["location"]


def test_payment_callback_failure_redirect(client, auth_headers, db_session):
    init_res = client.post(
        "/api/payment/initiate",
        headers=auth_headers,
        json={"amount": 499.0, "productinfo": "Plan A"}
    )
    txnid = init_res.json()["txnid"]

    form_payload = {
        "txnid": txnid,
        "status": "failure",
        "errorMessage": "Bank authentication declined"
    }

    res = client.post("/api/payment/callback/failure", data=form_payload, follow_redirects=False)
    assert res.status_code == 303
    assert "select-plan?payment=failed" in res.headers["location"]
    assert f"txnid={txnid}" in res.headers["location"]


# ==============================================================================
# 6. Document Upload API Tests (/api/upload)
# ==============================================================================

def test_upload_form16_unauthenticated(client):
    pdf_file = io.BytesIO(b"%PDF-1.4 mock pdf data")
    res = client.post(
        "/api/upload/form16",
        files={"file": ("test.pdf", pdf_file, "application/pdf")}
    )
    assert res.status_code == 401


def test_upload_form16_invalid_file_extension(client, auth_headers):
    txt_file = io.BytesIO(b"Just plain text file contents")
    res = client.post(
        "/api/upload/form16",
        headers=auth_headers,
        files={"file": ("form16.txt", txt_file, "text/plain")}
    )
    assert res.status_code == 400
    assert "only pdf files are allowed" in res.json()["detail"].lower()


def test_upload_form16_success(client, auth_headers, auth_user, db_session):
    parsed_sample = {
        "gross_salary": 1150000.0,
        "deductions_80c": 150000.0,
        "tds_deducted": 65000.0,
        "employer_name": "TCS Ltd",
        "pan": "ABCDE1234F"
    }

    with patch("app.routers.upload.extract_form16_data", return_value=parsed_sample):
        pdf_file = io.BytesIO(b"%PDF-1.4 fake valid pdf file contents")
        res = client.post(
            "/api/upload/form16",
            headers=auth_headers,
            files={"file": ("Form16_2025_26.pdf", pdf_file, "application/pdf")}
        )
        assert res.status_code == 200
        data = res.json()
        assert "uploaded and parsed successfully" in data["message"].lower()
        assert data["parsed_data"]["employer_name"] == "TCS Ltd"

        # Verify TaxProfile was also updated
        profile = db_session.query(TaxProfile).filter(TaxProfile.user_id == auth_user.id).first()
        assert profile is not None
        assert profile.gross_salary == 1150000.0
        assert profile.pan == "ABCDE1234F"


def test_upload_form16_password_protected(client, auth_headers):
    with patch("app.routers.upload.extract_form16_data", return_value={"error": "password_protected"}):
        pdf_file = io.BytesIO(b"%PDF-1.4 encrypted")
        res = client.post(
            "/api/upload/form16",
            headers=auth_headers,
            files={"file": ("Protected_Form16.pdf", pdf_file, "application/pdf")}
        )
        assert res.status_code == 400
        assert "password-protected" in res.json()["detail"].lower()


def test_upload_form16_corrupted_pdf(client, auth_headers):
    with patch("app.routers.upload.extract_form16_data", return_value=None):
        pdf_file = io.BytesIO(b"not a valid pdf")
        res = client.post(
            "/api/upload/form16",
            headers=auth_headers,
            files={"file": ("corrupt.pdf", pdf_file, "application/pdf")}
        )
        assert res.status_code == 422
        assert "failed to parse pdf data" in res.json()["detail"].lower()


# ==============================================================================
# 7. ITR Core Endpoints API Tests (/api/itr)
# ==============================================================================

def test_itr_current_ay_endpoint(client):
    res = client.get("/api/itr/current-ay")
    assert res.status_code == 200
    data = res.json()
    assert "assessment_year" in data
    assert "-" in data["assessment_year"]


def test_itr_usage_stats_endpoint(client, auth_headers):
    res = client.get("/api/itr/usage-stats", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_calls" in data
    assert "total_estimated_cost_inr" in data
    assert "unit_cost_estimate_inr" in data
    assert data["unit_cost_estimate_inr"] == 0.90
