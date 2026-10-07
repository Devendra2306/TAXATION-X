# 🚀 NexTax - The AI-First Tax Filing Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.103-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Google_Gemini-4285F4?logo=google)](https://deepmind.google/technologies/gemini/)

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

*Designed and engineered to make tax season painless.*
