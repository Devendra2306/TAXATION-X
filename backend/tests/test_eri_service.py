import pytest
from unittest.mock import patch, AsyncMock
import httpx
from fastapi import HTTPException

from app.config import settings
from app.services import eri_service

# Test PAN
VALID_PAN = "ABCDE1234F"


def create_mock_response(status_code: int, json_data: dict = None, text: str = ""):
    resp = httpx.Response(
        status_code=status_code,
        json=json_data if json_data is not None else {},
        request=httpx.Request("POST", "https://api.sandbox.co.in/test")
    )
    return resp


@pytest.fixture(autouse=True)
def mock_token():
    """Mock get_sandbox_token so tests don't make network calls for auth."""
    with patch("app.services.eri_service.get_sandbox_token", new_callable=AsyncMock) as mock_auth:
        mock_auth.return_value = "mock_test_token"
        yield mock_auth


# =========================================================================
# 1. verify_pan_number TESTS
# =========================================================================

@pytest.mark.asyncio
async def test_verify_pan_success():
    mock_payload = {
        "data": {
            "status": "valid",
            "name_as_per_pan": "Devendra Diwakar",
            "category": "individual",
            "aadhaar_seeding_status": "linked"
        }
    }
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(200, mock_payload)
        res = await eri_service.verify_pan_number(VALID_PAN, "Devendra Diwakar", "23/06/1995")
        assert res["status"] == "success"
        assert res["verified"] is True
        assert res["simulated"] is False
        assert res["name"] == "Devendra Diwakar"


@pytest.mark.asyncio
async def test_verify_pan_401():
    settings.DEMO_MODE = False
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(401, {"message": "Invalid API token"})
        with pytest.raises(HTTPException) as exc:
            await eri_service.verify_pan_number(VALID_PAN)
        assert exc.value.status_code == 502
        assert "Sandbox authentication failed" in exc.value.detail


@pytest.mark.asyncio
async def test_verify_pan_403_credits_exhausted():
    settings.DEMO_MODE = False
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(403, {"message": "Insufficient credits available on your account"})
        with pytest.raises(HTTPException) as exc:
            await eri_service.verify_pan_number(VALID_PAN)
        assert exc.value.status_code == 503
        assert "Sandbox credits exhausted" in exc.value.detail


@pytest.mark.asyncio
async def test_verify_pan_403_credits_exhausted_demo_mode():
    settings.DEMO_MODE = True
    try:
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = create_mock_response(403, {"message": "Insufficient credits available on your account"})
            res = await eri_service.verify_pan_number(VALID_PAN)
            assert res["status"] == "success"
            assert res["verified"] is True
            assert res["simulated"] is True
            assert res["pan_status"] == "simulated"
    finally:
        settings.DEMO_MODE = False


@pytest.mark.asyncio
async def test_verify_pan_404():
    settings.DEMO_MODE = False
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(404, {"message": "Endpoint not found"})
        with pytest.raises(HTTPException) as exc:
            await eri_service.verify_pan_number(VALID_PAN)
        assert exc.value.status_code == 502
        assert "Endpoint not enabled" in exc.value.detail


@pytest.mark.asyncio
async def test_verify_pan_timeout():
    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Connection timed out")):
        with pytest.raises(HTTPException) as exc:
            await eri_service.verify_pan_number(VALID_PAN)
        assert exc.value.status_code == 503
        assert "Could not connect to PAN verification" in exc.value.detail


# =========================================================================
# 2. request_aadhaar_otp TESTS
# =========================================================================

@pytest.mark.asyncio
async def test_request_aadhaar_otp_success():
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(200, {"message": "OTP generated"})
        res = await eri_service.request_aadhaar_otp(VALID_PAN)
        assert res["success"] is True
        assert res["simulated"] is False


@pytest.mark.asyncio
async def test_request_aadhaar_otp_401():
    settings.DEMO_MODE = False
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(401, {"message": "Unauthorized"})
        with pytest.raises(HTTPException) as exc:
            await eri_service.request_aadhaar_otp(VALID_PAN)
        assert exc.value.status_code == 502
        assert "Sandbox authentication failed" in exc.value.detail


