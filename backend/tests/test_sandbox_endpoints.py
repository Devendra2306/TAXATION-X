import pytest
from fastapi import HTTPException
from unittest.mock import patch, AsyncMock
from app.config import settings
from app.services import eri_service

VALID_PAN = "ABCDE1234F"
SAMPLE_PAYLOAD = {
    "ITR": {
        "ITR1": {
            "CreationInfo": {
                "SWVersionNo": "1.0",
                "SWCreatedBy": "NexTax",
                "XMLCreationDate": "2026-05-01"
            },
            "Form_ITR1": {
                "FormName": "ITR-1",
                "AssessmentYear": "2026"
            },
            "PersonalInfo": {
                "PAN": VALID_PAN,
                "AssesseeName": {"FirstName": "Devendra", "SurNameOrOrgName": "Diwakar"},
                "OptingNewTaxRegime": "Y"
            },
            "ITR1_IncomeDeductions": {
                "GrossSalary": 850000.0,
                "TotalIncome": 800000.0
            },
            "ITR1_TaxComputation": {
                "TotalTaxPayable": 30000.0,
                "TDSClaimed": 30000.0,
                "TaxPayable": 0.0,
                "RefundDue": 0.0
            }
        }
    }
}


@pytest.fixture(autouse=True)
def mock_auth():
    with patch("app.services.eri_service.get_sandbox_token", new_callable=AsyncMock) as mock:
        mock.return_value = "MOCK_TOKEN"
        yield mock


@pytest.mark.asyncio
async def test_unconfigured_otp_endpoint_refuses_in_production():
    orig_endpoint = settings.SANDBOX_GENERATE_OTP_ENDPOINT
    orig_demo = settings.DEMO_MODE
    try:
        settings.SANDBOX_GENERATE_OTP_ENDPOINT = ""
        settings.DEMO_MODE = False

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            with pytest.raises(HTTPException) as exc:
                await eri_service.request_aadhaar_otp(VALID_PAN)
            assert exc.value.status_code == 501
            assert "ITR filing endpoint not configured" in exc.value.detail
            assert "SANDBOX_ENDPOINTS.md" in exc.value.detail
            # Must NEVER have attempted an HTTP request
            mock_post.assert_not_called()
    finally:
        settings.SANDBOX_GENERATE_OTP_ENDPOINT = orig_endpoint
        settings.DEMO_MODE = orig_demo


@pytest.mark.asyncio
async def test_unconfigured_otp_endpoint_simulates_in_demo_mode():
    orig_endpoint = settings.SANDBOX_GENERATE_OTP_ENDPOINT
    orig_demo = settings.DEMO_MODE
    try:
        settings.SANDBOX_GENERATE_OTP_ENDPOINT = ""
        settings.DEMO_MODE = True

        res = await eri_service.request_aadhaar_otp(VALID_PAN)
        assert res["success"] is True
        assert res["simulated"] is True
    finally:
        settings.SANDBOX_GENERATE_OTP_ENDPOINT = orig_endpoint
        settings.DEMO_MODE = orig_demo


@pytest.mark.asyncio
async def test_unconfigured_prefill_endpoint_refuses_in_production():
    orig_endpoint = settings.SANDBOX_PREFILL_ENDPOINT
    orig_demo = settings.DEMO_MODE
    try:
        settings.SANDBOX_PREFILL_ENDPOINT = ""
        settings.DEMO_MODE = False

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            with pytest.raises(HTTPException) as exc:
                await eri_service.fetch_prefill_data(VALID_PAN, "123456")
            assert exc.value.status_code == 501
            assert "ITR filing endpoint not configured" in exc.value.detail
            mock_post.assert_not_called()
    finally:
        settings.SANDBOX_PREFILL_ENDPOINT = orig_endpoint
        settings.DEMO_MODE = orig_demo


@pytest.mark.asyncio
async def test_unconfigured_prefill_endpoint_simulates_in_demo_mode():
    orig_endpoint = settings.SANDBOX_PREFILL_ENDPOINT
    orig_demo = settings.DEMO_MODE
    try:
        settings.SANDBOX_PREFILL_ENDPOINT = ""
        settings.DEMO_MODE = True

        res = await eri_service.fetch_prefill_data(VALID_PAN, "123456")
        assert res["simulated"] is True
        assert res["pan"] == VALID_PAN
    finally:
        settings.SANDBOX_PREFILL_ENDPOINT = orig_endpoint
        settings.DEMO_MODE = orig_demo


