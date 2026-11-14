import httpx
import json
import jsonschema
import logging
import os
import re
from typing import Optional, Dict, Any
from fastapi import HTTPException

from app.config import settings

logger = logging.getLogger(__name__)

# Sandbox.co.in API Base URL
ERI_API_BASE = settings.SANDBOX_BASE_URL
ERI_API_KEY = settings.EXTERNAL_API_KEY
ERI_API_SECRET = settings.EXTERNAL_API_SECRET

# Shared Redis & In-Memory Token Cache
REDIS_TOKEN_KEY = "sandbox_eri:access_token"
_cached_token: Optional[str] = None
_cached_token_expiry: float = 0.0
_redis_client = None
_redis_checked = False


def _get_redis():
    global _redis_client, _redis_checked
    if _redis_checked and _redis_client is None:
        return None
    if _redis_client is None:
        try:
            import redis
            client = redis.Redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=1.0,
                socket_timeout=1.0
            )
            client.ping()
            _redis_client = client
            _redis_checked = True
            logger.info("Connected to shared Redis token cache.")
        except Exception as e:
            logger.debug(f"Shared Redis cache unavailable ({e}). Using in-memory token cache.")
            _redis_client = None
            _redis_checked = True
    return _redis_client


def clear_token_cache():
    """Clears both in-memory and Redis token cache (for testing / rotation)."""
    global _cached_token, _cached_token_expiry
    _cached_token = None
    _cached_token_expiry = 0.0
    r = _get_redis()
    if r:
        try:
            r.delete(REDIS_TOKEN_KEY)
        except Exception:
            pass


def _is_credits_exhausted(message: str) -> bool:
    """Helper to detect if an error message indicates exhausted Sandbox credits."""
    return any(w in message.lower() for w in ["credit", "quota", "insufficient", "limit", "exhausted", "balance"])


async def get_sandbox_token() -> str:
    """
    Authenticates with Sandbox.co.in and returns an access token.
    Token is cached in memory for 23 hours to minimize API calls consumed.

    Key facts discovered from live testing:
    - Endpoint: POST /authenticate
    - Headers: x-api-key, x-api-secret, x-api-version: 1.0.0
    - Token is returned at TOP LEVEL as response["access_token"]
      (also mirrored inside response["data"]["access_token"])
    - Token must be passed to subsequent calls WITHOUT "Bearer" prefix.
    """
    import time
    global _cached_token, _cached_token_expiry

    # 1. Check shared Redis cache
    r = _get_redis()
    if r:
        try:
            redis_token = r.get(REDIS_TOKEN_KEY)
            if redis_token:
                return redis_token
        except Exception as e:
            logger.debug(f"Redis get token error: {e}")

    # 2. Check in-memory cache
    if _cached_token and time.time() < _cached_token_expiry:
        return _cached_token

    api_key = settings.EXTERNAL_API_KEY
    api_secret = settings.EXTERNAL_API_SECRET

    if not api_key or not api_secret:
        if settings.DEMO_MODE:
            logger.warning("Sandbox API credentials not configured; using DEMO_TOKEN because DEMO_MODE=True")
            return "DEMO_TOKEN"
        raise HTTPException(status_code=500, detail="Sandbox API credentials not configured.")

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            auth_endpoint = getattr(settings, "SANDBOX_AUTH_ENDPOINT", "/authenticate")
            response = await client.post(
                f"{ERI_API_BASE}{auth_endpoint}",
                headers={
                    "x-api-key": api_key,
                    "x-api-secret": api_secret,
                    "x-api-version": "1.0.0",
                    "accept": "application/json"
                }
            )

            if response.status_code == 200:
                data = response.json()
                token = data.get("access_token") or data.get("data", {}).get("access_token")
                if not token:
                    raise HTTPException(status_code=500, detail="Sandbox Auth response missing access_token.")
                _cached_token = token
                _cached_token_expiry = time.time() + (23 * 3600)  # cache for 23h
                if r:
                    try:
                        r.set(REDIS_TOKEN_KEY, token, ex=23 * 3600)
                    except Exception as e:
                        logger.debug(f"Redis set token error: {e}")
                logger.info("Sandbox API token refreshed successfully.")
                return token
            elif response.status_code == 401:
                logger.error(f"Sandbox Auth failed: 401 - {response.text}")
                if settings.DEMO_MODE:
                    return "DEMO_TOKEN"
                raise HTTPException(status_code=502, detail="Sandbox authentication failed")
            elif response.status_code == 403:
                msg = response.text
                try:
                    msg = response.json().get("message", response.text)
                except Exception:
                    pass
                if _is_credits_exhausted(msg):
                    if settings.DEMO_MODE:
                        return "DEMO_TOKEN"
                    raise HTTPException(status_code=503, detail="Sandbox credits exhausted")
                if settings.DEMO_MODE:
                    return "DEMO_TOKEN"
                raise HTTPException(status_code=502, detail="Endpoint not enabled on this Sandbox plan")
            else:
                logger.error(f"Sandbox Auth failed: {response.status_code} - {response.text}")
                if settings.DEMO_MODE:
                    return "DEMO_TOKEN"
                raise HTTPException(status_code=502, detail=f"Sandbox Auth Failed: {response.status_code}")
        except HTTPException:
            raise
        except httpx.RequestError as e:
            logger.error(f"Sandbox Auth connection error: {e}")
            if settings.DEMO_MODE:
                return "DEMO_TOKEN"
            raise HTTPException(status_code=503, detail="Could not connect to Sandbox API.")


