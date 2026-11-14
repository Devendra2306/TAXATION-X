import pytest
from unittest.mock import patch
from app.config import settings
from app.services import eri_service

VALID_PAYLOAD = {
    "ITR": {
        "ITR1": {
            "CreationInfo": {
                "SWVersionNo": "1.0",
                "SWCreatedBy": "NexTax",
                "XMLCreationDate": "2026-05-01"
            },
            "Form_ITR1": {
                "FormName": "ITR-1",
                "AssessmentYear": "2026"
            },
            "PersonalInfo": {
                "PAN": "ABCDE1234F",
                "AssesseeName": {"FirstName": "Devendra", "SurName": "Diwakar"},
                "OptingNewTaxRegime": "Y"
            },
            "ITR1_IncomeDeductions": {
                "GrossSalary": 850000.0,
                "TotalIncome": 800000.0
            },
            "ITR1_TaxComputation": {
                "TotalTaxPayable": 30000.0,
                "TDSClaimed": 30000.0,
                "TaxPayable": 0.0,
                "RefundDue": 0.0
            }
        }
    }
}


def test_valid_payload_passes_schema_validation():
    errors = eri_service.validate_itr1_schema(VALID_PAYLOAD, expected_ay="2026-27")
    assert errors == []


def test_missing_required_field_fails_schema_validation():
    import copy
    payload = copy.deepcopy(VALID_PAYLOAD)
    # Remove PAN from PersonalInfo
    del payload["ITR"]["ITR1"]["PersonalInfo"]["PAN"]

    errors = eri_service.validate_itr1_schema(payload, expected_ay="2026-27")
    assert len(errors) > 0
    assert any("PAN" in e and "required property" in e for e in errors)


def test_wrong_data_type_fails_schema_validation():
    import copy
    payload = copy.deepcopy(VALID_PAYLOAD)
    # Pass string for GrossSalary instead of number
    payload["ITR"]["ITR1"]["ITR1_IncomeDeductions"]["GrossSalary"] = "EIGHT_LAKH_FIFTY_THOUSAND"

    errors = eri_service.validate_itr1_schema(payload, expected_ay="2026-27")
    assert len(errors) > 0
    assert any("GrossSalary" in e and "not of type 'number'" in e for e in errors)


def test_missing_schema_file_in_production_raises_filenotfound():
    orig_demo = settings.DEMO_MODE
    try:
        settings.DEMO_MODE = False
        with patch("app.services.eri_service.get_itd_schema_path", return_value=None):
            with pytest.raises(FileNotFoundError) as exc:
                eri_service.validate_itr1_schema(VALID_PAYLOAD, expected_ay="2099-00")
            assert "Official ITD JSON schema file missing" in str(exc.value)
    finally:
        settings.DEMO_MODE = orig_demo


def test_missing_schema_file_in_demo_mode_falls_back_gracefully():
    orig_demo = settings.DEMO_MODE
    try:
        settings.DEMO_MODE = True
        with patch("app.services.eri_service.get_itd_schema_path", return_value=None):
            # Valid payload should pass fallback checks without exception
            errors = eri_service.validate_itr1_schema(VALID_PAYLOAD, expected_ay="2026-27")
            assert errors == []

            # Invalid payload should be caught by fallback checks
            import copy
            bad_payload = copy.deepcopy(VALID_PAYLOAD)
            del bad_payload["ITR"]["ITR1"]["PersonalInfo"]["PAN"]
            fallback_errors = eri_service.validate_itr1_schema(bad_payload, expected_ay="2026-27")
            assert any("PAN" in e for e in fallback_errors)
    finally:
        settings.DEMO_MODE = orig_demo


def test_business_logic_layer_catches_ay_mismatch():
    import copy
    payload = copy.deepcopy(VALID_PAYLOAD)
    # AssessmentYear in JSON is 2026, but request asks for 2025-26 (expected start: 2025)
    errors = eri_service.validate_itr1_schema(payload, expected_ay="2025-26")
    assert any("AssessmentYear mismatch" in e for e in errors)


def test_business_logic_layer_catches_income_exceeding_50_lakhs():
    import copy
    payload = copy.deepcopy(VALID_PAYLOAD)
    payload["ITR"]["ITR1"]["ITR1_IncomeDeductions"]["TotalIncome"] = 6500000.0

    errors = eri_service.validate_itr1_schema(payload, expected_ay="2026-27")
    assert any("exceeds the statutory ₹50,00,000 threshold" in e for e in errors)


def test_business_logic_layer_catches_tax_reconciliation_error():
    import copy
    payload = copy.deepcopy(VALID_PAYLOAD)
    payload["ITR"]["ITR1"]["ITR1_TaxComputation"]["TotalTaxPayable"] = 50000.0
    payload["ITR"]["ITR1"]["ITR1_TaxComputation"]["TDSClaimed"] = 30000.0
    # Expected TaxPayable = 20000, but payload claims 5000
    payload["ITR"]["ITR1"]["ITR1_TaxComputation"]["TaxPayable"] = 5000.0

    errors = eri_service.validate_itr1_schema(payload, expected_ay="2026-27")
    assert any("TaxPayable" in e and "does not reconcile" in e for e in errors)
