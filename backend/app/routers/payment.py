from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import logging

from ..database import get_db
from ..models.payment import Payment
from ..models.user import User
from ..routers.auth import get_optional_current_user
from ..services.payu_service import PayUService
from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payment", tags=["payment"])

class InitiatePaymentRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount in INR")
    productinfo: str = Field(..., min_length=1, max_length=255)
    firstname: Optional[str] = "Taxpayer"
    email: Optional[str] = "taxpayer@ofstax.in"
    phone: Optional[str] = "9999999999"
    udf1: Optional[str] = None
    surl: Optional[str] = None
    furl: Optional[str] = None

class SimulatePaymentRequest(BaseModel):
    txnid: str
    status: str = "success"

@router.post("/initiate")
def initiate_payment(
    payload: InitiatePaymentRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a pending payment transaction in the DB and returns
    the PayU form fields and action URL needed to submit to PayU.
    """
    user_id = current_user.id if current_user else None
    firstname = current_user.full_name if (current_user and current_user.full_name) else payload.firstname
    email = current_user.email if (current_user and current_user.email) else payload.email

    txnid = PayUService.generate_txnid(prefix="OFS")

    # Create record in DB
    payment_record = Payment(
        user_id=user_id,
        txnid=txnid,
        amount=payload.amount,
        productinfo=payload.productinfo,
        status="pending"
    )
    db.add(payment_record)
    db.commit()
    db.refresh(payment_record)

    # Generate PayU parameters
    payu_data = PayUService.prepare_payment_data(
        txnid=txnid,
        amount=payload.amount,
        productinfo=payload.productinfo,
        firstname=firstname,
        email=email,
        phone=payload.phone or "9999999999",
        surl=payload.surl,
        furl=payload.furl,
        user_id=user_id
    )

    return {
        "success": True,
        "txnid": txnid,
        "action_url": payu_data["action_url"],
        "params": payu_data["params"]
    }

@router.post("/callback/success")
async def payu_success_callback(request: Request, db: Session = Depends(get_db)):
    """
    Handles POST callback from PayU after successful transaction.
    Verifies hash and redirects user to /export?payment=success.
    """
    form_data = await request.form()
    payload = dict(form_data)
    logger.info(f"PayU success callback received: {payload}")

    txnid = payload.get("txnid")
    if not txnid:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/select-plan?payment=error&reason=no_txnid",
            status_code=status.HTTP_303_SEE_OTHER
        )

    payment_record = db.query(Payment).filter(Payment.txnid == txnid).first()
    if payment_record:
        # Verify response hash for security
        is_valid = PayUService.verify_response_hash(payload)
        payment_record.status = "success" if is_valid else "hash_mismatch"
        payment_record.payu_mihpayid = payload.get("mihpayid")
        payment_record.payu_mode = payload.get("mode")
        payment_record.payu_bank_ref_num = payload.get("bank_ref_num")
        db.commit()

    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/export?payment=success&txnid={txnid}",
        status_code=status.HTTP_303_SEE_OTHER
    )

@router.post("/callback/failure")
async def payu_failure_callback(request: Request, db: Session = Depends(get_db)):
    """
    Handles POST callback from PayU after failed transaction.
    Redirects user back to /select-plan?payment=failed.
    """
    form_data = await request.form()
    payload = dict(form_data)
    logger.warning(f"PayU failure callback received: {payload}")

    txnid = payload.get("txnid")
    if txnid:
        payment_record = db.query(Payment).filter(Payment.txnid == txnid).first()
        if payment_record:
            payment_record.status = "failed"
            payment_record.payu_mihpayid = payload.get("mihpayid")
            payment_record.payu_mode = payload.get("mode")
            payment_record.payu_error_message = payload.get("error_Message") or payload.get("errorMessage")
            db.commit()

    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/select-plan?payment=failed&txnid={txnid or ''}",
        status_code=status.HTTP_303_SEE_OTHER
    )

@router.post("/simulate-success")
def simulate_payment_success(
    payload: SimulatePaymentRequest,
    db: Session = Depends(get_db)
):
    """
    Test utility: allows one-click instant testing in development/staging
    without going through PayU test interface if needed.
    """
    payment_record = db.query(Payment).filter(Payment.txnid == payload.txnid).first()
    if not payment_record:
        raise HTTPException(status_code=404, detail="Transaction not found")

    payment_record.status = payload.status
    payment_record.payu_mihpayid = "SIMULATED_TEST_MIHPAYID"
    payment_record.payu_mode = "TEST_CC"
    payment_record.payu_bank_ref_num = "SIMULATED_REF_123"
    db.commit()

    return {"status": "success", "txnid": payload.txnid, "message": "Transaction marked as success"}

@router.get("/status/{txnid}")
def get_payment_status(txnid: str, db: Session = Depends(get_db)):
    payment_record = db.query(Payment).filter(Payment.txnid == txnid).first()
    if not payment_record:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return {
        "txnid": payment_record.txnid,
        "amount": payment_record.amount,
        "productinfo": payment_record.productinfo,
        "status": payment_record.status,
        "created_at": payment_record.created_at,
        "payu_mihpayid": payment_record.payu_mihpayid
    }
