import threading
from datetime import date
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.schemas.itr import OTPRequest, OTPVerify, FilingRequest, PrefillDataResponse
from app.services import eri_service
from app.routers.auth import get_current_user
from app.models.user import User
from app.database import get_db
from app.main_limiter import limiter

router = APIRouter(prefix="/api/itr", tags=["ITR E-Filing"])

# Per-user daily OTP limit tracking
_otp_lock = threading.Lock()
_user_daily_otp_count: Dict[str, int] = {}
MAX_DAILY_OTP_PER_USER = 5


def check_and_increment_user_otp(user_id: int):
    today_key = f"{user_id}:{date.today().isoformat()}"
    with _otp_lock:
        count = _user_daily_otp_count.get(today_key, 0)
        if count >= MAX_DAILY_OTP_PER_USER:
            raise HTTPException(
                status_code=429,
                detail=f"Daily OTP request limit reached ({MAX_DAILY_OTP_PER_USER} per day). Please try again tomorrow."
            )
        _user_daily_otp_count[today_key] = count + 1


def reset_user_otp_count_for_testing():
    """Helper for testing daily limit logic."""
    with _otp_lock:
        _user_daily_otp_count.clear()


@router.post("/verify-pan")
async def verify_pan(request: OTPRequest, current_user: User = Depends(get_current_user)):
    """
    Verify PAN using Sandbox KYC API.
    Requires pan_number, and optionally name + dob for full verification.
    """
    result = await eri_service.verify_pan_number(
        pan_number=request.pan_number,
        name=request.name or "Unknown",
        dob=request.dob or "01/01/1990"
    )
    return result


@router.post("/generate-otp")
@limiter.limit("3/minute")
async def generate_otp(request: Request, otp_request: OTPRequest, current_user: User = Depends(get_current_user)):
    """
    Trigger Aadhaar/ITD OTP to fetch prefill data or e-verify.
    Rate limited to 3 attempts per minute to prevent OTP flooding,
    and capped at 5 requests per user per day.
    """
    check_and_increment_user_otp(current_user.id)
    result = await eri_service.request_aadhaar_otp(otp_request.pan_number)
    return result


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
