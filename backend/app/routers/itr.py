import threading
from datetime import date, datetime, timezone
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.schemas.itr import OTPRequest, OTPVerify, FilingRequest, PrefillDataResponse, ITRStatusResponse
from app.services import eri_service
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.filing import Filing, FilingStatus
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


@router.get("/status", response_model=ITRStatusResponse)
async def get_filing_status(
    assessment_year: str = "2025-26",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the current filing status, acknowledgement number, and submission details.
    """
    from app.models.tax_profile import TaxProfile
    profile = db.query(TaxProfile).filter(TaxProfile.user_id == current_user.id).first()
    pan = profile.pan if profile else None

    filing = (
        db.query(Filing)
        .filter(Filing.user_id == current_user.id, Filing.assessment_year == assessment_year)
        .first()
    )

    if not filing:
        return ITRStatusResponse(
            pan_number=pan,
            assessment_year=assessment_year,
            status=FilingStatus.DRAFT.value,
            acknowledgement_number=None,
            date_of_filing=None,
            submitted_at=None,
            failure_reason=None
        )

    return ITRStatusResponse(
        pan_number=pan,
        assessment_year=filing.assessment_year,
        status=filing.status,
        acknowledgement_number=filing.ack_number,
        date_of_filing=filing.submitted_at.strftime("%Y-%m-%d %H:%M:%S") if filing.submitted_at else None,
        submitted_at=filing.submitted_at.isoformat() if filing.submitted_at else None,
        failure_reason=filing.failure_reason
    )


@router.post("/submit")
async def submit_tax_return(request: FilingRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Idempotent submit: Constructs official ITR schema JSON and submits via ERI.
    Refuses if in wrong state, returns existing ack if already submitted,
    and allows retry on failure.
    """
    from app.routers.profile import export_itr_json
    from app.models.tax_profile import TaxProfile
    
    profile = db.query(TaxProfile).filter(TaxProfile.user_id == current_user.id).first()
    if not profile or not profile.pan:
        raise HTTPException(status_code=400, detail="PAN is required to submit a tax return.")

    # 1. Load or create the user's filing with DB row lock if supported
    query = db.query(Filing).filter(
        Filing.user_id == current_user.id,
        Filing.assessment_year == request.assessment_year
    )
    if db.bind and db.bind.dialect.name == "postgresql":
        filing = query.with_for_update().first()
    else:
        filing = query.first()

    if not filing:
        filing = Filing(
            user_id=current_user.id,
            assessment_year=request.assessment_year,
            tax_computation_id=request.tax_computation_id,
            status=FilingStatus.DRAFT.value
        )
        db.add(filing)
        db.commit()
        db.refresh(filing)

    # 2. Idempotent check: if already submitted, everify_pending, or verified, return existing details
    if filing.status in [FilingStatus.SUBMITTED.value, FilingStatus.EVERIFY_PENDING.value, FilingStatus.VERIFIED.value]:
        return {
            "status": "SUCCESS",
            "message": f"ITR already submitted. Current status: {filing.status}",
            "ack_number": filing.ack_number,
            "filing_status": filing.status,
            "simulated": False
        }

    # 3. Refuse unless status is in allowed states (draft, paid, failed)
    allowed_states = [FilingStatus.DRAFT.value, FilingStatus.PAID.value, FilingStatus.FAILED.value]
    if filing.status not in allowed_states:
        raise HTTPException(
            status_code=400,
            detail=f"Filing cannot be submitted in '{filing.status}' status."
        )

    # 4. Generate the official ITR schema JSON payload
    itr_json_payload = export_itr_json(db=db, current_user=current_user)
    filing.set_itr_data(itr_json_payload)
    if request.tax_computation_id:
        filing.tax_computation_id = request.tax_computation_id

    # 5. Call Sandbox ERI
    try:
        result = await eri_service.submit_itr(profile.pan, itr_json_payload)
        
        ack_number = result.get("ack_number")
        if not ack_number or ack_number == "PENDING":
            raise HTTPException(status_code=502, detail="Upstream did not return a valid acknowledgement number.")

        filing.status = FilingStatus.SUBMITTED.value
        filing.ack_number = ack_number
        filing.submitted_at = datetime.now(timezone.utc)
        filing.failure_reason = None
        db.commit()
        db.refresh(filing)

        return {
            "status": "SUCCESS",
            "message": result.get("message", "ITR Submitted Successfully"),
            "ack_number": ack_number,
            "filing_status": filing.status,
            "simulated": result.get("simulated", False),
            "raw": result.get("raw")
        }
    except Exception as exc:
        filing.status = FilingStatus.FAILED.value
        detail_msg = exc.detail if isinstance(exc, HTTPException) else str(exc)
        filing.failure_reason = detail_msg
        db.commit()
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(status_code=500, detail=f"ITR submission failed: {detail_msg}")
