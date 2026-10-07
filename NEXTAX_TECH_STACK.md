# NexTax - Technical Architecture & Stack Documentation

NexTax is an AI-first tax filing and optimization platform designed to replace complex, form-heavy tax filing experiences (like ClearTax) with a conversational, highly-automated workflow.

---

## 1. Tech Stack Overview

### Frontend (Client-Side)
*   **Framework:** Next.js 16 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Animations:** Framer Motion (used for page transitions, smooth modals, and the dashboard sidebar)
*   **Icons:** Lucide React
*   **Hosting:** Vercel (`nextaxx3.vercel.app`)

### Backend (Server-Side)
*   **Framework:** FastAPI (Python)
*   **Database:** SQLite (Development) / PostgreSQL (Production ready via SQLAlchemy)
*   **ORM:** SQLAlchemy
*   **Authentication:** JWT (JSON Web Tokens) with `PyJWT` & `passlib` for password hashing
*   **Hosting:** Render (`taxation-x.onrender.com`)

### Artificial Intelligence & Parsing
*   **LLM Provider:** Google Gemini API (`gemini-1.5-flash`)
*   **Document Parsing:** `pdfplumber` (extracts raw text from Form 16 PDFs, which is then passed to Gemini for intelligent extraction)

### External Integrations & APIs
*   **Authentication (Social):** Firebase Authentication (Google OAuth)
*   **Identity Verification:** Cashfree / Setu APIs (Used for Live PAN Verification)
*   **Tax Filing (ERI):** Sandbox ERI APIs (Handles Aadhaar OTP generation, Form 26AS/AIS prefill fetching, and JSON payload submission to the Income Tax Department)

---

## 2. Core Workflows & Architecture

### A. Authentication Flow
1.  **Email/Password:** User registers. Backend hashes password via `bcrypt` and stores it. Returns a JWT access token.
2.  **Google Login:** Handled on the frontend via Firebase `signInWithPopup`. Once authenticated by Google, a shadow account is created in the local SQLite DB to sync the user state, returning a JWT token for backend API access.
3.  **Security:** All protected backend routes use `Depends(get_current_user)` to validate the Bearer JWT token.

### B. The "Trust & Transact" Onboarding Funnel
1.  **`/select-plan`:** Users are presented with Pricing Tiers (ITR-1 is "FREE" to act as a growth hook).
2.  **`/verify-pan`:** Secure PAN entry. Backend pings Cashfree API to verify the PAN and fetch the name registered with the ITD.
3.  **`/upload` (Data Ingestion):**
    *   *Auto-Fetch:* User requests Aadhaar OTP. Backend pings ERI Sandbox to fetch ITD pre-fill data.
    *   *Manual Upload:* User uploads a `.pdf`. Backend uses `pdfplumber` + Gemini to parse numbers (Gross Salary, 80C Deductions, TDS).
4.  **`/review` (The Trap & Upsell):**
    *   Data is presented in a clean, ClearTax-style tabbed UI.
    *   **Freemium Trap:** If Capital Gains are detected and the user is on the Free Plan, a modal locks the screen forcing an upgrade to ITR-2 (₹999).
    *   **CA Upsell:** A sticky banner offers Expert CA filing for ₹2,999.

---

## 3. Backend API Endpoints (FastAPI)

*   **Auth (`/api/auth`)**
    *   `POST /register`: Create new user
    *   `POST /login`: Generate JWT token
    *   `GET /me`: Fetch authenticated user profile
*   **Upload & Parsing (`/api/upload`)**
    *   `POST /form16`: Accepts PDF file, extracts data using Gemini, saves to DB.
*   **Tax E-Filing (`/api/itr`)**
    *   `POST /verify-pan`: Pings Cashfree to verify PAN validity.
    *   `POST /generate-otp`: Pings ITD/ERI for Aadhaar OTP.
    *   `POST /prefill`: Submits OTP and fetches JSON Form 26AS data.
*   **AI Chat (`/api/chat`)**
    *   `POST /`: Takes user prompt + JSON tax context, returns Gemini expert tax advice.

---

## 4. Key Engineering Decisions
1.  **Why Gemini AI over Regex?** Traditional tax platforms use rigid Regex/OCR that breaks if a Form 16 looks slightly different. Gemini handles unstructured, messy PDFs flawlessly.
2.  **Why decoupled Frontend/Backend?** Vercel is best-in-class for Next.js delivery, but terrible for running heavy Python AI workloads. Keeping FastAPI on Render allows for long-running PDF parsing and AI generation without Vercel's strict serverless timeout limits.
3.  **Why "Freemium" via ITR-1?** ITR-1 covers 70% of the Indian salaried workforce. Offering it for free is a massive user acquisition strategy, allowing the platform to monetize through CA upsells and Capital Gains cross-sells.
