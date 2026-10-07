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

from sqlalchemy.orm import Session
from app.database import get_db

@router.post("/prefill", response_model=PrefillDataResponse)
async def fetch_prefill(request: OTPVerify, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Verify OTP and fetch AIS, 26AS, and Prefill Data directly from Government servers.
    """
    data = await eri_service.fetch_prefill_data(request.pan_number, request.otp)
    
    # Save the fetched data to TaxProfile so the Review page can use it
    from app.models.tax_profile import TaxProfile
    profile = db.query(TaxProfile).filter(TaxProfile.user_id == current_user.id).first()
    if not profile:
        profile = TaxProfile(user_id=current_user.id)
        db.add(profile)
        
    profile.gross_salary = data.get("gross_salary", 0)
    profile.deductions_80c = data.get("deductions_80c", 0)
    profile.tds_deducted = data.get("tds_deducted", 0)
    profile.pan = data.get("pan", "")
    profile.employer_name = data.get("employer_name", "")
    
    db.commit()
    
    return data

@router.post("/submit")
async def submit_tax_return(request: FilingRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Constructs the JSON schema required by the Income Tax Department and submits it via ERI.
    """
    from app.routers.profile import export_itr_json
    from app.models.tax_profile import TaxProfile
    
    profile = db.query(TaxProfile).filter(TaxProfile.user_id == current_user.id).first()
    if not profile or not profile.pan:
        raise HTTPException(status_code=400, detail="PAN is required to submit a tax return.")
        
    # Generate the official ITR schema JSON payload
    itr_json_payload = export_itr_json(db=db, current_user=current_user)
    
    # Submit directly to the government via Sandbox ERI
    result = await eri_service.submit_itr(profile.pan, itr_json_payload)
    return result
