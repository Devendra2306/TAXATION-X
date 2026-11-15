# Statutory Tax Rules Reference: FY 2025-26 (AY 2026-27) & FY 2024-25 (AY 2025-26)

This document specifies the official statutory provisions, slab rates, deductions, rebates, and scope limitations implemented in the **TAXATION-X / NexTax Tax Engine**.

---

## 1. Statutory Sources & Official Authorities

1. **Income Tax Department of India (ITD):**
   - Tax Rates and Slab Charts: [https://incometaxindia.gov.in/Pages/charts-and-tables.aspx](https://incometaxindia.gov.in/Pages/charts-and-tables.aspx)
   - CBDT Circulars and Notifications: [https://incometaxindia.gov.in/Pages/communications/circulars.aspx](https://incometaxindia.gov.in/Pages/communications/circulars.aspx)
2. **Finance Acts:**
   - **Finance Act 2025 / Budget 2025:** Enacted revised Section 115BAC slabs (0-4L, 4-8L, etc.), raised Standard Deduction to ₹75,000, and expanded Section 87A rebate to ₹60,000 for AY 2026-27.
   - **Finance (No. 2) Act 2024:** Enacted AY 2025-26 provisions (Standard Deduction of ₹75,000 under New Regime, Section 87A rebate up to ₹25,000).
   - **Income-tax Act, 1961:** First Schedule Part I (Old Regime Slabs), Section 16(ia) (Standard Deduction), Section 87A (Rebate), Section 80C (Investment Deductions), Section 24(b) (Home Loan Interest).

---

## 2. Assessment Year 2026-27 (Financial Year 2025-26)

### A. New Tax Regime (Section 115BAC) — Default Regime
- **Standard Deduction (Salaried/Pensioners u/s 16(ia)):** Flat ₹75,000.
- **Progressive Slab Rates:**
  - ₹0 to ₹4,00,000: **Nil (0%)**
  - ₹4,00,001 to ₹8,00,000: **5%**
  - ₹8,00,001 to ₹12,00,000: **10%**
  - ₹12,00,001 to ₹16,00,000: **15%**
  - ₹16,00,001 to ₹20,00,000: **20%**
  - ₹20,00,001 to ₹24,00,000: **25%**
  - Above ₹24,00,000: **30%**
- **Section 87A Rebate:**
  - Applicable to resident individuals with taxable income up to ₹12,00,000.
  - Maximum rebate: **₹60,000** (covers full slab tax up to ₹12L).
  - **Zero Tax Threshold:** Gross salary up to **₹12,75,000** pays **₹0 tax** (₹12,00,000 taxable + ₹75,000 standard deduction).
- **Section 87A Marginal Relief:**
  - For resident individuals whose taxable income slightly exceeds ₹12,00,000:
    $$\text{Tax Liability} \le \text{Taxable Income} - ₹12,00,000$$
  - Example: Taxable income ₹12,10,000 has slab tax of ₹61,000. Marginal relief caps tax at excess income (₹10,000) + 4% cess = ₹10,400.
- **Health & Education Cess:** 4% on tax liability after rebate and marginal relief.

### B. Old Tax Regime (Optional)
- **Standard Deduction (Salaried u/s 16(ia)):** Flat ₹50,000.
- **Section 80C Cap:** Maximum **₹1,50,000** (EPF, PPF, ELSS, Life Insurance, Tuition Fees, etc.).
- **Section 24(b) Cap:** Maximum **₹2,00,000** for interest on self-occupied housing loan.
- **Progressive Slab Rates (General Individual below 60 years):**
  - ₹0 to ₹2,50,000: **Nil (0%)**
  - ₹2,50,001 to ₹5,00,000: **5%**
  - ₹5,00,001 to ₹10,00,000: **20%**
  - Above ₹10,00,000: **30%**
- **Section 87A Rebate:**
  - Applicable to resident individuals with taxable income up to ₹5,00,000.
  - Maximum rebate: **₹12,500** (covers full slab tax up to ₹5L).
- **Health & Education Cess:** 4% on tax liability after rebate.

---

## 3. Assessment Year 2025-26 (Financial Year 2024-25)

### A. New Tax Regime (Section 115BAC)
- **Standard Deduction:** ₹75,000.
- **Slabs:**
  - ₹0 to ₹3,00,000: **Nil (0%)**
  - ₹3,00,001 to ₹7,00,000: **5%**
  - ₹7,00,001 to ₹10,00,000: **10%**
  - ₹10,00,001 to ₹12,00,000: **15%**
  - ₹12,00,001 to ₹15,00,000: **20%**
  - Above ₹15,00,000: **30%**
- **Section 87A Rebate:** Up to ₹25,000 for taxable income $\le$ ₹7,00,000 (Zero tax up to ₹7.75L gross).

### B. Old Tax Regime
- Standard Deduction: ₹50,000.
- Slabs: 0-2.5L (Nil), 2.5-5L (5%), 5-10L (20%), >10L (30%).
- Section 87A Rebate: Up to ₹12,500 for taxable income $\le$ ₹5,00,000.

---

## 4. Scope Limitations & Explicitly Unsupported Cases

To prevent erroneous returns, the platform enforces clear eligibility boundaries:

1. **Senior Citizens (Age 60 to 79) and Super Senior Citizens (Age 80+) in Old Regime:**
   - Under the Old Regime, the basic exemption limit for senior citizens is ₹3,00,000 (senior) and ₹5,00,000 (super senior).
   - Under the New Regime, slab rates are identical for all age groups.
   - *Current Platform Scope:* Computations apply standard Individual slabs (age < 60). Senior citizen differentiated slabs under Old Regime are not modelled; users are advised to file under New Regime or consult a CA for Old Regime senior-citizen computations.
2. **Total Income Exceeding ₹50 Lakhs (Surcharge & Form Eligibility):**
   - Under CBDT rules, **Form ITR-1 (Sahaj) is strictly prohibited for taxpayers with total income exceeding ₹50,00,000**.
   - Taxpayers with income > ₹50L are subject to surcharge under Chapter II (10% for 50L-1Cr, 15% for 1Cr-2Cr, 25% for 2Cr+).
   - *Enforced Block:* The filing service (`backend/app/routers/itr.py` and `eri_service.py`) checks `total_income > 5000000` and halts filing with HTTP 422:
     > *"ITR-1 is not applicable: Total income exceeds the ₹50 Lakh threshold for ITR-1 (Sahaj). Please file using Form ITR-2."*
   - The tax calculator flags `itr1_eligible: false` and `surcharge_applicable: true` with guidance to file ITR-2/ITR-3.
3. **Business & Professional Income:**
   - Section 44AD / 44ADA / 44AE requires Form ITR-4 (Sugam).
4. **Capital Gains & Foreign Assets:**
   - Requires Form ITR-2. Form ITR-1 does not permit capital gains reporting (except exempt agricultural income up to ₹5,000).
5. **Relief u/s 89, 90, 91:**
   - Tax relief on salary arrears requires mandatory filing of Form 10E on the e-filing portal before ITR submission.
