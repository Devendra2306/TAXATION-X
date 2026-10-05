import os
import httpx
from fastapi import HTTPException

# Future-ready service for ERI (e-Return Intermediary) API Integration
# e.g., ClearTax Sandbox, Quicko Sandbox, or direct ITD ERI API

ERI_API_BASE = os.getenv("ERI_API_BASE", "https://sandbox.eri-provider.com/api/v1")
ERI_API_KEY = os.getenv("ERI_API_KEY", "")

async def request_aadhaar_otp(pan_number: str) -> bool:
    """
    Step 1: Request OTP from ITD to authenticate the user and fetch prefill data.
    """
    if not ERI_API_KEY:
        # Mock behavior for current dev environment
        return True
        
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{ERI_API_BASE}/auth/generate-otp",
            headers={"Authorization": f"Bearer {ERI_API_KEY}"},
            json={"pan": pan_number}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to generate OTP from ITD")
        return True

async def fetch_prefill_data(pan_number: str, otp: str) -> dict:
    """
    Step 2: Verify OTP and fetch Form 26AS, AIS, and Prefill JSON.
    """
    if not ERI_API_KEY:
        # Return mock prefill data for now
        return {
            "pan": pan_number,
            "name": "MOCK USER",
            "address": {"city": "Mumbai", "state": "MH"},
            "salary_income": 1250000.0,
            "tds_deducted": 150000.0,
            "bank_accounts": [{"account_no": "XXXX1234", "ifsc": "SBIN0001234"}]
        }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{ERI_API_BASE}/itr/prefill",
            headers={"Authorization": f"Bearer {ERI_API_KEY}"},
            json={"pan": pan_number, "otp": otp}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid OTP or ITD portal down")
        return response.json()

async def submit_itr(pan: str, tax_data: dict) -> dict:
    """
    Step 3: Direct Filing. Construct the ITD JSON payload and submit the return.
    """
    if not ERI_API_KEY:
        return {
            "status": "SUCCESS",
            "acknowledgement_number": "MOCK_ACK_998877",
            "message": "ITR filed successfully (MOCK)"
        }
        
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{ERI_API_BASE}/itr/file",
            headers={"Authorization": f"Bearer {ERI_API_KEY}"},
            json={"pan": pan, "tax_data": tax_data}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to submit ITR")
        return response.json()
