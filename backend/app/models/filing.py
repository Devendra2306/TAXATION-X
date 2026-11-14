import enum
import json
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class FilingStatus(str, enum.Enum):
    DRAFT = "draft"
    PAID = "paid"
    SUBMITTING = "submitting"
    SUBMITTED = "submitted"
    EVERIFY_PENDING = "everify_pending"
    VERIFIED = "verified"
    FAILED = "failed"


class Filing(Base):
    __tablename__ = "filings"
    __table_args__ = (
        UniqueConstraint("user_id", "assessment_year", name="uq_filing_user_ay"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tax_computation_id = Column(Integer, ForeignKey("tax_computations.id"), nullable=True)
    assessment_year = Column(String, nullable=False, default="2025-26")
    status = Column(String, default=FilingStatus.DRAFT.value, nullable=False)
    ack_number = Column(String, nullable=True, index=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    failure_reason = Column(Text, nullable=True)
    
    # Store JSON payload as text
    itr_json_data = Column(Text, nullable=True) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", backref="filings")
    tax_computation = relationship("TaxComputation", backref="filing")

    def set_itr_data(self, data: dict):
        self.itr_json_data = json.dumps(data)

    def get_itr_data(self) -> dict:
        return json.loads(self.itr_json_data) if self.itr_json_data else {}