@pytest.mark.asyncio
async def test_unconfigured_submit_endpoint_refuses_in_production():
    orig_endpoint = settings.SANDBOX_SUBMIT_ENDPOINT
    orig_demo = settings.DEMO_MODE
    try:
        settings.SANDBOX_SUBMIT_ENDPOINT = ""
        settings.DEMO_MODE = False

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            with pytest.raises(HTTPException) as exc:
                await eri_service.submit_itr(VALID_PAN, SAMPLE_PAYLOAD)
            assert exc.value.status_code == 501
            assert "ITR filing endpoint not configured" in exc.value.detail
            mock_post.assert_not_called()
    finally:
        settings.SANDBOX_SUBMIT_ENDPOINT = orig_endpoint
        settings.DEMO_MODE = orig_demo


@pytest.mark.asyncio
async def test_unconfigured_submit_endpoint_simulates_in_demo_mode():
    orig_endpoint = settings.SANDBOX_SUBMIT_ENDPOINT
    orig_demo = settings.DEMO_MODE
    try:
        settings.SANDBOX_SUBMIT_ENDPOINT = ""
        settings.DEMO_MODE = True

        res = await eri_service.submit_itr(VALID_PAN, SAMPLE_PAYLOAD)
        assert res["status"] == "SUCCESS"
        assert res["simulated"] is True
    finally:
        settings.SANDBOX_SUBMIT_ENDPOINT = orig_endpoint
        settings.DEMO_MODE = orig_demo


@pytest.mark.asyncio
async def test_unconfigured_everify_endpoint_refuses_in_production():
    orig_endpoint = settings.SANDBOX_EVERIFY_ENDPOINT
    orig_demo = settings.DEMO_MODE
    try:
        settings.SANDBOX_EVERIFY_ENDPOINT = ""
        settings.DEMO_MODE = False

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            with pytest.raises(HTTPException) as exc:
                await eri_service.everify_itr(VALID_PAN, "ACK1234567890", "123456")
            assert exc.value.status_code == 501
            assert "ITR filing endpoint not configured" in exc.value.detail
            mock_post.assert_not_called()
    finally:
        settings.SANDBOX_EVERIFY_ENDPOINT = orig_endpoint
        settings.DEMO_MODE = orig_demo


@pytest.mark.asyncio
async def test_unconfigured_everify_endpoint_simulates_in_demo_mode():
    orig_endpoint = settings.SANDBOX_EVERIFY_ENDPOINT
    orig_demo = settings.DEMO_MODE
    try:
        settings.SANDBOX_EVERIFY_ENDPOINT = ""
        settings.DEMO_MODE = True

        res = await eri_service.everify_itr(VALID_PAN, "ACK1234567890", "123456")
        assert res["status"] == "SUCCESS"
        assert res["simulated"] is True
    finally:
        settings.SANDBOX_EVERIFY_ENDPOINT = orig_endpoint
        settings.DEMO_MODE = orig_demo


@pytest.mark.asyncio
async def test_unconfigured_status_endpoint_refuses_in_production():
    orig_endpoint = settings.SANDBOX_STATUS_ENDPOINT
    orig_demo = settings.DEMO_MODE
    try:
        settings.SANDBOX_STATUS_ENDPOINT = ""
        settings.DEMO_MODE = False

        with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
            with pytest.raises(HTTPException) as exc:
                await eri_service.check_upstream_filing_status(VALID_PAN, "2026-27")
            assert exc.value.status_code == 501
            assert "ITR filing endpoint not configured" in exc.value.detail
            mock_get.assert_not_called()
    finally:
        settings.SANDBOX_STATUS_ENDPOINT = orig_endpoint
        settings.DEMO_MODE = orig_demo


@pytest.mark.asyncio
async def test_unconfigured_status_endpoint_simulates_in_demo_mode():
    orig_endpoint = settings.SANDBOX_STATUS_ENDPOINT
    orig_demo = settings.DEMO_MODE
    try:
        settings.SANDBOX_STATUS_ENDPOINT = ""
        settings.DEMO_MODE = True

        res = await eri_service.check_upstream_filing_status(VALID_PAN, "2026-27")
        assert res["exists"] is False
        assert res["status"] == "DEMO_NOT_FOUND"
    finally:
        settings.SANDBOX_STATUS_ENDPOINT = orig_endpoint
        settings.DEMO_MODE = orig_demo


def test_check_and_log_unverified_endpoints():
    orig = settings.SANDBOX_SUBMIT_ENDPOINT
    try:
        settings.SANDBOX_SUBMIT_ENDPOINT = ""
        unverified = eri_service.check_and_log_unverified_endpoints()
        assert "SANDBOX_SUBMIT_ENDPOINT" in unverified
    finally:
        settings.SANDBOX_SUBMIT_ENDPOINT = orig
