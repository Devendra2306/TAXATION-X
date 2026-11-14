# 🚀 NexTax - The AI-First Tax Filing Platform

> [!IMPORTANT]
> **🏢 PRIVATE ENTERPRISE SOFTWARE — NOT A PERSONAL REPOSITORY**
> 
> **CONFIDENTIALITY & OFFICIAL HANDOVER NOTICE:**  
> This repository contains proprietary, production-grade commercial software developed exclusively for **OFS Taxation Private Limited** / **NexTax Platform**.
> * **Project Status:** Enterprise Production Handover Phase.
> * **Nature:** Proprietary Enterprise Intellectual Property (Not a personal, hobby, or open-source project).
> * **Ownership:** All rights, title, and interest in this codebase, including proprietary tax computation engines, AI parsing pipelines, workflows, and integrations, belong strictly to **OFS Taxation Private Limited**.
> * **Restrictions:** Unauthorized cloning, downloading, distribution, copying, or forking is strictly prohibited under applicable corporate copyright and trade secret laws.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.103-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Google_Gemini-4285F4?logo=google)](https://deepmind.google/technologies/gemini/)
[![Enterprise License](https://img.shields.io/badge/License-Proprietary_Enterprise-red)](./LICENSE)
[![Status](https://img.shields.io/badge/Status-Handover_Ready-blue)]()

NexTax is a modern, highly-automated tax filing and optimization platform designed to replace complex, form-heavy tax filing experiences with an intelligent, conversational workflow. Built for the Indian market, it streamlines the ITR filing process using AI to automatically parse documents, detect capital gains, and maximize deductions.

**🔗 [View Technical Architecture & Tech Stack](./NEXTAX_TECH_STACK.md)**

## ✨ Key Features

*   **🤖 AI Document Parsing:** Upload any Form 16 (PDF) and our Gemini-powered engine flawlessly extracts gross salary, 80C deductions, and TDS without relying on rigid OCR templates.
*   **🏦 Live Gov Integration:** Secure PAN verification and Form 26AS/AIS prefill data fetching via Aadhaar OTP (Powered by Cashfree/Setu ERI Sandbox).
*   **💼 The "Trust & Transact" Funnel:** A high-converting onboarding flow that offers ITR-1 for free to drive acquisition, while intelligently detecting Capital Gains to trigger a premium upgrade (ITR-2/3) or an Expert CA upsell.
*   **🧑‍⚖️ Digital CA Chatbot:** A fully integrated AI tax assistant available 24/7 to answer specific tax queries based on the user's uploaded data.
*   **📊 ClearTax-Style Review Dashboard:** A beautifully designed, tabbed review interface (Personal, Income, Deductions, Taxes Paid) that builds user trust before final submission.

## 🛠️ Tech Stack

*   **Frontend:** Next.js 16 (App Router), React, Tailwind CSS, Framer Motion, Firebase Auth (Google Login).
*   **Backend:** FastAPI (Python), SQLAlchemy, SQLite/PostgreSQL, PyJWT.
*   **Deployment:** Vercel (Frontend), Render (Backend).

## 🚀 Quick Start (Local Development)

### 1. Start the Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # On Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*Note: Make sure you configure your `.env` file with your `GEMINI_API_KEY`, `EXTERNAL_API_KEY`, and `EXTERNAL_API_SECRET`.*

### 2. Start the Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
*Note: Create a `.env.local` file with `NEXT_PUBLIC_API_URL=http://localhost:8000`.*

---

## 🛡️ Repository Protection & Git Maintenance Guide

Follow these steps to legally protect your codebase, disable unauthorized forking/copying on GitHub, and safely manage git operations.

### 1. How to Add a Proprietary License (Prevent Copying Legally)
By default, repositories without a license or with open-source licenses (like MIT) permit copying. To make your project strictly proprietary (**All Rights Reserved**):

1. In the root directory of your repository, create a file named `LICENSE`:
   ```text
   Copyright (c) 2026 Devendra (OFS Taxation / NexTax Platform). All Rights Reserved.

   CONFIDENTIAL AND PROPRIETARY.
   Unauthorized copying, modification, distribution, transmission, or reproduction 
   of this software, via any medium, is strictly prohibited without the express 
   written consent of the copyright owner.
   ```
2. Commit and push the `LICENSE` file:
   ```bash
   git add LICENSE
   git commit -m "docs: add proprietary all rights reserved license"
   git push origin main
   ```

---

### 2. How to Stop People From Forking & Copying Your Code

To prevent anyone from copying, downloading, or forking your repository:

#### Option A: Disable Forking on GitHub (Keep Repo Public, But Block Forking)
1. Go to your GitHub repository: `https://github.com/Devendra2306/<repo-name>`
2. Click on **Settings** (top right tab of your repository).
3. Under **General**, scroll down to the **Features** section.
4. Locate **Allow forking** and **uncheck** the box:
   - `[ ] Allow forking`
   - *Result: The "Fork" button is completely disabled for external users.*

#### Option B: Make the Repository Private (100% Secure from Copying)
1. In repository **Settings** -> scroll down to the **Danger Zone** at the very bottom.
2. Under **Change repository visibility**, click **Change visibility**.
3. Select **Make private** and confirm.
   - *Result: Only you and invited collaborators can view, clone, or copy the code.*

#### Option C: How to Close or Reject Fork Pull Requests
If someone has already forked or opened an unauthorized Pull Request (PR):
1. Navigate to the **Pull requests** tab on GitHub.
2. Click on the unwanted Pull Request from the fork.
3. Scroll to the bottom comment box and click **Close pull request** (or **Close with comment**).
4. *(Optional)* Block the user: Click on their username -> click `...` on their profile -> **Block or report user**.

#### Option D: Remove Unauthorized Clones (DMCA Takedown)
If an unauthorized public copy/fork of your proprietary code already exists:
- Submit a formal GitHub DMCA Takedown request at: [GitHub DMCA Takedown Policy](https://support.github.com/contact/dmca-takedown) specifying your original copyright.

---

### 3. How to Safely Git Pull & Sync Changes

To pull the latest updates from the remote repository without losing your local work:

#### Standard Git Pull:
```bash
git pull origin main
```

#### Safe Git Pull (with Local Uncommitted Changes):
If you have work in progress that is not yet committed:
```bash
# 1. Stash your current changes
git stash

# 2. Pull the latest commits from GitHub
git pull --rebase origin main

# 3. Re-apply your stashed changes
git stash pop
```

#### If Merge Conflicts Occur:
```bash
# Check files with conflicts
git status

# After resolving conflicting lines in your editor:
git add <resolved-file>
git rebase --continue    # (or git commit if standard merge)
```

---

## 🧪 Automated Testing & Concurrency Verification

### Run Standard Test Suite (SQLite & Unit Tests)
```bash
cd backend
python -m pytest tests -q
```

### Run Live PostgreSQL Multi-Worker Concurrency Test
The backend enforces double-submission prevention through database-level `UniqueConstraint("user_id", "assessment_year")` and PostgreSQL row-level locking (`SELECT ... FOR UPDATE`). To run the live 8-worker concurrent race test against PostgreSQL:

```bash
# 1. Start the PostgreSQL service via docker-compose
docker compose up -d postgres

# 2. Run the PostgreSQL concurrency test with the test database URL
cd backend
TEST_POSTGRES_URL="postgresql://postgres:postgrespassword@localhost:5432/ofs_tax" python -m pytest tests/test_postgres_concurrency.py -v
```
*(Note: When `TEST_POSTGRES_URL` is unset, the test is automatically skipped so standard local test runs remain lightweight.)*

---

## 📋 Corporate Handover & Contact Information

This software is undergoing final enterprise handover to **OFS Taxation Private Limited**.

* **Author & Engineering Lead:** Devendra (`devdiwakar27@gmail.com` / GitHub: [`Devendra2306`](https://github.com/Devendra2306))
* **Entity:** OFS Taxation Private Limited / NexTax Commercial Platform
* **Classification:** Proprietary Enterprise Asset (Strictly Non-Public / Handover Ready)

---

*Designed and engineered for OFS Taxation Private Limited.*