async def verify_pan_number(pan_number: str, name: str = "Unknown", dob: str = "01/01/1990") -> dict:
    """
    Verify PAN via Sandbox KYC API.

    Correct endpoint:
      POST /kyc/pan/verify
    Required payload fields:
      @entity, pan, name_as_per_pan, date_of_birth, consent, reason
    Authorization header: raw token WITHOUT 'Bearer' prefix.
    """
    if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", pan_number):
        raise HTTPException(status_code=400, detail="Invalid PAN format. Must be 10 characters like ABCDE1234F.")

    token = await get_sandbox_token()
    api_key = settings.EXTERNAL_API_KEY

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            pan_endpoint = getattr(settings, "SANDBOX_PAN_VERIFY_ENDPOINT", "/kyc/pan/verify")
            response = await client.post(
                f"{ERI_API_BASE}{pan_endpoint}",
                headers={
                    "Authorization": token,        # NO 'Bearer' prefix — Sandbox specific
                    "x-api-key": api_key,
                    "x-api-version": "1.0.0",
                    "Content-Type": "application/json"
                },
                json={
                    "@entity": "in.co.sandbox.kyc.pan_verification.request",
                    "pan": pan_number,
                    "name_as_per_pan": name,
                    "date_of_birth": dob,          # Required: DD/MM/YYYY
                    "consent": "Y",
                    "reason": "Income tax filing identity verification — OFS Taxation Platform"
                }
            )

            try:
                data = response.json()
            except Exception:
                data = {"message": response.text}

            logger.info(f"PAN verify {pan_number}: HTTP {response.status_code}")

            if response.status_code == 200:
                pan_data = data.get("data", {})
                status = pan_data.get("status", "")
                is_valid = status.lower() in ["valid", "existing and valid", "e"]

                return {
                    "status": "success",
                    "verified": is_valid,
                    "pan": pan_number,
                    "name": pan_data.get("name_as_per_pan", pan_data.get("full_name", name)),
                    "pan_status": status,
                    "status_description": pan_data.get("status_description", ""),
                    "category": pan_data.get("category", "individual"),
                    "aadhaar_linked": pan_data.get("aadhaar_seeding_status", "na") not in ["na", ""],
                    "simulated": False,
                    "raw": pan_data
                }
            elif response.status_code == 422:
                raise HTTPException(status_code=422, detail=f"Invalid PAN request: {data.get('message', 'Validation error')}")
            elif response.status_code == 401:
                if settings.DEMO_MODE:
                    return {
                        "status": "success", "verified": True, "pan": pan_number, "name": name,
                        "pan_status": "simulated", "status_description": "Verified (Simulated - Demo Mode)",
                        "category": "individual", "aadhaar_linked": False, "simulated": True,
                        "raw": {"simulated": True}
                    }
                raise HTTPException(status_code=502, detail="Sandbox authentication failed")
            elif response.status_code == 403:
                msg = data.get("message", "")
                if _is_credits_exhausted(msg):
                    if settings.DEMO_MODE:
                        logger.warning(f"Sandbox KYC credits exhausted. Simulating PAN verify for {pan_number}.")
                        return {
                            "status": "success", "verified": True, "pan": pan_number, "name": name,
                            "pan_status": "simulated",
                            "status_description": "Verified (Simulated - API credits exhausted)",
                            "category": "individual", "aadhaar_linked": False,
                            "simulated": True,
                            "raw": {"simulated": True, "reason": "credits_exhausted"}
                        }
                    raise HTTPException(status_code=503, detail="Sandbox credits exhausted")
                if settings.DEMO_MODE:
                    return {
                        "status": "success", "verified": True, "pan": pan_number, "name": name,
                        "pan_status": "simulated", "status_description": "Verified (Simulated)",
                        "category": "individual", "aadhaar_linked": False, "simulated": True,
                        "raw": {"simulated": True}
                    }
                raise HTTPException(status_code=502, detail="Endpoint not enabled on this Sandbox plan")
            elif response.status_code == 404:
                if settings.DEMO_MODE:
                    return {
                        "status": "success", "verified": True, "pan": pan_number, "name": name,
                        "pan_status": "simulated", "status_description": "Verified (Simulated - 404 fallback)",
                        "category": "individual", "aadhaar_linked": False, "simulated": True,
                        "raw": {"simulated": True}
                    }
                raise HTTPException(status_code=502, detail="Endpoint not enabled on this Sandbox plan")
            else:
                raise HTTPException(status_code=400, detail=f"PAN verification failed: {data.get('message', response.text)}")

        except HTTPException:
            raise
        except httpx.RequestError as e:
            logger.error(f"PAN verify connection error: {e}")
            raise HTTPException(status_code=503, detail="Could not connect to PAN verification service.")


