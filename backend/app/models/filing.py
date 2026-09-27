from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime, timezone
from ..database import Base

class Filing(Base):
    __tablename__ = "filings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tax_computation_id = Column(UUID(as_uuid=True), ForeignKey("tax_computations.id"), nullable=False)
    assessment_year = Column(String, nullable=False)
    status = Column(String, default="generated") # generated, downloaded, filed
    itr_json_data = Column(JSONB, nullable=False) # The actual JSON payload for ITR-1
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
