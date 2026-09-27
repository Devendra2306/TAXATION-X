from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    document_type = Column(String) # Form16, AIS, etc.
    
    # Extracted fields
    gross_salary = Column(Float, default=0.0)
    deductions_80c = Column(Float, default=0.0)
    tds_deducted = Column(Float, default=0.0)
    employer_name = Column(String, nullable=True)
    pan = Column(String, nullable=True)
    
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", backref="documents")
