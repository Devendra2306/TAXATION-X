# Official ITD (Income Tax Department) JSON Schemas

This directory houses the JSON Schema definitions published by the Income Tax Department (CBDT) for validating Income Tax Returns (ITR-1 Sahaj).

## File Resolution Order

When `validate_itr1_schema` is invoked for a given assessment year (e.g. `2026-27`), the validator checks this directory in the following order:

1. `ITR1_AY{assessment_year}.schema.json` (e.g. `ITR1_AY2026-27.schema.json`)
2. `ITR1_AY{start_year}.schema.json` (e.g. `ITR1_AY2026.schema.json`)
3. `ITR1.schema.json` (Fallback default)

If no matching schema file exists on disk:
- In **Production Mode** (`DEMO_MODE=false`): The validator fails loudly, raising a `FileNotFoundError` and returning HTTP 500.
- In **Demo Mode** (`DEMO_MODE=true`): The validator logs a warning and falls back to internal business-logic checks.

## How to Download and Update Official Schemas

1. Visit the Income Tax e-Filing Portal: [https://www.incometax.gov.in](https://www.incometax.gov.in)
2. Navigate to: **Downloads > Income Tax Returns**
3. Select the target **Assessment Year** (e.g., AY 2026-27 or AY 2025-26).
4. Download the **ITR-1 Schema.zip**.
5. Extract the `.json` schema file and place it in this directory as `ITR1_AY<YYYY-YY>.schema.json`.
6. No backend code modifications or rebuilds are needed; the validator automatically detects and applies new schema files.