async def request_aadhaar_otp(pan_number: str) -> dict:
    """
    Request ITD OTP for the user via Sandbox ERI API.
    """
    endpoint = settings.SANDBOX_GENERATE_OTP_ENDPOINT
    if not endpoint:
        if settings.DEMO_MODE:
            logger.warning("SANDBOX_GENERATE_OTP_ENDPOINT not configured. Returning simulated response because DEMO_MODE=True.")
            return {
                "success": True,
                "message": "OTP sent successfully (Simulated - endpoint unconfigured)",
                "simulated": True,
                "raw": {"simulated": True}
            }
        raise HTTPException(
            status_code=501,
            detail="ITR filing endpoint not configured. See docs/SANDBOX_ENDPOINTS.md."
        )

    token = await get_sandbox_token()
    api_key = settings.EXTERNAL_API_KEY

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            response = await client.post(
                f"{ERI_API_BASE}{settings.SANDBOX_GENERATE_OTP_ENDPOINT}",
                headers={
                    "Authorization": token,
                    "x-api-key": api_key,
                    "x-api-version": "1.0.0",
                    "Content-Type": "application/json"
                },
                json={"pan": pan_number}
            )

            try:
                data = response.json()
            except Exception:
                data = {"message": response.text}

            if response.status_code == 200:
                return {
                    "success": True,
                    "message": "OTP sent successfully to registered mobile number",
                    "simulated": False,
                    "raw": data
                }
            elif response.status_code == 401:
                if settings.DEMO_MODE:
                    return {
                        "success": True,
                        "message": "OTP sent successfully (Simulated - Demo Mode)",
                        "simulated": True,
                        "raw": {"simulated": True}
                    }
                raise HTTPException(status_code=502, detail="Sandbox authentication failed")
            elif response.status_code == 403:
                msg = data.get("message", "")
                if _is_credits_exhausted(msg):
                    if settings.DEMO_MODE:
                        return {
                            "success": True,
                            "message": "OTP sent successfully (Simulated - credits exhausted)",
                            "simulated": True,
                            "raw": {"simulated": True, "reason": "credits_exhausted"}
                        }
                    raise HTTPException(status_code=503, detail="Sandbox credits exhausted")
                if settings.DEMO_MODE:
                    return {
                        "success": True,
                        "message": "OTP sent successfully (Simulated - plan not enabled)",
                        "simulated": True,
                        "raw": {"simulated": True}
                    }
                raise HTTPException(status_code=502, detail="Endpoint not enabled on this Sandbox plan")
            elif response.status_code == 404:
                if settings.DEMO_MODE:
                    logger.warning(f"ITR OTP API not available ({response.status_code}). Simulating success because DEMO_MODE=True.")
                    return {
                        "success": True,
                        "message": "OTP sent successfully (Simulated - endpoint 404)",
                        "simulated": True,
                        "raw": {"simulated": True}
                    }
                raise HTTPException(status_code=502, detail="Endpoint not enabled on this Sandbox plan")
            else:
                raise HTTPException(status_code=400, detail=f"Failed to send ITD OTP: {data.get('message', response.text)}")

        except HTTPException:
            raise
        except httpx.RequestError as e:
            logger.error(f"Tax OTP connection error: {e}")
            raise HTTPException(status_code=503, detail="Could not connect to Tax OTP service.")


