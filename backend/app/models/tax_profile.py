from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class TaxProfile(Base):
    __tablename__ = "tax_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    gross_salary = Column(Float, default=0.0)
    deductions_80c = Column(Float, default=0.0)
    tds_deducted = Column(Float, default=0.0)
    
    # New manual fields
    home_loan_interest = Column(Float, default=0.0)
    capital_gains = Column(Float, default=0.0)
    other_income = Column(Float, default=0.0)
    
    employer_name = Column(String, nullable=True)
    pan = Column(String, nullable=True)
    
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", backref="tax_profile")
