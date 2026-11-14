import threading
from datetime import date, datetime, timezone, timedelta
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session

from app.schemas.itr import (
    OTPRequest,
    OTPVerify,
    FilingRequest,
    PrefillDataResponse,
    ITRStatusResponse,
    EVerifyRequest,
    UsageStatsResponse
)
from app.models.api_usage import ApiUsageLog
from app.services import eri_service
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.filing import Filing, FilingStatus
from app.database import get_db
from app.main_limiter import limiter
from app.core.assessment_year import validate_assessment_year, current_assessment_year

router = APIRouter(prefix="/api/itr", tags=["ITR E-Filing"])

# Per-user daily OTP limit tracking
_otp_lock = threading.Lock()
_filing_locks_mutex = threading.Lock()
_filing_locks: Dict[str, threading.Lock] = {}

def get_filing_lock(user_id: int, assessment_year: str) -> threading.Lock:
    key = f"{user_id}:{assessment_year}"
    with _filing_locks_mutex:
        if key not in _filing_locks:
            _filing_locks[key] = threading.Lock()
        return _filing_locks[key]
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


def log_sandbox_usage(
    db: Session,
    endpoint: str,
    status_code: int,
    simulated: bool,
    user_id: Optional[int] = None,
    unit_cost: float = 0.90
) -> None:
    """
    Records an API call to track billable spend against the ₹0.90/call benchmark.
    Simulated calls carry an estimated cost of ₹0.00, while live calls carry ₹0.90.
    """
    try:
        cost = 0.0 if simulated else unit_cost
        entry = ApiUsageLog(
            user_id=user_id,
            endpoint=endpoint,
            status_code=status_code,
            simulated=simulated,
            estimated_cost_inr=cost
        )
        db.add(entry)
        db.commit()
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass


