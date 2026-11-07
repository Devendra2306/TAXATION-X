# NexTax Platform — Enterprise Taxation & GST Suite
## RFQ Scope, Product Vision & Handover Specification Document

**Confidential & Proprietary Commercial Specification**  
**Entity:** OFS Taxation Private Limited / NexTax Commercial Enterprise Platform  
**Author & Engineering Lead:** Devendra (`devdiwakar27@gmail.com` / GitHub: `Devendra2306`)  
**Document Version:** 2.0.0 (Comprehensive Multi-Taxation & GST Suite Edition)  
**Date:** November 2026  

---

## 1. Executive Summary & Strategic Vision

**NexTax** (by OFS Taxation Private Limited) is expanding from an AI-first individual ITR platform into a **Full-Stack Commercial Taxation Ecosystem** competing directly with **ClearTax, Quicko, and Zoho Books**. 

The expanded ecosystem encompasses:
1. **Direct Tax Suite**: Individual (ITR-1/2), Professionals & Freelancers (ITR-4 Sugam u/s 44AD/44ADA), and Business/Corporate Returns (ITR-3, ITR-5, ITR-6 with Tax Audit u/s 44AB).
2. **Indirect Tax Suite (GST Ecosystem)**: GSTR-1, GSTR-3B, GSTR-9/9C reconciliation, automated 2B vs Purchase Register ITC matching, E-Invoicing, and E-Way Bill generation via NIC / GSTN APIs.
3. **TDS / TCS Compliance Hub**: Form 24Q (Salary), 26Q (Vendor/Contractor), 27Q (Non-Resident), automated Form 16/16A generation, and Challan 281 reconciliations.
4. **Advance Tax & Penalty Mitigation Engine**: Real-time quarterly Advance Tax calculator (Sections 208, 234B, 234C).
5. **NRI & International Taxation**: Foreign Assets reporting (Schedule FA, FSI) and DTAA relief under Sections 90/91.
6. **Crypto & Virtual Digital Assets (VDA)**: Automated trade ingestion and flat 30% taxation u/s 115BBH + 1% TDS u/s 194S reconciliation.

This document serves as the **official blueprint for issuing the Request for Quotation (RFQ)** to development vendors, enterprise partners, and procurement stakeholders, while detailing the exact intellectual property and technical assets currently being handed over.

---

## 2. Expanded Multi-Tax Platform Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 NEXTAX UNIFIED TAXATION CLIENT                                   │
│            Next.js 16 (App Router) • TypeScript • Tailwind CSS • Enterprise Component Suite       │
└─────────────────────────────────┬──────────────────────────────────┬─────────────────────────────┘
                                  │                                  │
         ┌────────────────────────┴────────┐        ┌────────────────┴─────────────────┐
         │     INDIVIDUAL & SME PORTAL     │        │     ENTERPRISE GST & TDS PORTAL  │
         │  • Salaried ITR-1/2             │        │  • Multi-GSTIN Filing (1, 3B, 9) │
         │  • Presumptive 44AD/ADA (ITR-4) │        │  • GSTR-2B Automated ITC Match   │
         │  • Capital Gains & Crypto       │        │  • E-Invoicing & E-Way Bills     │
         │  • NRI Taxation & Schedule FA   │        │  • Form 24Q/26Q TDS Return Hub   │
         └────────────────┬────────────────┘        └────────────────┬─────────────────┘
                          │                                          │
┌─────────────────────────▼──────────────────────────────────────────▼─────────────────────────────┐
│                                FASTAPI DISTRIBUTED BACKEND SERVICES                              │
│   Auth & RBAC (PyJWT) • Security Headers • SlowAPI Rate Limiting • Celery/Redis Async Tasks      │
└──────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┘
       │              │              │              │              │              │
