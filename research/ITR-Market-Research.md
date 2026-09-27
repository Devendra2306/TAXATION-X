# Indian ITR Filing Market — Research Report (2026)

## 1. Key Competitors: Pricing & Features

| Competitor | DIY Pricing | CA-Assisted Pricing | Key Differentiators |
|---|---|---|---|
| **ClearTax** | Free (basic salary) → ₹1,499 | ₹2,500 – ₹25,000 | Market leader, 1000+ broker integrations, AIS/TIS sync, Form 16 parsing |
| **Quicko** | Free (basic) → ₹1,499 | ₹2,499 – ₹5,999 | Tech-first, deep Zerodha/Groww integrations, crypto tax support |
| **TaxBuddy** | ₹499 – ₹899 | ₹899 – ₹9,999 | "Service Now, Pay Later", strong CA-assisted, notice management |
| **Tax2Win** | Free → ₹599 | ₹509 – ₹4,500 | Hybrid assisted, Groww/SBI YONO partnerships |
| **myITreturn** | ₹199 – ₹999 | ₹2,200 – ₹5,000 | Earliest ERI, "Maker-Checker" workflow |

---

## 2. ITR-1 (Sahaj) JSON Schema

### Eligibility
- Resident Individual, total income up to ₹50 Lakhs
- Sources: Salary/Pension, One House Property, Other Sources, Agriculture (up to ₹5,000)
- **Ineligible:** NRIs, directors, unlisted equity, capital gains, business income, foreign assets

### JSON Structure
```
ITR
└── ITR1
    ├── CreationInfo          // Software details, version, SHA-256 digest
    ├── Form_ITR1             // Form name, AY, schema version
    ├── PersonalInfo          // PAN, Aadhaar, name, DOB, address, contact
    ├── FilingStatus          // Filing section, regime selection (115BAC)
    ├── IncomeDeductions      // All income heads + Chapter VI-A deductions
    ├── TaxComputation        // Tax, rebate, cess, interest, late fees
    ├── TaxPaid               // Advance tax, TDS, TCS, self-assessment
    ├── Refund                // Refund/payable + bank details
    └── Verification          // Digital signature declaration
```

### Key Fields
- **PAN:** Regex `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`
- **Aadhaar:** 12 digits or 28-digit Enrolment ID
- **Regime:** `OptOutNewTaxRegime: "Y"/"N"` (Section 115BAC)
- **Salary:** Section 17(1), 17(2), 17(3) breakdown
- **Deductions:** 80C/80CCC/80CCD/80D/80E/80G/80TTA/80TTB etc.
- **TDS:** Employer TAN, income charged, TDS amounts
- **Bank:** IFSC (11 chars), Account Number, `UseForRefund` flag

---

## 3. What Makes a Competitive Product

1. **Intelligent PDF Parsing** — Sub-3-second Form 16 parsing with OCR fallback
2. **Regime Comparison** — Side-by-side old vs new regime with clear savings shown
3. **AIS/TIS Reconciliation** — Flag mismatches before filing to avoid 143(1) notices
4. **Broker P&L Sync** — Direct Zerodha/Groww/Upstox integration
5. **Frictionless E-Verification** — Aadhaar OTP embedded in journey
6. **Transparent Pricing** — No hidden paywalls after data entry
7. **Notice Shield** — Post-filing audit assistance

---

## 4. User Pain Points (Opportunities)

- **Deceptive paywalls** — Free → 20 min data entry → surprise ₹999 paywall
- **AIS data mismatches** — Platforms miss bank interest / dividends → demand notices
- **Incompetent "assisted" support** — Junior tele-callers, not real CAs
- **Regime confusion** — Employer TDS regime vs actual filing regime
- **Aggressive cross-selling** — User financial data monetized for loans/insurance
- **Peak-season crashes** — July 31 deadline = platform failures

---

## 5. Regulatory Requirements

### ERI (Electronic Return Intermediary)
- **Type 1:** Manual upload through ITD portal
- **Type 2:** Direct API access (requires ₹1 Cr net worth, IS security audit)
- **Type 3:** Offline utility developers (generate compliant JSON)
- For MVP: Operate as **Type 3** — generate ITR JSON for user to upload themselves

### CA Rules (ICAI)
- Platform CANNOT be registered as CA firm
- Partner with independent CA firms/LLPs for assisted filing
- Every CA-certified report needs UDIN

### Entity & GST
- Register as Pvt Ltd or LLP under MCA
- GSTIN mandatory — SAC 998311/998231, GST @ 18%
- Required regardless of threshold for interstate SaaS

### Data Privacy (DPDP Act 2023)
- Explicit consent before collecting personal data
- Purpose limitation, data erasure rights
- Data breach notification to Data Protection Board mandatory
- Aadhaar: Must use Aadhaar Data Vault, mask numbers per UIDAI rules

---

## 6. Form 16 PDF Structure

### Part A — TRACES Generated (Standardized)
- Employer details: Name, Address, TAN, PAN
- Employee details: Name, PAN
- Period of employment
- Quarter-wise TDS summary (Q1–Q4)
- Challan details: BSR Code, Deposit Date, Serial Number

### Part B — Employer Prepared (Format Varies!)
- **Gross Salary (Sec 17):** 17(1) salary, 17(2) perquisites, 17(3) profits in lieu
- **Section 10 Exemptions:** HRA, LTA, gratuity, leave encashment
- **Section 16 Deductions:** Standard deduction (₹50k/₹75k), professional tax
- **Income from Salary:** Gross − exemptions − deductions
- **Other Income:** House property loss, savings interest (declared to employer)
- **Chapter VI-A:** 80C (₹1.5L cap), 80CCC, 80CCD, 80D, 80E, 80G, 80TTA/TTB
- **Tax Computation:** Total income, tax, rebate 87A, cess 4%, relief 89, net payable/refundable

### Key Parsing Challenge
Part B format varies significantly across employers. Large companies (TCS, Infosys) use standardized formats, but SMEs have custom layouts from various payroll software. This is where rule-based parsing + OCR/AI fallback is critical.