async def fetch_prefill_data(pan_number: str, otp: str) -> dict:
    """
    Verify OTP and fetch AIS / Form 26AS prefill data from ITD via Sandbox.
    """
    endpoint = settings.SANDBOX_PREFILL_ENDPOINT
    if not endpoint:
        if settings.DEMO_MODE:
            logger.warning("SANDBOX_PREFILL_ENDPOINT not configured. Returning simulated response because DEMO_MODE=True.")
            return {
                "pan": pan_number,
                "gross_salary": 1200000.0,
                "deductions_80c": 150000.0,
                "section_80d": 25000.0,
                "tds_deducted": 85000.0,
                "interest_income": 12000.0,
                "dividend_income": 3000.0,
                "capital_gains": 0.0,
                "business_income": 0.0,
                "employer_name": "Demo Employer Pvt. Ltd.",
                "itr1_eligible": True,
                "unsupported_reason": None,
                "simulated": True,
                "raw_sandbox_data": {"simulated": True, "note": "Demo mode active"}
            }
        raise HTTPException(
            status_code=501,
            detail="ITR filing endpoint not configured. See docs/SANDBOX_ENDPOINTS.md."
        )

    token = await get_sandbox_token()
    api_key = settings.EXTERNAL_API_KEY

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.post(
                f"{ERI_API_BASE}{settings.SANDBOX_PREFILL_ENDPOINT}",
                headers={
                    "Authorization": token,
                    "x-api-key": api_key,
                    "x-api-version": "1.0.0",
                    "Content-Type": "application/json"
                },
                json={"pan": pan_number, "otp": otp}
            )

            try:
                resp_json = response.json()
            except Exception:
                resp_json = {"message": response.text}

            if response.status_code == 200:
                data = resp_json.get("data", {})
                income_details = data.get("income_details", {})
                deduction_details = data.get("deductions", {})
                taxes_paid = data.get("taxes_paid", {})
                other_sources = data.get("other_sources", {})
                ais_data = data.get("ais", {}) or data.get("ais_data", {})

                gross_salary = float(income_details.get("salary_income", income_details.get("gross_salary", 0)) or 0)
                deductions_80c = float(deduction_details.get("section_80c", 0) or 0)
                section_80d = float(deduction_details.get("section_80d", 0) or 0)
                tds_deducted = float(taxes_paid.get("total_tds", 0) or 0)
                interest_income = float(income_details.get("interest_income", other_sources.get("interest_income", ais_data.get("interest_income", 0))) or 0)
                dividend_income = float(income_details.get("dividend_income", other_sources.get("dividend_income", ais_data.get("dividend_income", 0))) or 0)
                capital_gains = float(income_details.get("capital_gains", data.get("capital_gains", ais_data.get("capital_gains", 0))) or 0)
                business_income = float(income_details.get("business_income", data.get("business_income", 0)) or 0)
                employer_name = income_details.get("employer_name", "Fetched from ITD")

                itr1_eligible, unsupported_reason = check_itr1_eligibility(
                    gross_salary=gross_salary,
                    interest_income=interest_income,
                    dividend_income=dividend_income,
                    capital_gains=capital_gains,
                    business_income=business_income
                )

                return {
                    "pan": pan_number,
                    "gross_salary": gross_salary,
                    "deductions_80c": deductions_80c,
                    "section_80d": section_80d,
                    "tds_deducted": tds_deducted,
                    "interest_income": interest_income,
                    "dividend_income": dividend_income,
                    "capital_gains": capital_gains,
                    "business_income": business_income,
                    "employer_name": employer_name,
                    "itr1_eligible": itr1_eligible,
                    "unsupported_reason": unsupported_reason,
                    "simulated": False,
                    "raw_sandbox_data": data
                }
            elif response.status_code == 401:
                if settings.DEMO_MODE:
                    return {
                        "pan": pan_number,
                        "gross_salary": 1200000.0,
                        "deductions_80c": 150000.0,
                        "section_80d": 25000.0,
                        "tds_deducted": 85000.0,
                        "interest_income": 12000.0,
                        "dividend_income": 3000.0,
                        "capital_gains": 0.0,
                        "business_income": 0.0,
                        "employer_name": "Demo Employer Pvt. Ltd.",
                        "itr1_eligible": True,
                        "unsupported_reason": None,
                        "simulated": True,
                        "raw_sandbox_data": {"simulated": True, "note": "Demo mode active"}
                    }
                raise HTTPException(status_code=502, detail="Sandbox authentication failed")
            elif response.status_code == 403:
                msg = resp_json.get("message", "")
                if _is_credits_exhausted(msg):
                    if settings.DEMO_MODE:
                        return {
                            "pan": pan_number,
                            "gross_salary": 1200000.0,
                            "deductions_80c": 150000.0,
                            "section_80d": 25000.0,
                            "tds_deducted": 85000.0,
                            "interest_income": 12000.0,
                            "dividend_income": 3000.0,
                            "capital_gains": 0.0,
                            "business_income": 0.0,
                            "employer_name": "Demo Employer Pvt. Ltd.",
                            "itr1_eligible": True,
                            "unsupported_reason": None,
                            "simulated": True,
                            "raw_sandbox_data": {"simulated": True, "reason": "credits_exhausted"}
                        }
                    raise HTTPException(status_code=503, detail="Sandbox credits exhausted")
                if settings.DEMO_MODE:
                    return {
                        "pan": pan_number,
                        "gross_salary": 1200000.0,
                        "deductions_80c": 150000.0,
                        "section_80d": 25000.0,
                        "tds_deducted": 85000.0,
                        "interest_income": 12000.0,
                        "dividend_income": 3000.0,
                        "capital_gains": 0.0,
                        "business_income": 0.0,
                        "employer_name": "Demo Employer Pvt. Ltd.",
                        "itr1_eligible": True,
                        "unsupported_reason": None,
                        "simulated": True,
                        "raw_sandbox_data": {"simulated": True, "note": "API plan not subscribed"}
                    }
                raise HTTPException(status_code=502, detail="Endpoint not enabled on this Sandbox plan")
            elif response.status_code == 404:
                if settings.DEMO_MODE:
                    logger.warning(f"ITR Prefill API not available ({response.status_code}). Returning demo data because DEMO_MODE=True.")
                    return {
                        "pan": pan_number,
                        "gross_salary": 1200000.0,
                        "deductions_80c": 150000.0,
                        "section_80d": 25000.0,
                        "tds_deducted": 85000.0,
                        "interest_income": 12000.0,
                        "dividend_income": 3000.0,
                        "capital_gains": 0.0,
                        "business_income": 0.0,
                        "employer_name": "Demo Employer Pvt. Ltd.",
                        "itr1_eligible": True,
                        "unsupported_reason": None,
                        "simulated": True,
                        "raw_sandbox_data": {"simulated": True, "note": "API plan not subscribed"}
                    }
                raise HTTPException(status_code=502, detail="Endpoint not enabled on this Sandbox plan")
            else:
                raise HTTPException(status_code=400, detail=f"Failed to fetch prefill data: {resp_json.get('message', response.text)}")

        except HTTPException:
            raise
        except httpx.RequestError as e:
            logger.error(f"ITD prefill connection error: {e}")
            raise HTTPException(status_code=503, detail="Could not connect to ITD data service.")


