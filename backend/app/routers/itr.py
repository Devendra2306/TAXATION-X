from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from app.schemas.itr import OTPRequest, OTPVerify, FilingRequest, PrefillDataResponse
from app.services import eri_service
from app.routers.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/itr", tags=["ITR E-Filing"])

@router.post("/verify-pan")
async def verify_pan(request: OTPRequest, current_user: User = Depends(get_current_user)):
    """
    Verify PAN using external API
    """
    result = await eri_service.verify_pan_number(request.pan_number)
    return result

@router.post("/generate-otp")
async def generate_otp(request: OTPRequest, current_user: User = Depends(get_current_user)):
    """
    Trigger Aadhaar/ITD OTP to fetch prefill data or e-verify.
    """
    success = await eri_service.request_aadhaar_otp(request.pan_number)
    if success:
        return {"message": "OTP sent successfully to registered mobile number"}
    raise HTTPException(status_code=500, detail="Failed to send OTP")

@router.post("/prefill", response_model=PrefillDataResponse)
async def fetch_prefill(request: OTPVerify, current_user: User = Depends(get_current_user)):
    """
    Verify OTP and fetch AIS, 26AS, and Prefill Data directly from Government servers.
    """
    data = await eri_service.fetch_prefill_data(request.pan_number, request.otp)
    return data

@router.post("/submit")
async def submit_tax_return(request: FilingRequest, current_user: User = Depends(get_current_user)):
    """
    Constructs the JSON schema required by the Income Tax Department and submits it via ERI.
    """
    # In future: 
    # 1. Fetch user's tax_computation from DB
    # 2. Format into ITD schema
    # 3. Submit
    
    mock_tax_data = {"income": 1250000, "deductions": 150000}
    # Uses current_user context
    result = await eri_service.submit_itr("ABCDE1234F", mock_tax_data)
    
    return result
