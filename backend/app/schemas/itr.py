from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class OTPRequest(BaseModel):
    pan_number: str = Field(..., description="PAN number of the taxpayer")
    name: Optional[str] = Field(None, description="Name as per PAN card (required for PAN verification)")
    dob: Optional[str] = Field(None, description="Date of birth in DD/MM/YYYY format")
    otp: Optional[str] = Field(None, description="OTP if applicable")
    
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
    gross_salary: float = 0
    deductions_80c: float = 0
    tds_deducted: float = 0
    employer_name: str = ""
    simulated: bool = False
    raw_sandbox_data: Optional[Dict[str, Any]] = None