async def submit_itr(pan_number: str, itr_json_payload: dict) -> dict:
    """
    Submit ITR to Income Tax Department via Sandbox ERI.
    """
    endpoint = settings.SANDBOX_SUBMIT_ENDPOINT
    if not endpoint:
        if settings.DEMO_MODE:
            logger.warning("SANDBOX_SUBMIT_ENDPOINT not configured. Returning simulated response because DEMO_MODE=True.")
            return {
                "status": "SUCCESS",
                "message": "ITR Submitted (Demo Mode — simulated)",
                "ack_number": "ACK_DEMO_987654321",
                "simulated": True,
                "raw": {"simulated": True}
            }
        raise HTTPException(
            status_code=501,
            detail="ITR filing endpoint not configured. See docs/SANDBOX_ENDPOINTS.md."
        )

    token = await get_sandbox_token()
    api_key = settings.EXTERNAL_API_KEY

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            response = await client.post(
                f"{ERI_API_BASE}{settings.SANDBOX_SUBMIT_ENDPOINT}",
                headers={
                    "Authorization": token,
                    "x-api-key": api_key,
                    "x-api-version": "1.0.0",
                    "Content-Type": "application/json"
                },
                json={"pan": pan_number, "itr_data": itr_json_payload}
            )

            try:
                resp_json = response.json()
            except Exception:
                resp_json = {"message": response.text}

            if response.status_code == 200:
                data = resp_json.get("data", {})
                return {
                    "status": "SUCCESS",
                    "message": "ITR Submitted Successfully",
                    "ack_number": data.get("ack_number", "PENDING"),
                    "simulated": False,
                    "raw": data
                }
            elif response.status_code == 401:
                if settings.DEMO_MODE:
                    return {
                        "status": "SUCCESS",
                        "message": "ITR Submitted (Demo Mode — simulated)",
                        "ack_number": "ACK_DEMO_987654321",
                        "simulated": True,
                        "raw": {"simulated": True}
                    }
                raise HTTPException(status_code=502, detail="Sandbox authentication failed")
            elif response.status_code == 403:
                msg = resp_json.get("message", "")
                if _is_credits_exhausted(msg):
                    if settings.DEMO_MODE:
                        return {
                            "status": "SUCCESS",
                            "message": "ITR Submitted (Simulated - credits exhausted)",
                            "ack_number": "ACK_DEMO_987654321",
                            "simulated": True,
                            "raw": {"simulated": True, "reason": "credits_exhausted"}
                        }
                    raise HTTPException(status_code=503, detail="Sandbox credits exhausted")
                if settings.DEMO_MODE:
                    return {
                        "status": "SUCCESS",
                        "message": "ITR Submitted (API plan not subscribed — simulated)",
                        "ack_number": "ACK_DEMO_987654321",
                        "simulated": True,
                        "raw": {"simulated": True}
                    }
                raise HTTPException(status_code=502, detail="Endpoint not enabled on this Sandbox plan")
            elif response.status_code == 404:
                if settings.DEMO_MODE:
                    logger.warning(f"ITR Submit API not available ({response.status_code}). Simulating because DEMO_MODE=True.")
                    return {
                        "status": "SUCCESS",
                        "message": "ITR Submitted (API plan not subscribed — simulated)",
                        "ack_number": "ACK_DEMO_987654321",
                        "simulated": True,
                        "raw": {"simulated": True}
                    }
                raise HTTPException(status_code=502, detail="Endpoint not enabled on this Sandbox plan")
            else:
                raise HTTPException(status_code=400, detail=f"ITR submission failed: {resp_json.get('message', response.text)}")

        except HTTPException:
            raise
        except httpx.RequestError as e:
            logger.error(f"ITR submit connection error: {e}")
            raise HTTPException(status_code=503, detail="Could not connect to ITR filing service.")


async def everify_itr(pan_number: str, ack_number: str, otp: str) -> dict:
    """
    E-verify ITR submission using Aadhaar OTP via Sandbox ERI.
    Endpoint: POST /tax/itr/e-verify
    Payload: {"pan": pan_number, "ack_number": ack_number, "otp": otp, "verification_mode": "aadhaar_otp"}
    """
    endpoint = settings.SANDBOX_EVERIFY_ENDPOINT
    if not endpoint:
        if settings.DEMO_MODE:
            logger.warning("SANDBOX_EVERIFY_ENDPOINT not configured. Returning simulated response because DEMO_MODE=True.")
            return {
                "status": "SUCCESS",
                "message": "ITR e-verified (Demo Mode — simulated)",
                "ack_number": ack_number,
                "simulated": True,
                "raw": {"simulated": True}
            }
        raise HTTPException(
            status_code=501,
            detail="ITR filing endpoint not configured. See docs/SANDBOX_ENDPOINTS.md."
        )

    token = await get_sandbox_token()
    api_key = settings.EXTERNAL_API_KEY

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.post(
                f"{ERI_API_BASE}{settings.SANDBOX_EVERIFY_ENDPOINT}",
                headers={
                    "Authorization": token,
                    "x-api-key": api_key,
                    "x-api-version": "1.0.0",
                    "Content-Type": "application/json"
                },
                json={
                    "pan": pan_number,
                    "ack_number": ack_number,
                    "otp": otp,
                    "verification_mode": "aadhaar_otp"
                }
            )

            try:
                resp_json = response.json()
            except Exception:
                resp_json = {"message": response.text}

            if response.status_code == 200:
                data = resp_json.get("data", {})
                return {
                    "status": "SUCCESS",
                    "message": "ITR e-verified successfully",
                    "ack_number": ack_number,
                    "simulated": False,
                    "raw": data
                }
            elif response.status_code == 401:
                if settings.DEMO_MODE:
                    return {
                        "status": "SUCCESS",
                        "message": "ITR e-verified (Demo Mode — simulated)",
                        "ack_number": ack_number,
                        "simulated": True,
                        "raw": {"simulated": True}
                    }
                raise HTTPException(status_code=502, detail="Sandbox authentication failed")
            elif response.status_code == 403:
                msg = resp_json.get("message", "")
                if _is_credits_exhausted(msg):
                    if settings.DEMO_MODE:
                        return {
                            "status": "SUCCESS",
                            "message": "ITR e-verified (Simulated - credits exhausted)",
                            "ack_number": ack_number,
                            "simulated": True,
                            "raw": {"simulated": True, "reason": "credits_exhausted"}
                        }
                    raise HTTPException(status_code=503, detail="Sandbox credits exhausted")
                if settings.DEMO_MODE:
                    return {
                        "status": "SUCCESS",
                        "message": "ITR e-verified (API plan not subscribed — simulated)",
                        "ack_number": ack_number,
                        "simulated": True,
                        "raw": {"simulated": True}
                    }
                raise HTTPException(status_code=502, detail="Endpoint not enabled on this Sandbox plan")
            elif response.status_code == 404:
                if settings.DEMO_MODE:
                    logger.warning(f"ITR e-verify API not available ({response.status_code}). Simulating because DEMO_MODE=True.")
                    return {
                        "status": "SUCCESS",
                        "message": "ITR e-verified (API plan not subscribed — simulated)",
                        "ack_number": ack_number,
                        "simulated": True,
                        "raw": {"simulated": True}
                    }
                raise HTTPException(status_code=502, detail="Endpoint not enabled on this Sandbox plan")
            else:
                raise HTTPException(status_code=400, detail=f"e-Verification failed: {resp_json.get('message', response.text)}")

        except HTTPException:
            raise
        except httpx.RequestError as e:
            logger.error(f"ITR e-verify connection error: {e}")
            raise HTTPException(status_code=503, detail="Could not connect to e-verification service.")


