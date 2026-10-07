from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import json
from ..database import Base

class Filing(Base):
    __tablename__ = "filings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tax_computation_id = Column(Integer, ForeignKey("tax_computations.id"), nullable=False)
    assessment_year = Column(String, nullable=False, default="2025-26")
    status = Column(String, default="generated") # generated, downloaded, filed
    
    # Store JSON payload as text
    itr_json_data = Column(Text, nullable=False) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", backref="filings")
    tax_computation = relationship("TaxComputation", backref="filing")

    def set_itr_data(self, data: dict):
        self.itr_json_data = json.dumps(data)

    def get_itr_data(self) -> dict:
        return json.loads(self.itr_json_data) if self.itr_json_data else {}
