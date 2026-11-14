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
    pan_number: Optional[str] = None
    assessment_year: str = "2025-26"
    status: str
    acknowledgement_number: Optional[str] = None
    date_of_filing: Optional[str] = None
    submitted_at: Optional[str] = None
    verification_deadline: Optional[str] = None
    failure_reason: Optional[str] = None

class EVerifyRequest(BaseModel):
    otp: str = Field(..., description="6-digit Aadhaar OTP")
    pan_number: Optional[str] = None
    acknowledgement_number: Optional[str] = None
    assessment_year: str = "2025-26"

class PrefillDataResponse(BaseModel):
    pan: str
    gross_salary: float = 0
    deductions_80c: float = 0
    tds_deducted: float = 0
    interest_income: float = 0
    dividend_income: float = 0
    capital_gains: float = 0
    business_income: float = 0
    section_80d: float = 0
    employer_name: str = ""
    itr1_eligible: bool = True
    unsupported_reason: Optional[str] = None
    simulated: bool = False
    raw_sandbox_data: Optional[Dict[str, Any]] = None

class UsageStatsResponse(BaseModel):
    total_calls: int
    live_calls: int
    simulated_calls: int
    total_estimated_cost_inr: float
    unit_cost_estimate_inr: float = 0.90
    calls_by_endpoint: Dict[str, int]
    user_calls: int
    user_estimated_cost_inr: float