def check_itr1_eligibility(
    gross_salary: float = 0.0,
    interest_income: float = 0.0,
    dividend_income: float = 0.0,
    capital_gains: float = 0.0,
    business_income: float = 0.0
) -> tuple[bool, Optional[str]]:
    """
    Evaluates whether the income profile satisfies statutory eligibility for ITR-1 (Sahaj).
    ITR-1 is restricted to resident individuals with total income up to ₹50 Lakhs.
    Capital gains, business/professional income, and income > ₹50L are not supported.
    """
    total_income = gross_salary + interest_income + dividend_income + capital_gains + business_income
    reasons = []

    if total_income > 5000000:
        reasons.append(
            f"Total income (₹{total_income:,.0f}) exceeds ₹50 Lakh statutory limit for ITR-1 (Sahaj). "
            "Assessee must file using ITR-2."
        )
    if capital_gains > 0:
        reasons.append(
            f"Capital gains of ₹{capital_gains:,.0f} detected. "
            "ITR-1 does not support capital gains; assessee must file using ITR-2."
        )
    if business_income > 0:
        reasons.append(
            f"Business/professional income of ₹{business_income:,.0f} detected. "
            "ITR-1 does not support business profits; assessee must file using ITR-3 or ITR-4."
        )

    if reasons:
        return False, "; ".join(reasons)
    return True, None


ITD_SCHEMAS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "schemas", "itd")
_schema_cache: dict[str, dict] = {}


def get_itd_schema_path(expected_ay: Optional[str] = None) -> Optional[str]:
    """
    Locates the official ITD JSON schema file for the requested AY.
    Looks for:
      1. ITR1_AY{expected_ay}.schema.json (e.g. ITR1_AY2026-27.schema.json)
      2. ITR1_AY{start_year}.schema.json (e.g. ITR1_AY2026.schema.json)
      3. ITR1.schema.json (fallback default)
    """
    candidates = []
    if expected_ay:
        ay_clean = expected_ay.strip()
        candidates.append(f"ITR1_AY{ay_clean}.schema.json")
        start_year = ay_clean.split("-")[0]
        candidates.append(f"ITR1_AY{start_year}.schema.json")
    candidates.append("ITR1.schema.json")

    for filename in candidates:
        candidate_path = os.path.join(ITD_SCHEMAS_DIR, filename)
        if os.path.isfile(candidate_path):
            return candidate_path
    return None


def load_itd_schema(schema_path: str) -> dict:
    if schema_path not in _schema_cache:
        with open(schema_path, "r", encoding="utf-8") as f:
            _schema_cache[schema_path] = json.load(f)
    return _schema_cache[schema_path]


