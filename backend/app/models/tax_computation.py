from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import json
from ..database import Base


class TaxComputation(Base):
    __tablename__ = "tax_computations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assessment_year = Column(String, nullable=False, default="2025-26")

    # Old Regime
    old_taxable_income = Column(Float, default=0.0)
    old_tax_liability = Column(Float, default=0.0)
    old_cess = Column(Float, default=0.0)
    old_total_tax = Column(Float, default=0.0)

    # New Regime
    new_taxable_income = Column(Float, default=0.0)
    new_tax_liability = Column(Float, default=0.0)
    new_cess = Column(Float, default=0.0)
    new_total_tax = Column(Float, default=0.0)

    # Result
    recommended_regime = Column(String, default="new")
    tax_savings = Column(Float, default=0.0)  # how much user saves by picking the better regime
    refund_due = Column(Float, default=0.0)   # TDS paid minus total tax

    # Store full breakdown as JSON text (SQLite compatible)
    old_regime_details = Column(Text, nullable=True)  # JSON string
    new_regime_details = Column(Text, nullable=True)  # JSON string

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="tax_computations")

    def set_old_details(self, data: dict):
        self.old_regime_details = json.dumps(data)

    def get_old_details(self) -> dict:
        return json.loads(self.old_regime_details) if self.old_regime_details else {}

    def set_new_details(self, data: dict):
        self.new_regime_details = json.dumps(data)

    def get_new_details(self) -> dict:
        return json.loads(self.new_regime_details) if self.new_regime_details else {}
