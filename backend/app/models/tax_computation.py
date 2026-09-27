from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime, timezone
from ..database import Base

class TaxComputation(Base):
    __tablename__ = "tax_computations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True) # if computed from a doc
    assessment_year = Column(String, nullable=False)
    old_regime_calculation = Column(JSONB, nullable=False)
    new_regime_calculation = Column(JSONB, nullable=False)
    recommended_regime = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
