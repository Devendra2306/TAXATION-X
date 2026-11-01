import hashlib
import uuid
from typing import Dict, Any, Optional
from ..config import settings
import logging

logger = logging.getLogger(__name__)

class PayUService:
    @staticmethod
    def get_action_url() -> str:
        if settings.PAYU_ENV.lower() == "prod":
            return settings.PAYU_PROD_URL
        return settings.PAYU_TEST_URL

    @staticmethod
    def generate_txnid(prefix: str = "TXN") -> str:
        return f"{prefix}_{uuid.uuid4().hex[:12].upper()}"

    @staticmethod
    def generate_hash(
        key: str,
        txnid: str,
        amount: str,
        productinfo: str,
        firstname: str,
        email: str,
        udf1: str = "",
        udf2: str = "",
        udf3: str = "",
        udf4: str = "",
        udf5: str = "",
        salt: str = ""
    ) -> str:
        """
        PayU hash sequence:
        sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
        """
        salt = salt or settings.PAYU_SALT
        key = key or settings.PAYU_KEY
        
        # 11 pipe separators after email/udf5 sequence:
        # udf1|udf2|udf3|udf4|udf5||||||salt -> notice total empty pipes for udf6-10
        hash_string = f"{key}|{txnid}|{amount}|{productinfo}|{firstname}|{email}|{udf1}|{udf2}|{udf3}|{udf4}|{udf5}||||||{salt}"
        return hashlib.sha512(hash_string.encode('utf-8')).hexdigest().lower()

    @staticmethod
    def verify_response_hash(payload: Dict[str, Any]) -> bool:
        """
        Verifies reverse hash from PayU response.
        If additionalCharges is present:
        sha512(additionalCharges|salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
        else:
        sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
        """
        salt = settings.PAYU_SALT
        status = payload.get("status", "")
        firstname = payload.get("firstname", "")
        amount = payload.get("amount", "")
        txnid = payload.get("txnid", "")
        productinfo = payload.get("productinfo", "")
        email = payload.get("email", "")
        key = payload.get("key", settings.PAYU_KEY)
        received_hash = str(payload.get("hash") or "")
        additional_charges = payload.get("additionalCharges")

        udf1 = payload.get("udf1", "")
        udf2 = payload.get("udf2", "")
        udf3 = payload.get("udf3", "")
        udf4 = payload.get("udf4", "")
        udf5 = payload.get("udf5", "")

        if additional_charges:
            hash_string = f"{additional_charges}|{salt}|{status}||||||{udf5}|{udf4}|{udf3}|{udf2}|{udf1}|{email}|{firstname}|{productinfo}|{amount}|{txnid}|{key}"
        else:
            hash_string = f"{salt}|{status}||||||{udf5}|{udf4}|{udf3}|{udf2}|{udf1}|{email}|{firstname}|{productinfo}|{amount}|{txnid}|{key}"

        calculated_hash = hashlib.sha512(hash_string.encode('utf-8')).hexdigest().lower()
        return calculated_hash == received_hash.lower()

    @classmethod
    def prepare_payment_data(
        cls,
        txnid: str,
        amount: float,
        productinfo: str,
        firstname: str,
        email: str,
        phone: str = "9999999999",
        surl: Optional[str] = None,
        furl: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        formatted_amount = f"{amount:.2f}"
        backend_url = settings.BACKEND_URL.rstrip('/')
        surl = surl or f"{backend_url}/api/payment/callback/success"
        furl = furl or f"{backend_url}/api/payment/callback/failure"
        
        udf1 = str(user_id) if user_id else ""
        
        payu_hash = cls.generate_hash(
            key=settings.PAYU_KEY,
            txnid=txnid,
            amount=formatted_amount,
            productinfo=productinfo,
            firstname=firstname,
            email=email,
            udf1=udf1,
            salt=settings.PAYU_SALT
        )

        return {
            "action_url": cls.get_action_url(),
            "params": {
                "key": settings.PAYU_KEY,
                "txnid": txnid,
                "amount": formatted_amount,
                "productinfo": productinfo,
                "firstname": firstname,
                "email": email,
                "phone": phone,
                "surl": surl,
                "furl": furl,
                "hash": payu_hash,
                "udf1": udf1,
                "service_provider": "payu_paisa"
            }
        }