def _validate_handwritten_fallback(itr_data: Dict[str, Any], errors: list[str], expected_ay: Optional[str] = None):
    """Fallback structural checks when official schema file is absent in DEMO_MODE."""
    itr = itr_data.get("ITR")
    if not isinstance(itr, dict):
        errors.append("Missing root 'ITR' element in payload.")
        return

    itr1 = itr.get("ITR1")
    if not isinstance(itr1, dict):
        errors.append("Missing 'ITR1' element inside root 'ITR'.")
        return

    creation_info = itr1.get("CreationInfo")
    if not isinstance(creation_info, dict):
        errors.append("Missing 'CreationInfo' section in ITR1.")
    else:
        if not creation_info.get("SWVersionNo"):
            errors.append("Missing 'SWVersionNo' in CreationInfo.")
        if not creation_info.get("SWCreatedBy"):
            errors.append("Missing 'SWCreatedBy' in CreationInfo.")
        c_date = creation_info.get("XMLCreationDate") or creation_info.get("JSONCreationDate")
        if not c_date or not re.match(r"^\d{4}-\d{2}-\d{2}$", str(c_date)):
            errors.append(f"Invalid or missing creation date '{c_date}' in CreationInfo; expected YYYY-MM-DD.")

    form_itr1 = itr1.get("Form_ITR1")
    if not isinstance(form_itr1, dict):
        errors.append("Missing 'Form_ITR1' section.")
    else:
        if form_itr1.get("FormName") != "ITR-1":
            errors.append(f"Invalid FormName '{form_itr1.get('FormName')}'; expected 'ITR-1'.")
        ay = str(form_itr1.get("AssessmentYear") or "")
        if not ay or not re.match(r"^\d{4}$", ay):
            errors.append(f"Invalid AssessmentYear '{ay}' in Form_ITR1; expected 4-digit start year (e.g. '2025').")

    personal_info = itr1.get("PersonalInfo")
    if not isinstance(personal_info, dict):
        errors.append("Missing 'PersonalInfo' section.")
    else:
        pan = personal_info.get("PAN")
        if not pan or not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", str(pan)):
            errors.append(f"Invalid or missing PAN '{pan}' in PersonalInfo. Must match ^[A-Z]{5}[0-9]{4}[A-Z]{1}$.")
        name = personal_info.get("AssesseeName")
        if not isinstance(name, dict) or not str(name.get("FirstName", "")).strip():
            errors.append("Missing or empty 'AssesseeName.FirstName' in PersonalInfo.")
        regime = personal_info.get("OptingNewTaxRegime")
        if regime not in ("Y", "N"):
            errors.append(f"Invalid 'OptingNewTaxRegime' value '{regime}'; must be 'Y' (New Regime) or 'N' (Old Regime).")

    inc = itr1.get("ITR1_IncomeDeductions")
    if not isinstance(inc, dict):
        errors.append("Missing 'ITR1_IncomeDeductions' section.")
    else:
        gross_salary = inc.get("GrossSalary")
        if gross_salary is None or not isinstance(gross_salary, (int, float)) or gross_salary < 0:
            errors.append(f"Invalid GrossSalary '{gross_salary}'; must be a non-negative number.")
        total_income = inc.get("TotalIncome")
        if total_income is None or not isinstance(total_income, (int, float)):
            errors.append("Missing or invalid 'TotalIncome' in ITR1_IncomeDeductions.")
        elif total_income < 0:
            errors.append(f"TotalIncome cannot be negative: {total_income}.")

    tax_comp = itr1.get("ITR1_TaxComputation")
    if not isinstance(tax_comp, dict):
        errors.append("Missing 'ITR1_TaxComputation' section.")
    else:
        tax_payable = tax_comp.get("TotalTaxPayable")
        if tax_payable is None or not isinstance(tax_payable, (int, float)) or tax_payable < 0:
            errors.append(f"Invalid TotalTaxPayable '{tax_payable}'; must be a non-negative number.")
        tds = tax_comp.get("TDSClaimed")
        if tds is None or not isinstance(tds, (int, float)) or tds < 0:
            errors.append(f"Invalid TDSClaimed '{tds}'; must be a non-negative number.")


def validate_itr1_schema(itr_data: Dict[str, Any], expected_ay: Optional[str] = None) -> list[str]:
    """
    Validates ITR-1 JSON data against official Income Tax Department (CBDT) JSON schema
    specifications using jsonschema, followed by layered statutory business-logic rules:
      Layer 1: Structural JSON Schema Validation (jsonschema.Draft7Validator against official schema file)
      Layer 2: Statutory Business-Logic Checks (AY consistency, income ceiling <= 50L, 80C regime cap, tax reconciliation)
    Returns an empty list if valid, or a list of diagnostic error strings if invalid.
    """
    errors: list[str] = []
    if not isinstance(itr_data, dict):
        return ["ITR payload must be a JSON object."]

    # --- Layer 1: Official ITD JSON Schema Validation ---
    schema_path = get_itd_schema_path(expected_ay)
    if not schema_path or not os.path.isfile(schema_path):
        if not settings.DEMO_MODE:
            raise FileNotFoundError(
                f"Official ITD JSON schema file missing for AY {expected_ay or 'default'}. "
                f"Please place it in backend/app/schemas/itd/. See docs/SANDBOX_ENDPOINTS.md and backend/app/schemas/itd/README.md."
            )
        logger.warning(
            f"Official ITD schema file missing for AY {expected_ay or 'default'}. "
            "Falling back to built-in business checks because DEMO_MODE=True."
        )
        _validate_handwritten_fallback(itr_data, errors, expected_ay)
    else:
        try:
            schema = load_itd_schema(schema_path)
            validator = jsonschema.Draft7Validator(schema)
            for err in sorted(validator.iter_errors(itr_data), key=lambda e: list(e.path)):
                loc = " -> ".join(str(p) for p in err.path) if err.path else "root"
                errors.append(f"Schema validation error at [{loc}]: {err.message}")
        except Exception as e:
            errors.append(f"JSON schema validation execution error: {e}")

    # --- Layer 2: Statutory Business-Logic Rules ---
    itr = itr_data.get("ITR")
    itr1 = itr.get("ITR1") if isinstance(itr, dict) else None

    if isinstance(itr1, dict):
        form_itr1 = itr1.get("Form_ITR1")
        if isinstance(form_itr1, dict):
            ay = str(form_itr1.get("AssessmentYear") or "")
            if expected_ay:
                expected_start = expected_ay.split("-")[0] if "-" in expected_ay else expected_ay
                if ay and ay != expected_start:
                    errors.append(
                        f"AssessmentYear mismatch in filing JSON: Form_ITR1 has '{ay}', "
                        f"but submitted assessment year is '{expected_ay}' (expected '{expected_start}')."
                    )

        personal_info = itr1.get("PersonalInfo", {})
        regime = personal_info.get("OptingNewTaxRegime") if isinstance(personal_info, dict) else "Y"

        inc = itr1.get("ITR1_IncomeDeductions", {})
        if isinstance(inc, dict):
            total_income = inc.get("TotalIncome")
            if isinstance(total_income, (int, float)) and total_income > 5000000:
                errors.append(
                    f"TotalIncome ₹{total_income:,.0f} exceeds the statutory ₹50,00,000 threshold for ITR-1 (Sahaj). "
                    "Assessee must file using ITR-2."
                )

            chap_via = inc.get("UsrDeductUndChapVIA", {})
            if isinstance(chap_via, dict):
                sec_80c = chap_via.get("Section80C", 0)
                if isinstance(sec_80c, (int, float)):
                    if regime == "Y" and sec_80c > 0:
                        errors.append(
                            f"Section 80C deductions (₹{sec_80c:,.0f}) are not allowable under the New Tax Regime (Section 115BAC)."
                        )
                    elif regime == "N" and sec_80c > 150000:
                        errors.append(
                            f"Section 80C deductions (₹{sec_80c:,.0f}) exceed the statutory ₹1,50,000 cap."
                        )

        tax_comp = itr1.get("ITR1_TaxComputation", {})
        if isinstance(tax_comp, dict):
            tax_payable = tax_comp.get("TotalTaxPayable")
            tds = tax_comp.get("TDSClaimed")
            refund_due = tax_comp.get("RefundDue")
            balance_payable = tax_comp.get("TaxPayable")
            if isinstance(tax_payable, (int, float)) and isinstance(tds, (int, float)):
                expected_balance = max(0, tax_payable - tds)
                expected_refund = max(0, tds - tax_payable)
                if balance_payable is not None and abs(balance_payable - expected_balance) > 1.0:
                    errors.append(
                        f"TaxPayable (₹{balance_payable}) does not reconcile with TotalTaxPayable (₹{tax_payable}) - TDSClaimed (₹{tds}). Expected ₹{expected_balance}."
                    )
                if refund_due is not None and abs(refund_due - expected_refund) > 1.0:
                    errors.append(
                        f"RefundDue (₹{refund_due}) does not reconcile with TDSClaimed (₹{tds}) - TotalTaxPayable (₹{tax_payable}). Expected ₹{expected_refund}."
                    )

    return errors


