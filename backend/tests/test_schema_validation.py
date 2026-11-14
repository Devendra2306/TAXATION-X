import os
import json
import copy
import hashlib
import tempfile
import pytest
from unittest.mock import patch
from fastapi import HTTPException

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


@pytest.fixture
def temp_schema_env():
    """
    Creates a temporary directory with test schemas and a valid SOURCES.json manifest.
    Patches ITD_SCHEMAS_DIR and SOURCES_MANIFEST_PATH during the test.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        # Load the demo schema definition as our temporary test schema
        demo_schema_path = os.path.join(eri_service.ITD_SCHEMAS_DIR, "ITR1.demo-only.schema.json")
        with open(demo_schema_path, "r", encoding="utf-8") as f:
            test_schema_content = f.read()

        schema_files = ["ITR1_AY2026-27.schema.json", "ITR1_AY2025-26.schema.json"]
        schemas_meta = {}

        for filename in schema_files:
            target_path = os.path.join(tmpdir, filename)
            with open(target_path, "w", encoding="utf-8") as f:
                f.write(test_schema_content)
            sha256 = eri_service.get_file_sha256(target_path)
            ay = "2026-27" if "2026-27" in filename else "2025-26"
            schemas_meta[filename] = {
                "assessment_year": ay,
                "form": "ITR-1",
                "source_url": "https://www.incometax.gov.in/test",
                "downloaded_at": "2026-11-15T00:00:00Z",
                "sha256": sha256
            }

        manifest_data = {
            "description": "Test manifest",
            "schemas": schemas_meta
        }
        manifest_path = os.path.join(tmpdir, "SOURCES.json")
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest_data, f, indent=2)

        with patch.object(eri_service, "ITD_SCHEMAS_DIR", tmpdir), \
             patch.object(eri_service, "SOURCES_MANIFEST_PATH", manifest_path):
            yield tmpdir, manifest_path, os.path.join(tmpdir, "ITR1_AY2026-27.schema.json"), schemas_meta["ITR1_AY2026-27.schema.json"]["sha256"]


# ==============================================================================
# Manifest & Checksum Security Tests
# ==============================================================================

def test_production_refuses_unmanifested_schema_file():
    """In production, validate_itr1_schema refuses validation when schema is not in SOURCES.json."""
    orig_demo = settings.DEMO_MODE
    try:
        settings.DEMO_MODE = False
        with pytest.raises(HTTPException) as exc:
            eri_service.validate_itr1_schema(VALID_PAYLOAD, expected_ay="2026-27")
        assert exc.value.status_code == 503
        assert "Official ITD schema for AY 2026-27 has not been installed" in exc.value.detail
        assert "SOURCES.json" in exc.value.detail
    finally:
        settings.DEMO_MODE = orig_demo


def test_production_refuses_checksum_mismatch(temp_schema_env):
    """In production, validate_itr1_schema rejects a schema whose SHA-256 doesn't match SOURCES.json."""
    tmpdir, manifest_path, target_schema_path, correct_sha = temp_schema_env
    # Tamper with the manifest hash
    with open(manifest_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    data["schemas"]["ITR1_AY2026-27.schema.json"]["sha256"] = "0" * 64
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(data, f)

    orig_demo = settings.DEMO_MODE
    try:
        settings.DEMO_MODE = False
        with pytest.raises(HTTPException) as exc:
            eri_service.validate_itr1_schema(VALID_PAYLOAD, expected_ay="2026-27")
        assert exc.value.status_code == 503
        assert "Schema checksum mismatch" in exc.value.detail
    finally:
        settings.DEMO_MODE = orig_demo


def test_production_refuses_demo_only_schema():
    """In production mode, ITR1.demo-only.schema.json is unconditionally refused."""
    orig_demo = settings.DEMO_MODE
    try:
        settings.DEMO_MODE = False
        with pytest.raises(HTTPException) as exc:
            eri_service.validate_itr1_schema(VALID_PAYLOAD, expected_ay="2026-27")
        assert exc.value.status_code == 503
        assert "Official ITD schema for AY 2026-27 has not been installed" in exc.value.detail
    finally:
        settings.DEMO_MODE = orig_demo


def test_demo_mode_allows_demo_only_schema_with_warning(caplog):
    """In demo mode, ITR1.demo-only.schema.json is permitted and emits a loud warning."""
    orig_demo = settings.DEMO_MODE
    try:
        settings.DEMO_MODE = True
        import logging
        with caplog.at_level(logging.WARNING):
            errors = eri_service.validate_itr1_schema(VALID_PAYLOAD, expected_ay="2026-27")
            assert errors == []
            assert any("DEMO MODE WARNING" in record.message for record in caplog.records)
    finally:
        settings.DEMO_MODE = orig_demo


# ==============================================================================
# Functional Schema Validation Tests (using verified test manifest)
# ==============================================================================

def test_valid_payload_passes_schema_validation(temp_schema_env):
    """A valid ITR payload passes schema validation in production when properly manifested."""
    orig_demo = settings.DEMO_MODE
    try:
        settings.DEMO_MODE = False
        errors = eri_service.validate_itr1_schema(VALID_PAYLOAD, expected_ay="2026-27")
        assert errors == []
    finally:
        settings.DEMO_MODE = orig_demo


def test_missing_required_field_fails_schema_validation(temp_schema_env):
    """Missing required property triggers schema error."""
    orig_demo = settings.DEMO_MODE
    try:
        settings.DEMO_MODE = False
        payload = copy.deepcopy(VALID_PAYLOAD)
        del payload["ITR"]["ITR1"]["PersonalInfo"]["PAN"]

        errors = eri_service.validate_itr1_schema(payload, expected_ay="2026-27")
        assert len(errors) > 0
        assert any("PAN" in e and "required property" in e for e in errors)
    finally:
        settings.DEMO_MODE = orig_demo


def test_wrong_data_type_fails_schema_validation(temp_schema_env):
    """Incorrect data type triggers schema error."""
    orig_demo = settings.DEMO_MODE
    try:
        settings.DEMO_MODE = False
        payload = copy.deepcopy(VALID_PAYLOAD)
        payload["ITR"]["ITR1"]["ITR1_IncomeDeductions"]["GrossSalary"] = "EIGHT_LAKH_FIFTY_THOUSAND"

        errors = eri_service.validate_itr1_schema(payload, expected_ay="2026-27")
        assert len(errors) > 0
        assert any("GrossSalary" in e and "not of type 'number'" in e for e in errors)
    finally:
        settings.DEMO_MODE = orig_demo


# ==============================================================================
# Layer 2 Statutory Business-Logic Tests
# ==============================================================================

def test_business_logic_layer_catches_ay_mismatch(temp_schema_env):
    """Business logic catches mismatch between Form_ITR1.AssessmentYear and requested AY."""
    payload = copy.deepcopy(VALID_PAYLOAD)
    # Form_ITR1 has 2026, but request asks for 2025-26 (expected start: 2025)
    errors = eri_service.validate_itr1_schema(payload, expected_ay="2025-26")
    assert any("AssessmentYear mismatch" in e for e in errors)


def test_business_logic_layer_catches_income_exceeding_50_lakhs(temp_schema_env):
    """ITR-1 statutory limit of ₹50 Lakhs is enforced."""
    payload = copy.deepcopy(VALID_PAYLOAD)
    payload["ITR"]["ITR1"]["ITR1_IncomeDeductions"]["TotalIncome"] = 6500000.0

    errors = eri_service.validate_itr1_schema(payload, expected_ay="2026-27")
    assert any("exceeds the statutory ₹50,00,000 threshold" in e for e in errors)


def test_business_logic_layer_catches_tax_reconciliation_error(temp_schema_env):
    """Mathematical reconciliation between TotalTaxPayable, TDSClaimed, and TaxPayable."""
    payload = copy.deepcopy(VALID_PAYLOAD)
    payload["ITR"]["ITR1"]["ITR1_TaxComputation"]["TotalTaxPayable"] = 50000.0
    payload["ITR"]["ITR1"]["ITR1_TaxComputation"]["TDSClaimed"] = 30000.0
    payload["ITR"]["ITR1"]["ITR1_TaxComputation"]["TaxPayable"] = 5000.0

    errors = eri_service.validate_itr1_schema(payload, expected_ay="2026-27")
    assert any("TaxPayable" in e and "does not reconcile" in e for e in errors)
