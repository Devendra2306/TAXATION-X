from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    txnid = Column(String(100), unique=True, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    productinfo = Column(String(255), nullable=False)
    status = Column(String(50), default="pending", index=True) # pending, success, failed
    
    # PayU response details
    payu_mihpayid = Column(String(100), nullable=True)
    payu_mode = Column(String(50), nullable=True)
    payu_bank_ref_num = Column(String(100), nullable=True)
    payu_error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
