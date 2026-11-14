from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class ApiUsageLog(Base):
    __tablename__ = "api_usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    endpoint = Column(String(100), nullable=False)
    status_code = Column(Integer, nullable=False)
    simulated = Column(Boolean, default=False)
    estimated_cost_inr = Column(Float, default=0.90)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
