import httpx
import logging
import re
from typing import Optional, Dict, Any
from fastapi import HTTPException

from app.config import settings

logger = logging.getLogger(__name__)

# Sandbox.co.in API Base URL
ERI_API_BASE = "https://api.sandbox.co.in"
ERI_API_KEY = settings.EXTERNAL_API_KEY
ERI_API_SECRET = settings.EXTERNAL_API_SECRET

# Simple in-memory token cache (token is valid for 24 hours)
_cached_token: Optional[str] = None
_cached_token_expiry: float = 0.0


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
            response = await client.post(
                f"{ERI_API_BASE}/authenticate",
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
            response = await client.post(
                f"{ERI_API_BASE}/kyc/pan/verify",
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
    token = await get_sandbox_token()
    api_key = settings.EXTERNAL_API_KEY

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            response = await client.post(
                f"{ERI_API_BASE}/tax/itr/generate-otp",
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
    token = await get_sandbox_token()
    api_key = settings.EXTERNAL_API_KEY

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.post(
                f"{ERI_API_BASE}/tax/itr/prefill",
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

                return {
                    "pan": pan_number,
                    "gross_salary": income_details.get("salary_income", 0),
                    "deductions_80c": deduction_details.get("section_80c", 0),
                    "tds_deducted": taxes_paid.get("total_tds", 0),
                    "employer_name": income_details.get("employer_name", "Fetched from ITD"),
                    "simulated": False,
                    "raw_sandbox_data": data
                }
            elif response.status_code == 401:
                if settings.DEMO_MODE:
                    return {
                        "pan": pan_number,
                        "gross_salary": 1200000,
                        "deductions_80c": 150000,
                        "tds_deducted": 85000,
                        "employer_name": "Demo Employer Pvt. Ltd.",
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
                            "gross_salary": 1200000,
                            "deductions_80c": 150000,
                            "tds_deducted": 85000,
                            "employer_name": "Demo Employer Pvt. Ltd.",
                            "simulated": True,
                            "raw_sandbox_data": {"simulated": True, "reason": "credits_exhausted"}
                        }
                    raise HTTPException(status_code=503, detail="Sandbox credits exhausted")
                if settings.DEMO_MODE:
                    return {
                        "pan": pan_number,
                        "gross_salary": 1200000,
                        "deductions_80c": 150000,
                        "tds_deducted": 85000,
                        "employer_name": "Demo Employer Pvt. Ltd.",
                        "simulated": True,
                        "raw_sandbox_data": {"simulated": True, "note": "API plan not subscribed"}
                    }
                raise HTTPException(status_code=502, detail="Endpoint not enabled on this Sandbox plan")
            elif response.status_code == 404:
                if settings.DEMO_MODE:
                    logger.warning(f"ITR Prefill API not available ({response.status_code}). Returning demo data because DEMO_MODE=True.")
                    return {
                        "pan": pan_number,
                        "gross_salary": 1200000,
                        "deductions_80c": 150000,
                        "tds_deducted": 85000,
                        "employer_name": "Demo Employer Pvt. Ltd.",
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
    token = await get_sandbox_token()
    api_key = settings.EXTERNAL_API_KEY

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            response = await client.post(
                f"{ERI_API_BASE}/tax/itr/submit",
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
