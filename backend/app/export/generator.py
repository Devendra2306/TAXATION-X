import json
import hashlib
from datetime import datetime

def generate_itr1_json(user_data: dict, tax_computation: dict) -> dict:
    """
    Generates a mock schema-compliant ITR-1 JSON payload based on AY 2026-27 schema requirements.
    """
    creation_date = datetime.now().strftime("%Y-%m-%d")
    
    # 1. Base JSON Structure
    itr_json = {
        "ITR": {
            "ITR1": {
                "CreationInfo": {
                    "SWVersionNo": "1.0",
                    "SWCreatedBy": "OFS_TAXATION_101",
                    "JSONCreatedBy": "OFS_TAXATION",
                    "JSONCreationDate": creation_date
                },
                "Form_ITR1": {
                    "FormName": "ITR-1",
                    "Description": "For indivs being a resident having total income upto Rs.50 lakh...",
                    "AssessmentYear": "2026",
                    "SchemaVer": "1.0",
                    "FormVer": "1.0"
                },
                "PersonalInfo": {
                    "AssesseeName": {
                        "FirstName": "John",
                        "SurNameOrOrgName": "Doe"
                    },
                    "PAN": user_data.get("pan", "ABCDE1234F"),
                    "Address": {
                        "ResidenceNo": "123",
                        "CityOrTownOrDistrict": "Mumbai",
                        "StateCode": "14",
                        "CountryCode": "91",
                        "PinCode": "400001"
                    },
                    "MobileNo": user_data.get("phone", "9876543210")
                },
                "FilingStatus": {
                    "ReturnFileSec": "11",
                    "ResidentialStatus": "RES",
                    "OptOutNewTaxRegime": "N" if tax_computation["recommendation"] == "new" else "Y"
                },
                "IncomeDeductions": {
                    "GrossTotIncome": tax_computation["new_regime"]["taxable_income"] if tax_computation["recommendation"] == "new" else tax_computation["old_regime"]["taxable_income"],
                    "TotalIncome": tax_computation["new_regime"]["taxable_income"] if tax_computation["recommendation"] == "new" else tax_computation["old_regime"]["taxable_income"]
                },
                "TaxComputation": {
                    "TotalTaxPayable": tax_computation["new_regime"]["tax"] if tax_computation["recommendation"] == "new" else tax_computation["old_regime"]["tax"]
                }
            }
        }
    }
    
    # Add Digest (SHA-256 hash of the JSON string for integrity)
    json_string = json.dumps(itr_json, sort_keys=True)
    digest = hashlib.sha256(json_string.encode('utf-8')).hexdigest()
    itr_json["ITR"]["ITR1"]["CreationInfo"]["Digest"] = digest
    
    return itr_json