async def check_upstream_filing_status(pan_number: str, assessment_year: str) -> dict:
    """
    Queries Sandbox / Income Tax Department to check if an ITR filing already exists
    for this PAN and Assessment Year. Used prior to retry attempts after a network timeout.
    """
    endpoint = settings.SANDBOX_STATUS_ENDPOINT
    if not endpoint:
        if settings.DEMO_MODE:
            return {"exists": False, "status": "DEMO_NOT_FOUND"}
        raise HTTPException(
            status_code=501,
            detail="ITR filing endpoint not configured. See docs/SANDBOX_ENDPOINTS.md."
        )

    token = await get_sandbox_token()
    api_key = settings.EXTERNAL_API_KEY
    endpoint = settings.SANDBOX_STATUS_ENDPOINT
    ay_start_year = assessment_year.split("-")[0] if "-" in assessment_year else assessment_year

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            response = await client.get(
                f"{ERI_API_BASE}{endpoint}",
                headers={
                    "Authorization": token,
                    "x-api-key": api_key,
                    "x-api-version": "1.0.0",
                    "accept": "application/json"
                },
                params={"pan": pan_number, "assessment_year": ay_start_year}
            )

            if response.status_code == 200:
                data = response.json().get("data", {})
                return {
                    "exists": True,
                    "status": data.get("status", "SUBMITTED"),
                    "ack_number": data.get("ack_number"),
                    "date": data.get("filed_date")
                }
            elif response.status_code == 404:
                return {"exists": False, "status": "NOT_FOUND"}
            elif response.status_code == 401:
                if settings.DEMO_MODE:
                    return {"exists": False, "status": "DEMO_NOT_FOUND"}
                raise HTTPException(status_code=502, detail="Sandbox authentication failed during status verification")
            elif response.status_code == 403:
                if settings.DEMO_MODE:
                    return {"exists": False, "status": "DEMO_NOT_FOUND"}
                raise HTTPException(status_code=502, detail="Status verification endpoint not enabled on this Sandbox plan")
            else:
                return {"exists": False, "status": "UNKNOWN"}
        except HTTPException:
            raise
        except httpx.RequestError as e:
            logger.warning(f"Could not check upstream filing status: {e}")
            return {"exists": False, "status": "NETWORK_ERROR", "error": str(e)}


def check_and_log_unverified_endpoints() -> list[str]:
    """
    Checks configured Sandbox ERI endpoints and logs warnings for any unverified/unconfigured endpoints.
    In DEMO_MODE=False (production), calls to unconfigured endpoints will be refused with HTTP 501.
    """
    unverified = []
    checks = [
        ("SANDBOX_GENERATE_OTP_ENDPOINT", settings.SANDBOX_GENERATE_OTP_ENDPOINT),
        ("SANDBOX_PREFILL_ENDPOINT", settings.SANDBOX_PREFILL_ENDPOINT),
        ("SANDBOX_SUBMIT_ENDPOINT", settings.SANDBOX_SUBMIT_ENDPOINT),
        ("SANDBOX_EVERIFY_ENDPOINT", settings.SANDBOX_EVERIFY_ENDPOINT),
        ("SANDBOX_STATUS_ENDPOINT", settings.SANDBOX_STATUS_ENDPOINT),
    ]
    for name, val in checks:
        if not val:
            unverified.append(name)

    if unverified:
        logger.warning(
            "Sandbox ERI endpoints unverified or unconfigured: %s. "
            "In production mode (DEMO_MODE=False), calls to unconfigured endpoints will be refused with HTTP 501. "
            "See docs/SANDBOX_ENDPOINTS.md for configuration details.",
            ", ".join(unverified)
        )
    return unverified