@router.post("/verify-pan")
async def verify_pan(
    request: OTPRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify PAN using Sandbox KYC API.
    Requires pan_number, and optionally name + dob for full verification.
    """
    try:
        result = await eri_service.verify_pan_number(
            pan_number=request.pan_number,
            name=request.name or "Unknown",
            dob=request.dob or "01/01/1990"
        )
        log_sandbox_usage(db, "/kyc/pan", 200, result.get("simulated", False), current_user.id)
        return result
    except HTTPException as exc:
        log_sandbox_usage(db, "/kyc/pan", exc.status_code, False, current_user.id)
        raise exc


@router.post("/generate-otp")
@limiter.limit("3/minute")
async def generate_otp(
    request: Request,
    otp_request: OTPRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Trigger Aadhaar/ITD OTP to fetch prefill data or e-verify.
    Rate limited to 3 attempts per minute to prevent OTP flooding,
    and capped at 5 requests per user per day.
    """
    check_and_increment_user_otp(current_user.id)
    try:
        result = await eri_service.request_aadhaar_otp(otp_request.pan_number)
        log_sandbox_usage(db, "/tax/itr/generate-otp", 200, result.get("simulated", False), current_user.id)
        return result
    except HTTPException as exc:
        log_sandbox_usage(db, "/tax/itr/generate-otp", exc.status_code, False, current_user.id)
        raise exc


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
    profile.capital_gains = data.get("capital_gains", 0)
    profile.other_income = (data.get("interest_income", 0) or 0) + (data.get("dividend_income", 0) or 0)
    profile.pan = data.get("pan", "")
    profile.employer_name = data.get("employer_name", "")
    
    db.commit()
    log_sandbox_usage(db, "/tax/itr/prefill", 200, data.get("simulated", False), current_user.id)
    
    return data


@router.get("/current-ay")
def get_current_ay():
    """Returns the statutory assessment year for the current date."""
    return {"assessment_year": current_assessment_year()}


@router.get("/status", response_model=ITRStatusResponse)
async def get_filing_status(
    assessment_year: str = Query(..., description="Assessment Year in YYYY-YY format, e.g. '2026-27'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the current filing status, acknowledgement number, and submission details.
    """
    try:
        assessment_year = validate_assessment_year(assessment_year)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

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

    deadline_str = None
    if filing.submitted_at:
        deadline = filing.submitted_at + timedelta(days=30)
        deadline_str = deadline.strftime("%Y-%m-%d %H:%M:%S")

    return ITRStatusResponse(
        pan_number=pan,
        assessment_year=filing.assessment_year,
        status=filing.status,
        acknowledgement_number=filing.ack_number,
        date_of_filing=filing.submitted_at.strftime("%Y-%m-%d %H:%M:%S") if filing.submitted_at else None,
        submitted_at=filing.submitted_at.isoformat() if filing.submitted_at else None,
        verification_deadline=deadline_str,
        failure_reason=filing.failure_reason
    )


@router.post("/submit")
async def submit_tax_return(request: FilingRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Idempotent submit: Constructs official ITR schema JSON and submits via ERI.
    Refuses if in wrong state, returns existing ack if already submitted,
    gates against timeouts to prevent duplicate submissions, and sets status
    to everify_pending upon successful upstream response.
    """
    import httpx
    from app.routers.profile import export_itr_json
    from app.models.tax_profile import TaxProfile
    
    profile = db.query(TaxProfile).filter(TaxProfile.user_id == current_user.id).first()
    if not profile or not profile.pan:
        raise HTTPException(status_code=400, detail="PAN is required to submit a tax return.")

    user_lock = get_filing_lock(current_user.id, request.assessment_year)
    with user_lock:
        # 1. Atomic load-or-create of filing inside user/AY mutex
        filing = (
            db.query(Filing)
            .filter(Filing.user_id == current_user.id, Filing.assessment_year == request.assessment_year)
            .first()
        )
        if not filing:
            try:
                filing = Filing(
                    user_id=current_user.id,
                    assessment_year=request.assessment_year,
                    tax_computation_id=request.tax_computation_id,
                    status=FilingStatus.DRAFT.value
                )
                db.add(filing)
                db.commit()
                db.refresh(filing)
            except Exception:
                db.rollback()
                filing = (
                    db.query(Filing)
                    .filter(Filing.user_id == current_user.id, Filing.assessment_year == request.assessment_year)
                    .first()
                )

        if db.bind and db.bind.dialect.name == "postgresql":
            filing = (
                db.query(Filing)
                .filter(Filing.id == filing.id)
                .with_for_update()
                .first()
            )

        # 2. Idempotent check: if already submitted, everify_pending, or verified, return existing details
        if filing.status in [FilingStatus.SUBMITTED.value, FilingStatus.EVERIFY_PENDING.value, FilingStatus.VERIFIED.value]:
            return {
                "status": "SUCCESS",
                "message": f"ITR already submitted. Current status: {filing.status}",
                "ack_number": filing.ack_number,
                "filing_status": filing.status,
                "simulated": False
            }

        # 3. Timeout / in-flight protection: if status is SUBMITTING, check upstream before retrying!
        if filing.status == FilingStatus.SUBMITTING.value:
            upstream = await eri_service.check_upstream_filing_status(profile.pan, request.assessment_year)
            if upstream.get("exists") and upstream.get("ack_number"):
                # Return was already received upstream!
                filing.status = FilingStatus.EVERIFY_PENDING.value
                filing.ack_number = upstream["ack_number"]
                filing.submitted_at = datetime.now(timezone.utc)
                filing.failure_reason = None
                db.commit()
                db.refresh(filing)
                return {
                    "status": "SUCCESS",
                    "message": "ITR submission was already received and acknowledged by Government portal.",
                    "ack_number": filing.ack_number,
                    "filing_status": filing.status,
                    "simulated": False
                }
            elif upstream.get("status") == "NETWORK_ERROR":
                raise HTTPException(
                    status_code=504,
                    detail="Cannot verify status with Income Tax Department due to network timeout. Retry prevented to avoid duplicate submission. Please check status shortly."
                )
            else:
                # Upstream confirmed return does not exist; safe to allow retry
                filing.status = FilingStatus.DRAFT.value
                db.commit()

        # 4. Refuse unless status is in allowed states (draft, paid, failed)
        allowed_states = [FilingStatus.DRAFT.value, FilingStatus.PAID.value, FilingStatus.FAILED.value]
        if filing.status not in allowed_states:
            raise HTTPException(
                status_code=400,
                detail=f"Filing cannot be submitted in '{filing.status}' status."
            )

        # 5. Check ITR-1 statutory eligibility before proceeding
        total_income = float(profile.gross_salary or 0) + float(profile.other_income or 0) + float(profile.capital_gains or 0)
        if (profile.capital_gains or 0) > 0:
            raise HTTPException(
                status_code=422,
                detail="ITR-1 is not applicable: Capital gains detected. Assessee must file using ITR-2."
            )
        if total_income > 5000000:
            raise HTTPException(
                status_code=422,
                detail=f"ITR-1 is not applicable: Total income (₹{total_income:,.0f}) exceeds the ₹50 Lakh threshold. Assessee must file using ITR-2."
            )

        # 6. Generate and validate the official ITR schema JSON payload with assessment_year
        itr_json_payload = export_itr_json(assessment_year=request.assessment_year, db=db, current_user=current_user)
        validation_errors = eri_service.validate_itr1_schema(itr_json_payload, expected_ay=request.assessment_year)
        if validation_errors:
            raise HTTPException(
                status_code=422,
                detail=f"ITR JSON schema validation failed: {'; '.join(validation_errors)}"
            )

        filing.set_itr_data(itr_json_payload)
        if request.tax_computation_id:
            filing.tax_computation_id = request.tax_computation_id

        # 7. Transition to SUBMITTING before invoking external Sandbox network call
        filing.status = FilingStatus.SUBMITTING.value
        filing.failure_reason = None
        db.commit()
        db.refresh(filing)

        # 8. Call Sandbox ERI
        try:
            result = await eri_service.submit_itr(profile.pan, itr_json_payload)
            
            ack_number = result.get("ack_number")
            if not ack_number or ack_number == "PENDING":
                raise HTTPException(status_code=502, detail="Upstream did not return a valid acknowledgement number.")

            # Successfully submitted: now awaiting e-verification within 30 days
            filing.status = FilingStatus.EVERIFY_PENDING.value
            filing.ack_number = ack_number
            filing.submitted_at = datetime.now(timezone.utc)
            filing.failure_reason = None
            db.commit()
            db.refresh(filing)

            log_sandbox_usage(db, "/tax/itr/submit", 200, result.get("simulated", False), current_user.id)

            return {
                "status": "SUCCESS",
                "message": result.get("message", "ITR Submitted Successfully"),
                "ack_number": ack_number,
                "filing_status": filing.status,
                "simulated": result.get("simulated", False),
                "raw": result.get("raw")
            }
        except (httpx.TimeoutException, httpx.RequestError) as timeout_exc:
            # Network timeout: Keep status as SUBMITTING to protect against duplicate submission on blind retry
            filing.status = FilingStatus.SUBMITTING.value
            filing.failure_reason = (
                "Submission timed out while awaiting acknowledgement from Government portal. "
                "Verification with upstream will be performed prior to any retry."
            )
            db.commit()
            log_sandbox_usage(db, "/tax/itr/submit", 504, False, current_user.id)
            raise HTTPException(
                status_code=504,
                detail=(
                    "Submission timed out while awaiting response from Income Tax Department. "
                    "Your filing is currently marked 'submitting'. System will verify upstream status before allowing a retry "
                    "to prevent duplicate filing."
                )
            )
        except HTTPException as exc:
            filing.status = FilingStatus.FAILED.value
            filing.failure_reason = exc.detail
            db.commit()
            log_sandbox_usage(db, "/tax/itr/submit", exc.status_code, False, current_user.id)
            raise exc
        except Exception as exc:
            filing.status = FilingStatus.FAILED.value
            detail_msg = str(exc)
            filing.failure_reason = detail_msg
            db.commit()
            log_sandbox_usage(db, "/tax/itr/submit", 500, False, current_user.id)
            raise HTTPException(status_code=500, detail=f"ITR submission failed: {detail_msg}")

@router.post("/everify")
async def everify_tax_return(
    request: EVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    E-verify an ITR return using Aadhaar OTP via Sandbox ERI.
    Transitions status from everify_pending -> verified (or failed).
    """
    from app.models.tax_profile import TaxProfile
    profile = db.query(TaxProfile).filter(TaxProfile.user_id == current_user.id).first()
    pan = request.pan_number or (profile.pan if profile else None)
    if not pan:
        raise HTTPException(status_code=400, detail="PAN is required to e-verify a return.")

    filing = (
        db.query(Filing)
        .filter(Filing.user_id == current_user.id, Filing.assessment_year == request.assessment_year)
        .first()
    )

    if not filing:
        raise HTTPException(status_code=404, detail="No filing record found for this assessment year.")

    # Idempotent check: if already verified, return success
    if filing.status == FilingStatus.VERIFIED.value:
        return {
            "status": "SUCCESS",
            "message": "ITR is already e-verified.",
            "ack_number": filing.ack_number,
            "filing_status": filing.status,
            "simulated": False
        }

    # Must be in everify_pending or submitted status
    if filing.status not in [FilingStatus.EVERIFY_PENDING.value, FilingStatus.SUBMITTED.value]:
        raise HTTPException(
            status_code=400,
            detail=f"Filing in '{filing.status}' status cannot be e-verified. Submit return first."
        )

    ack_num = request.acknowledgement_number or filing.ack_number
    if not ack_num:
        raise HTTPException(status_code=400, detail="Acknowledgement number is missing from filing record.")

    try:
        result = await eri_service.everify_itr(pan, ack_num, request.otp)
        filing.status = FilingStatus.VERIFIED.value
        filing.failure_reason = None
        db.commit()
        db.refresh(filing)

        log_sandbox_usage(db, "/tax/itr/e-verify", 200, result.get("simulated", False), current_user.id)

        return {
            "status": "SUCCESS",
            "message": result.get("message", "ITR e-verified successfully."),
            "ack_number": filing.ack_number,
            "filing_status": filing.status,
            "simulated": result.get("simulated", False),
            "raw": result.get("raw")
        }
    except Exception as exc:
        detail_msg = exc.detail if isinstance(exc, HTTPException) else str(exc)
        filing.failure_reason = f"e-Verification failed: {detail_msg}"
        db.commit()
        status_code = exc.status_code if isinstance(exc, HTTPException) else 400
        log_sandbox_usage(db, "/tax/itr/e-verify", status_code, False, current_user.id)
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(status_code=400, detail=f"e-Verification failed: {detail_msg}")


@router.get("/usage-stats", response_model=UsageStatsResponse)
async def get_usage_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns cumulative and user-level Sandbox API usage counts and estimated costs
    benchmarked against the ₹0.90/call standard rate.
    """
    logs = db.query(ApiUsageLog).all()

    total_calls = len(logs)
    live_calls = sum(1 for l in logs if not l.simulated)
    simulated_calls = sum(1 for l in logs if l.simulated)
    total_cost = sum(l.estimated_cost_inr for l in logs)

    calls_by_endpoint = {}
    for l in logs:
        calls_by_endpoint[l.endpoint] = calls_by_endpoint.get(l.endpoint, 0) + 1

    user_logs = [l for l in logs if l.user_id == current_user.id]
    user_calls = len(user_logs)
    user_cost = sum(l.estimated_cost_inr for l in user_logs)

    return UsageStatsResponse(
        total_calls=total_calls,
        live_calls=live_calls,
        simulated_calls=simulated_calls,
        total_estimated_cost_inr=round(total_cost, 2),
        unit_cost_estimate_inr=0.90,
        calls_by_endpoint=calls_by_endpoint,
        user_calls=user_calls,
        user_estimated_cost_inr=round(user_cost, 2)
    )