┌──────▼──────┐┌──────▼──────┐┌──────▼──────┐┌──────▼─────┐┌──────▼──────┐┌──────▼──────┐
│  DATABASE   ││ AI ENGINE   ││ DIRECT TAX  ││ GSTN / NIC ││  PAYMENT    ││ TDS / TRACES │
│ PostgreSQL /││ Google      ││ ERI GATEWAY ││ GST SUITE  ││ PayU India  ││ COMPLIANCE  │
│ SQLAlchemy  ││ Gemini      ││ Sandbox.co  ││ GSP / ASP  ││ Gateway     ││ Sandbox/Gov │
│ Neon Cloud  ││ Form 16/P&L ││ (ITD ITR-1-6││ Integration││ (SHA-512)   ││ 24Q/26Q/16A │
└─────────────┘└─────────────┘└─────────────┘└─────────────┘└─────────────┘└─────────────┘
```

---

## 3. Phase 1: What Has Been Built & Covered (Delivered Scope)

The following core direct tax infrastructure is **100% completed, tested, audited, and running in production**:

### A. Frontend Architecture & Filing Experience (Next.js 16)
1. **Full-Width ClearTax-Style Layout (`layout.tsx`):**
   * Top navigation bar with logo, mobile off-canvas drawer, AI Tax Studio shortcut, and profile avatar.
   * Dynamic **`Filing for: [User Name] ^`** taxpayer profile switcher with multi-return family filing.
   * 11-point ClearTax profile dropdown (My Returns, Profile, Orders, Rewards, Rectification, Prefill JSON, ITR Status, CA Help, Logout).
2. **Dashboard (`/dashboard`):**
   * Dual-state hero: displays 3-step timeline for new returns, or verified filing certificate with ITR-V Ack badge for filed returns.
   * Official trust badges (ISO 27001, 256-Bit SSL, Govt. Authorized ERI Intermediary).
   * Fast action cards for "My Tax Returns", "My Profile", and "Start for Free / Plan Selection".
3. **5-Stage Government PAN Verification & Prefill (`/verify-pan`):**
   * PAN & DOB validation &rarr; Phone/Email segmented OTP &rarr; Name verification checkmark &rarr; ITD Aadhaar OTP &rarr; 5-second animated loading screen syncing Form 26AS, AIS, and TIS.
4. **Interactive Tax Summary & Optimization (`/review`):**
   * Section-by-section breakdown: Gross Salary, Standard Deduction, Section 80C/80D Deductions, TDS Deducted, and Net Tax.
   * Live Regime Comparator (Old vs. New Tax Regime with instant savings calculation).
   * Slide-over Drawers: **Expert CA Filing Assistance** (₹4,718) and **Live 30-Min Guidance Call** (₹236) connected to PayU.
   * Direct forward routing to `/select-plan`.
5. **Plan Selection & Commercial Paywall (`/select-plan`):**
   * Billing breakdown (₹1,057 Base Plan - ₹636 Auto Coupon `CTPOFFER13` + ₹499 optional Tax Planning Addon = ₹497 / ₹1,086 incl. GST).
   * Notice Protect guarantee badge (free notice management).
   * Form dispatch to PayU India gateway with error fallback banners.
6. **Filing Execution & Acknowledgement (`/export`):**
   * Direct **1-Click E-Filing** to ITD via certified Sandbox ERI API.
   * Download official validated **ITR-1 (Sahaj) JSON** for offline portal upload.
   * Printable official **ITR-V Acknowledgement Receipt** with live Ack number, timestamp, and verification status.
   * Quick action buttons for Refund Tracking and filing additional family returns.
7. **Auxiliary Filing Tools:**
   * **`/compare`**: Side-by-side Old vs New regime breakdown with interactive tax slab details.
   * **`/optimizer`**: Section 80C, 80D, 80CCD(1B) utilization gauges and tax saving recommendations.
   * **`/refund`**: 5-step CPC Bengaluru refund tracking timeline with estimated refund calculation.
   * **`/chat`**: 24/7 AI Tax Expert chatbot powered by Gemini for section-wise tax advice.

### B. Backend Services & Integration (FastAPI)
1. **Authentication & Profile Endpoints** (`/api/auth`, `/api/profile`): JWT authentication, bcrypt hashing, profile management.
2. **AI Form 16 Parser** (`/api/upload/form16`): Gemini multimodal text & table extraction pulling Gross Salary, 80C, 80D, HRA, and TDS.
3. **Government KYC & ERI Gateway** (`/api/itr`): PAN validation, Aadhaar OTP generation, 26AS/AIS prefill ingestion, and 1-Click return submission.
4. **PayU Payment Gateway Integration** (`/api/payment`): Transaction generation, SHA-512 request hashing, webhook success/failure callbacks, reverse response verification, and dev simulation.

---

## 4. Phase 2: What Will Be Covered (RFQ Scope for Vendor Bidding)

Vendors responding to the RFQ must provide quotations, technical architectures, and delivery timelines for the following expanded modules:

### Module 1: Comprehensive GST Ecosystem (Direct Competitor to ClearTax GST)
* **GSTR-1 (Outward Supplies):**
  * Bulk B2B, B2C Large, B2C Small, Export, and Nil-rated invoice ingestion via Excel/CSV.
  * HSN/SAC summary generator with rate-wise tax calculation (0%, 5%, 12%, 18%, 28%).
  * 1-Click GSTR-1 direct upload & filing via GST Suvidha Provider (GSP) APIs.
* **GSTR-2B vs. Purchase Register Automated Reconciliation (The "ITC Saver"):**
  * Automated 3-way reconciliation comparing internal ERP purchase registers with monthly GSTR-2B downloaded from GSTN.
  * Smart categorization: *Matched*, *Mismatched Tax*, *Missing in GSTR-2B (Vendor Non-Compliant)*, *Missing in Books*.
  * Automated vendor email/WhatsApp nudge: *"Your invoice #123 is missing in GSTR-1, blocking our ITC of ₹45,000"*.
* **GSTR-3B (Monthly Summary & Tax Settlement):**
  * Auto-population from GSTR-1 (Outward) and GSTR-2B (Eligible ITC).
  * Minimum cash tax payable optimizer (utilizing CGST, SGST, IGST input credit in statutory order).
  * Challan generation (PMT-06) and net tax payment flow.
* **E-Invoicing & E-Way Bill System:**
  * Direct generation of Invoice Reference Numbers (IRN) and signed QR codes via NIC E-Invoice API.
  * 1-Click E-Way Bill generation with vehicle number tracking and consolidated EWB.
* **Annual Return (GSTR-9 & GSTR-9C):**
  * Auto-consolidation of 12 months GSTR-1 and GSTR-3B data.
  * Audit reconciliation table and difference reporting.

### Module 2: Business & Professional Taxation (ITR-3, ITR-4 Sugam, ITR-5, ITR-6)
* **Presumptive Taxation (ITR-4 Sugam):**
  * Section 44AD: Small businesses declaring &ge; 6% (digital) or 8% (cash) of turnover up to ₹3 Crores.
  * Section 44ADA: Freelancers, consultants, software engineers, doctors declaring &ge; 50% gross receipts up to ₹75 Lakhs.
  * Section 44AE: Goods carriage transporters.
* **Proprietary Business Income (ITR-3):**
  * Balance Sheet & P&L builder with audit trigger check u/s 44AB.
  * Depreciation Schedule (under Income Tax Act rates vs Companies Act rates).
* **Corporate & Partnership Filing (ITR-5 & ITR-6):**
  * Partnership Firms & LLPs (Flat 30% tax + AMT computation).
  * Private Limited Companies (Section 115BAA @ 22% or regular 25% + MAT u/s 115JB).

### Module 3: TDS / TCS Compliance & TRACES Integration
* **Quarterly TDS Returns:**
  * Form 24Q (Salary TDS) with Annexure II for Q4.
  * Form 26Q (Non-Salary Vendor TDS — Sections 194C contractor, 194J professional fees, 194I rent, 194Q purchase of goods).
  * Form 27Q (Non-Resident payments) & Form 27EQ (TCS on foreign remittance, car sales, scrap).
* **Form 16 / 16A Automated Generator:**
  * 1-Click bulk PDF generation of signed Part A & Part B Form 16 for all employees.
  * Bulk PDF digital signature (DSC) batch signer.
* **Challan 281 Management:**
  * OLTAS BSR code & Challan serial number validation against NSDL.

### Module 4: Multi-Form 16 & Broker Capital Gains Ingestion
* **Multiple Form 16 Deduplication:** Mid-year job switcher salary aggregation with single standard deduction cap.
* **Broker CSV / API Importer:** Direct trade sheet parsing for Zerodha, Groww, Upstox, AngelOne:
  * Short-Term Capital Gains (STCG @ 20%).
  * Long-Term Capital Gains (LTCG @ 12.5% exceeding ₹1.25 Lakhs).
  * Mutual fund FIFO holding period computation.

### Module 5: Crypto & Virtual Digital Assets (VDA) Hub
* Section 115BBH flat 30% tax computation on crypto gains (no deduction except cost of acquisition).
* Section 194S 1% TDS reconciliation across Indian exchanges (CoinDCX, WazirX) and international wallets.

### Module 6: Advance Tax & Penalty Elimination Engine
* Real-time quarterly Advance Tax calculator (June 15, Sept 15, Dec 15, March 15).
* Interest projection under Section 234B (delayed payment) and Section 234C (deferred installment).

### Module 7: Chartered Accountant (CA) Multi-Tenant Practice Portal
* CA Admin Dashboard (`/ca-admin`) for empaneled CAs to:
  * Manage hundreds of clients across ITR, GST, and TDS.
  * In-app client chat, document requesting, and billing.
  * Digital Signature Certificate (DSC) USB token signing integration.

### Module 8: WhatsApp Status & ITR-V PDF Dispatch Engine
* Enterprise WhatsApp Business API (Gupshup / Cashfree / Twilio):
  * Automated delivery of ITR-V acknowledgements, GSTR filing receipts, and tax payment reminders.

---

## 5. What We Are Providing (The Handover Deliverables Package)

OFS Taxation / Devendra transfers the following complete intellectual property and operational handover package:

| # | Handover Deliverable | Asset Location / Format | Scope & Purpose |
| :- | :--- | :--- | :--- |
| **1** | **Complete Source Code** | GitHub: `https://github.com/Devendra2306/TAXATION-X.git` | Full Next.js 16 frontend and FastAPI backend with clean git history under Devendra. |
| **2** | **Proprietary Commercial License** | [`LICENSE`](./LICENSE) | Legally binding enterprise commercial license assigning all IP to OFS Taxation Private Limited. |
| **3** | **Interactive API Documentation** | OpenAPI 3.0 / Swagger UI at `/docs` | Complete API schemas, request/response models, and error codes for all backend routes. |
| **4** | **Database Schema & ORM Models** | [`backend/app/models/`](./backend/app/models/) | Fully structured SQLAlchemy models (`User`, `Payment`, `TaxProfile`, `TaxComputation`, `Filing`). |
| **5** | **AI Form 16 Parsing Pipeline** | [`backend/app/parsing/form16.py`](./backend/app/parsing/form16.py) | Multimodal Gemini prompt engineering and structured JSON extraction routines. |
| **6** | **Payment Gateway Engine** | [`backend/app/services/payu_service.py`](./backend/app/services/payu_service.py) | Cryptographic SHA-512 request hashing, reverse verification, and webhook handlers. |
| **7** | **DevOps & Deployment Blueprints** | `docker-compose.yml`, `render.yaml`, Vercel config | Zero-downtime deployment scripts for both containerized and serverless environments. |
| **8** | **Environment Configuration Templates**| `.env.example`, `.env.production.example` | Complete list of all operational environment variables, keys, and endpoints. |
| **9** | **Audit Test Suites** | TypeScript (`tsc`) & Python verification scripts | End-to-end cryptographic and type-safety verification suites with zero compilation errors. |
| **10**| **Technical Architecture Guide** | [`NEXTAX_TECH_STACK.md`](./NEXTAX_TECH_STACK.md) | In-depth engineering rationale, data flow diagrams, and integration specifications. |
| **11**| **Repository Protection & Fork Control**| [`README.md`](./README.md) | Instructions on disabling forking, setting up private repo controls, and protecting enterprise IP. |
| **12**| **Knowledge Transfer (KT) Support** | Virtual Sessions / Handover Walkthrough | 2 structured knowledge transfer sessions covering codebase walkthrough, API integration, and deployment. |

---

## 6. Vendor RFQ Evaluation Matrix (Phase 2 Modules)

Vendors responding to this RFQ must submit proposals structured according to the following deliverables and timeline estimates:

```
┌─────────────────────────────────────────────────────────────┬───────────┬─────────────┐
│ Module / Scope Item                                         │ Timeline  │ Estimated   │
│                                                             │ (Weeks)   │ Effort (Hrs)│
├─────────────────────────────────────────────────────────────┼───────────┼─────────────┤
│ 1. Full GST Suite (GSTR-1, GSTR-3B, GSTR-9, 2B Matching)     │ 4 Weeks   │ 120 Hrs     │
│ 2. E-Invoicing (IRN) & E-Way Bill Generation via NIC        │ 2 Weeks   │ 50 Hrs      │
│ 3. Presumptive Taxation (ITR-4 Sugam u/s 44AD/44ADA)        │ 2 Weeks   │ 45 Hrs      │
│ 4. Corporate & Business ITR (ITR-3, ITR-5, ITR-6)           │ 3 Weeks   │ 90 Hrs      │
│ 5. TDS / TCS Hub (Form 24Q, 26Q, 27Q & Form 16 Generation)  │ 3 Weeks   │ 80 Hrs      │
│ 6. Broker Capital Gains & Crypto 115BBH / 194S Engine       │ 2 Weeks   │ 60 Hrs      │
│ 7. Advance Tax & Section 234B/C Interest Calculator         │ 1 Week    │ 30 Hrs      │
│ 8. CA Multi-Tenant Practice Portal & DSC Integration        │ 3 Weeks   │ 85 Hrs      │
│ 9. Enterprise WhatsApp / SMS Delivery Pipeline              │ 1 Week    │ 25 Hrs      │
│ 10. PayU Production Migration & Settlement Setup            │ 1 Week    │ 20 Hrs      │
│ 11. Security Hardening, CERT-In & Data Encryption           │ 2 Weeks   │ 45 Hrs      │
├─────────────────────────────────────────────────────────────┼───────────┼─────────────┤
│ Total Comprehensive Enterprise Tax Suite Scope              │ 14-16 Wks │ ~650 Hrs    │
└─────────────────────────────────────────────────────────────┴───────────┴─────────────┘
```

---

## 7. Sign-off & Contact Details

* **Engineering Lead & Author:** Devendra (`Devendra2306`)
* **Email:** `devdiwakar27@gmail.com`
* **Repository:** [https://github.com/Devendra2306/TAXATION-X.git](https://github.com/Devendra2306/TAXATION-X.git)
* **Organization:** OFS Taxation Private Limited / NexTax Commercial Enterprise Platform
