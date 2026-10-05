from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class OTPRequest(BaseModel):
    pan_number: str = Field(..., description="PAN number of the taxpayer")
    
class OTPVerify(BaseModel):
    pan_number: str
    otp: str

class FilingRequest(BaseModel):
    assessment_year: str = "2025-26"
    tax_computation_id: int
    bank_account_id: Optional[str] = None
    
class ITRStatusResponse(BaseModel):
    pan_number: str
    assessment_year: str
    status: str
    acknowledgement_number: Optional[str] = None
    date_of_filing: Optional[str] = None

class PrefillDataResponse(BaseModel):
    pan: str
    name: str
    address: Dict[str, Any]
    salary_income: float
    tds_deducted: float
    bank_accounts: List[Dict[str, Any]]