@pytest.mark.asyncio
async def test_request_aadhaar_otp_403_credits():
    settings.DEMO_MODE = False
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(403, {"message": "Out of credits"})
        with pytest.raises(HTTPException) as exc:
            await eri_service.request_aadhaar_otp(VALID_PAN)
        assert exc.value.status_code == 503
        assert "Sandbox credits exhausted" in exc.value.detail


@pytest.mark.asyncio
async def test_request_aadhaar_otp_404_demo_vs_strict():
    settings.DEMO_MODE = False
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(404, {"message": "Not Found"})
        with pytest.raises(HTTPException) as exc:
            await eri_service.request_aadhaar_otp(VALID_PAN)
        assert exc.value.status_code == 502
        assert "Endpoint not enabled" in exc.value.detail

    settings.DEMO_MODE = True
    try:
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = create_mock_response(404, {"message": "Not Found"})
            res = await eri_service.request_aadhaar_otp(VALID_PAN)
            assert res["success"] is True
            assert res["simulated"] is True
    finally:
        settings.DEMO_MODE = False


@pytest.mark.asyncio
async def test_request_aadhaar_otp_timeout():
    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Timeout")):
        with pytest.raises(HTTPException) as exc:
            await eri_service.request_aadhaar_otp(VALID_PAN)
        assert exc.value.status_code == 503
        assert "Could not connect to Tax OTP service" in exc.value.detail


# =========================================================================
# 3. fetch_prefill_data TESTS
# =========================================================================

@pytest.mark.asyncio
async def test_fetch_prefill_success():
    mock_payload = {
        "data": {
            "income_details": {"salary_income": 850000, "employer_name": "Acme Tech"},
            "deductions": {"section_80c": 120000},
            "taxes_paid": {"total_tds": 45000}
        }
    }
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(200, mock_payload)
        res = await eri_service.fetch_prefill_data(VALID_PAN, "123456")
        assert res["pan"] == VALID_PAN
        assert res["gross_salary"] == 850000
        assert res["employer_name"] == "Acme Tech"
        assert res["simulated"] is False


@pytest.mark.asyncio
async def test_fetch_prefill_401():
    settings.DEMO_MODE = False
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(401, {"message": "Invalid token"})
        with pytest.raises(HTTPException) as exc:
            await eri_service.fetch_prefill_data(VALID_PAN, "123456")
        assert exc.value.status_code == 502
        assert "Sandbox authentication failed" in exc.value.detail


@pytest.mark.asyncio
async def test_fetch_prefill_403_credits():
    settings.DEMO_MODE = False
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(403, {"message": "Quota exceeded / no credit balance"})
        with pytest.raises(HTTPException) as exc:
            await eri_service.fetch_prefill_data(VALID_PAN, "123456")
        assert exc.value.status_code == 503
        assert "Sandbox credits exhausted" in exc.value.detail


@pytest.mark.asyncio
async def test_fetch_prefill_404_demo_vs_strict():
    settings.DEMO_MODE = False
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(404, {"message": "Not Found"})
        with pytest.raises(HTTPException) as exc:
            await eri_service.fetch_prefill_data(VALID_PAN, "123456")
        assert exc.value.status_code == 502
        assert "Endpoint not enabled" in exc.value.detail

    settings.DEMO_MODE = True
    try:
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = create_mock_response(404, {"message": "Not Found"})
            res = await eri_service.fetch_prefill_data(VALID_PAN, "123456")
            assert res["simulated"] is True
            assert res["gross_salary"] == 1200000
    finally:
        settings.DEMO_MODE = False


@pytest.mark.asyncio
async def test_fetch_prefill_timeout():
    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Timeout")):
        with pytest.raises(HTTPException) as exc:
            await eri_service.fetch_prefill_data(VALID_PAN, "123456")
        assert exc.value.status_code == 503
        assert "Could not connect to ITD data service" in exc.value.detail


# =========================================================================
# 4. submit_itr TESTS
# =========================================================================

@pytest.mark.asyncio
async def test_submit_itr_success():
    mock_payload = {
        "data": {
            "ack_number": "ACK_REAL_123456789",
            "status": "PROCESSED"
        }
    }
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(200, mock_payload)
        res = await eri_service.submit_itr(VALID_PAN, {"test": "payload"})
        assert res["status"] == "SUCCESS"
        assert res["ack_number"] == "ACK_REAL_123456789"
        assert res["simulated"] is False


