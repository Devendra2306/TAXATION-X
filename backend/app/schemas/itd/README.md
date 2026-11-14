# Official ITD (Income Tax Department) JSON Schemas

This directory houses the JSON Schema definitions published by the Income Tax Department (CBDT) for validating Income Tax Returns (ITR-1 Sahaj).

> [!IMPORTANT]
> **STRICT REPOSITORY POLICY: The coding agent MUST NOT create, edit, or reconstruct schema files.**
> Real Income Tax Department schemas are extensive statutory specifications published by the Directorate of Income Tax (Systems). Synthetic or reconstructed schemas provide a false sense of security and will cause submissions to fail on the government portal.

---

## Production Security: `SOURCES.json` Manifest Enforcement

In **Production Mode** (`DEMO_MODE=false`), the backend strictly enforces cryptographic integrity:
1. Every schema loaded in production **MUST** be listed in `SOURCES.json`.
2. The file's SHA-256 checksum is computed dynamically at load time and verified against `SOURCES.json`.
3. If a file is unlisted, has a mismatched hash, or is missing, the backend refuses execution with **HTTP 503**.
4. The placeholder file `ITR1.demo-only.schema.json` is **unconditionally refused** in production.

In **Demo Mode** (`DEMO_MODE=true`):
- `ITR1.demo-only.schema.json` is permitted with loud warning logs to facilitate offline testing and demonstrations.

---

## How to Install an Official ITD Schema

### Step 1: Download Official Schema
1. Visit the Income Tax e-Filing Portal: [https://www.incometax.gov.in](https://www.incometax.gov.in)
2. Navigate to: **Downloads > Income Tax Returns**
3. Select the target **Assessment Year** (e.g., AY 2026-27 or AY 2025-26).
4. Download the official **ITR-1 Schema.zip** (or JSON schema).
5. Extract the `.json` schema file and place it in this directory as `ITR1_AY<YYYY-YY>.schema.json` (e.g. `ITR1_AY2026-27.schema.json`).

### Step 2: Calculate SHA-256 Checksum

**Linux / macOS:**
```bash
sha256sum ITR1_AY2026-27.schema.json
```

**Windows (PowerShell):**
```powershell
Get-FileHash .\ITR1_AY2026-27.schema.json -Algorithm SHA256
```

### Step 3: Register in `SOURCES.json`

Add an entry under the `"schemas"` object in `SOURCES.json`:

```json
{
  "description": "Manifest of official ITD schemas downloaded from incometax.gov.in. Any schema not listed here with a matching sha256 must not be loaded in production.",
  "schemas": {
    "ITR1_AY2026-27.schema.json": {
      "assessment_year": "2026-27",
      "form": "ITR-1",
      "source_url": "https://www.incometax.gov.in/iec/foportal/downloads",
      "downloaded_at": "2026-11-15T00:00:00Z",
      "sha256": "<computed_64_character_hex_hash_here>",
      "notes": "Official CBDT ITR-1 schema package for AY 2026-27"
    }
  }
}
```

No code changes or container rebuilds are required. The validator will immediately detect, verify, and apply the new schema.
