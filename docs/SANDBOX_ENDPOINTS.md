# Sandbox ERI Integration & Endpoint Verification

This document catalogs all external integration endpoints used by the NexTax / OFS Taxation platform when communicating with the Quicko Sandbox API (`api.sandbox.co.in`) or an authorized Electronic Return Intermediary (ERI).

## Endpoint Audit Summary

| Setting Name | Configured Path | Documented Path | Status | Source |
|---|---|---|---|---|
| `SANDBOX_AUTH_ENDPOINT` | `/authenticate` | `/authenticate` | **confirmed** | [Sandbox Auth Docs](https://sandbox.co.in/docs) |
| `SANDBOX_PAN_VERIFY_ENDPOINT` | `/kyc/pan/verify` | `/kyc/pan/verify` | **confirmed** | [Sandbox KYC PAN Verify Docs](https://sandbox.co.in/docs/kyc/pan/verify) |
| `SANDBOX_GENERATE_OTP_ENDPOINT` | Configurable (`""` default) | *not found* | **not found** | Not in public docs (restricted to ERI enterprise plan) |
| `SANDBOX_PREFILL_ENDPOINT` | Configurable (`""` default) | *not found* | **not found** | Not in public docs (restricted to ERI enterprise plan) |
| `SANDBOX_SUBMIT_ENDPOINT` | Configurable (`""` default) | *not found* | **not found** | Not in public docs (restricted to ERI enterprise plan) |
| `SANDBOX_EVERIFY_ENDPOINT` | Configurable (`""` default) | *not found* | **not found** | Not in public docs (restricted to ERI enterprise plan) |
| `SANDBOX_STATUS_ENDPOINT` | Configurable (`""` default) | *not found* | **not found** | Not in public docs (restricted to ERI enterprise plan) |

---

## Detailed Endpoint Breakdown

### 1. Authentication (`POST /authenticate`) - CONFIRMED
- **Purpose**: Generates an access token valid for 24 hours.
- **Request Headers**:
  - `x-api-key`: API key from Sandbox developer dashboard
  - `x-api-secret`: API secret from Sandbox developer dashboard
  - `x-api-version`: `1.0.0`
- **Response**: Returns `{"access_token": "...", "data": {"access_token": "..."}}`.
- **Token Usage**: Token must be passed in the `Authorization` header **without** the `Bearer` prefix on all subsequent calls.

### 2. KYC PAN Verification (`POST /kyc/pan/verify`) - CONFIRMED
- **Purpose**: Verifies PAN existence, validity, category, and Aadhaar seeding status against ITD records.
- **Request Headers**:
  - `Authorization`: `<access_token>` (raw, no `Bearer` prefix)
  - `x-api-key`: `<api-key>`
  - `x-api-version`: `1.0.0`
  - `Content-Type`: `application/json`
- **Request Body**:
  ```json
  {
    "@entity": "in.co.sandbox.kyc.pan_verification.request",
    "pan": "ABCDE1234F",
    "name_as_per_pan": "Devendra Diwakar",
    "date_of_birth": "01/01/1990",
    "consent": "Y",
    "reason": "Income tax filing identity verification"
  }
  ```

### 3. ITD OTP Generation (`SANDBOX_GENERATE_OTP_ENDPOINT`) - NOT FOUND IN PUBLIC DOCS
- **Status**: Not found in public developer documentation (`docs.sandbox.co.in`). Public Sandbox docs offer document OCR (Form 16/26AS) and capital gains computation, but direct government filing & Aadhaar OTP generation requires an approved ERI enterprise tier or custom agreement with Quicko/Sandbox.
- **Behavior in NexTax**:
  - `DEMO_MODE=False` (Production): If `SANDBOX_GENERATE_OTP_ENDPOINT` is unset or blank, the backend refuses execution with HTTP 501 (`"ITR filing endpoint not configured. See docs/SANDBOX_ENDPOINTS.md."`). It never hits a guessed URL.
  - `DEMO_MODE=True` (Demo): Returns a simulated OTP success response with `"simulated": True`.

### 4. ITD Prefill Retrieval (`SANDBOX_PREFILL_ENDPOINT`) - NOT FOUND IN PUBLIC DOCS
- **Status**: Not found in public developer documentation.
- **Behavior in NexTax**:
  - `DEMO_MODE=False`: Blocked with HTTP 501 if unconfigured.
  - `DEMO_MODE=True`: Returns verified simulated salary, TDS, and deductions data with `"simulated": True`.

### 5. ITR Submission (`SANDBOX_SUBMIT_ENDPOINT`) - NOT FOUND IN PUBLIC DOCS
- **Status**: Not found in public developer documentation. Direct e-filing of ITR payloads to the Income Tax Department e-filing portal (e-Filing 2.0) is restricted to registered ERIs (Electronic Return Intermediaries).
- **Behavior in NexTax**:
  - `DEMO_MODE=False`: Blocked with HTTP 501 (`"ITR filing endpoint not configured. See docs/SANDBOX_ENDPOINTS.md."`). Never sends data to an unconfirmed endpoint and never generates fake acknowledgment numbers.
  - `DEMO_MODE=True`: Returns simulated acknowledgment with `"simulated": True`.

### 6. ITR e-Verification (`SANDBOX_EVERIFY_ENDPOINT`) - NOT FOUND IN PUBLIC DOCS
- **Status**: Not found in public developer documentation.
- **Behavior in NexTax**:
  - `DEMO_MODE=False`: Blocked with HTTP 501 (`"ITR filing endpoint not configured. See docs/SANDBOX_ENDPOINTS.md."`).
  - `DEMO_MODE=True`: Returns simulated success with `"simulated": True`.

### 7. Upstream Status Check (`SANDBOX_STATUS_ENDPOINT`) - NOT FOUND IN PUBLIC DOCS
- **Status**: Not found in public developer documentation.
- **Behavior in NexTax**:
  - `DEMO_MODE=False`: Blocked with HTTP 501 if unconfigured.
  - `DEMO_MODE=True`: Returns `{"exists": False, "status": "DEMO_NOT_FOUND"}`.

---

## Operating Modes

1. **Production Mode (`DEMO_MODE=false`)**:
   - Strictly validates all configurations.
   - Any unconfigured endpoint results in an immediate, explicit HTTP 501 error explaining that the endpoint must be configured in environment variables.
   - No mock or simulated responses are ever returned.
   - Server logs a warning at startup if any of the filing endpoints remain unconfigured.

2. **Demo Mode (`DEMO_MODE=true`)**:
   - Used for development, staging, demonstrations, and offline testing.
   - Fallbacks return structured data flagged with `"simulated": true`.
   - The frontend displays persistent demo banners preventing any confusion with live ITD filings.

---

## Production Deployment Checklist & Questions for Operator

To move from sandbox/demo mode to live government e-filing, the operator must determine the filing pipeline:

1. **Option A: Sandbox / Quicko Enterprise ERI Partnership**
   - Contact Sandbox (Quicko) sales/enterprise support to obtain ERI endpoints and provisioning.
   - Configure `SANDBOX_SUBMIT_ENDPOINT`, `SANDBOX_EVERIFY_ENDPOINT`, `SANDBOX_PREFILL_ENDPOINT`, and `SANDBOX_GENERATE_OTP_ENDPOINT` in production environment variables.

2. **Option B: Direct ITD ERI Registration (incometax.gov.in)**
   - Register as an Electronic Return Intermediary (ERI) directly with the Directorate of Income Tax (Systems).
   - Requires ERCS (ERI Certification System) clearance, static IP whitelisting, digital signature certificate (DSC), and dedicated secure VPN/leased lines to ITD servers.

3. **Option C: Client-Side JSON Export & Offline ITD Upload**
   - Assessees download the ITD-compliant ITR-1 JSON generated by NexTax (`/api/profile/export-itr-json`).
   - Assessees log in directly to `eportal.incometax.gov.in` and upload the JSON under "e-File > Income Tax Return > File Income Tax Return > Offline Upload".
   - This option requires zero ongoing ERI API fees and zero intermediary regulatory burden.