@pytest.mark.asyncio
async def test_submit_itr_401():
    settings.DEMO_MODE = False
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(401, {"message": "Invalid token"})
        with pytest.raises(HTTPException) as exc:
            await eri_service.submit_itr(VALID_PAN, {})
        assert exc.value.status_code == 502
        assert "Sandbox authentication failed" in exc.value.detail


@pytest.mark.asyncio
async def test_submit_itr_403_credits():
    settings.DEMO_MODE = False
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(403, {"message": "Insufficient credits"})
        with pytest.raises(HTTPException) as exc:
            await eri_service.submit_itr(VALID_PAN, {})
        assert exc.value.status_code == 503
        assert "Sandbox credits exhausted" in exc.value.detail


@pytest.mark.asyncio
async def test_submit_itr_404_demo_vs_strict():
    settings.DEMO_MODE = False
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(404, {"message": "Not Found"})
        with pytest.raises(HTTPException) as exc:
            await eri_service.submit_itr(VALID_PAN, {})
        assert exc.value.status_code == 502
        assert "Endpoint not enabled" in exc.value.detail

    settings.DEMO_MODE = True
    try:
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = create_mock_response(404, {"message": "Not Found"})
            res = await eri_service.submit_itr(VALID_PAN, {})
            assert res["status"] == "SUCCESS"
            assert res["simulated"] is True
            assert res["ack_number"] == "ACK_DEMO_987654321"
    finally:
        settings.DEMO_MODE = False


@pytest.mark.asyncio
async def test_submit_itr_timeout():
    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Timeout")):
        with pytest.raises(HTTPException) as exc:
            await eri_service.submit_itr(VALID_PAN, {})
        assert exc.value.status_code == 503
        assert "Could not connect to ITR filing service" in exc.value.detail


# =========================================================================
# 5. everify_itr TESTS (Phase 4)
# =========================================================================

@pytest.mark.asyncio
async def test_everify_itr_success():
    mock_payload = {
        "data": {
            "ack_number": "ACK_REAL_123456789",
            "verification_status": "VERIFIED"
        }
    }
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(200, mock_payload)
        res = await eri_service.everify_itr(VALID_PAN, "ACK_REAL_123456789", "123456")
        assert res["status"] == "SUCCESS"
        assert res["ack_number"] == "ACK_REAL_123456789"
        assert res["simulated"] is False


@pytest.mark.asyncio
async def test_everify_itr_401():
    settings.DEMO_MODE = False
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(401, {"message": "Invalid token"})
        with pytest.raises(HTTPException) as exc:
            await eri_service.everify_itr(VALID_PAN, "ACK_123", "123456")
        assert exc.value.status_code == 502
        assert "Sandbox authentication failed" in exc.value.detail


@pytest.mark.asyncio
async def test_everify_itr_403_credits():
    settings.DEMO_MODE = False
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(403, {"message": "Insufficient credits"})
        with pytest.raises(HTTPException) as exc:
            await eri_service.everify_itr(VALID_PAN, "ACK_123", "123456")
        assert exc.value.status_code == 503
        assert "Sandbox credits exhausted" in exc.value.detail


@pytest.mark.asyncio
async def test_everify_itr_404_demo_vs_strict():
    settings.DEMO_MODE = False
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = create_mock_response(404, {"message": "Not Found"})
        with pytest.raises(HTTPException) as exc:
            await eri_service.everify_itr(VALID_PAN, "ACK_123", "123456")
        assert exc.value.status_code == 502
        assert "Endpoint not enabled" in exc.value.detail

    settings.DEMO_MODE = True
    try:
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = create_mock_response(404, {"message": "Not Found"})
            res = await eri_service.everify_itr(VALID_PAN, "ACK_123", "123456")
            assert res["status"] == "SUCCESS"
            assert res["simulated"] is True
    finally:
        settings.DEMO_MODE = False


@pytest.mark.asyncio
async def test_everify_itr_timeout():
    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Timeout")):
        with pytest.raises(HTTPException) as exc:
            await eri_service.everify_itr(VALID_PAN, "ACK_123", "123456")
        assert exc.value.status_code == 503
        assert "Could not connect to e-verification service" in exc.value.detail
