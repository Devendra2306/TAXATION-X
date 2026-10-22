from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Dict, Optional
from pydantic import BaseModel
import logging
import google.generativeai as genai
from app.config import settings
from app.routers.auth import get_optional_current_user
from app.models.user import User
from app.main_limiter import limiter

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Gemini if key exists
gemini_model = None
if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY.strip())
        gemini_model = genai.GenerativeModel('gemini-3.8-flash')
        logger.info("Gemini 3.8 Flash AI engine initialized successfully for NexTax Chat.")
    except Exception as e:
        logger.warning(f"Could not initialize Gemini model: {e}")
        gemini_model = None

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    user_context: Optional[dict] = None

def get_ca_expert_fallback(query: str, context: Optional[dict] = None) -> str:
    """
    Intelligent CA tax advisor fallback engine for FY 2024-25 / AY 2025-26.
    Ensures users ALWAYS receive expert, structured guidance even if external AI is offline.
    """
    q = query.lower()

    if any(k in q for k in ["regime", "old vs new", "which regime", "compare"]):
        return (
            "### ⚖️ Old vs New Tax Regime (FY 2024-25 / AY 2025-26)\n\n"
            "**1. New Tax Regime (Default u/s 115BAC):**\n"
            "- **Zero Tax** up to **₹7.75 Lakhs** income (₹7 Lakh rebate u/s 87A + ₹75,000 Standard Deduction).\n"
            "- Lower slab rates: 0-3L (Nil), 3-7L (5%), 7-10L (10%), 10-12L (15%), 12-15L (20%), Above 15L (30%).\n"
            "- **Trade-off:** No deductions allowed for 80C, 80D, HRA, or Home Loan Interest on self-occupied property.\n\n"
            "**2. Old Tax Regime:**\n"
            "- Higher slab rates, but lets you claim all major deductions:\n"
            "  - **Section 80C:** Up to ₹1.5 Lakhs (EPF, PPF, ELSS, LIC, Home Loan Principal)\n"
            "  - **Section 80D:** ₹25,000 to ₹50,000 (Health Insurance)\n"
            "  - **Section 80CCD(1B):** Additional ₹50,000 for NPS\n"
            "  - **Section 24(b):** Up to ₹2 Lakhs Home Loan Interest\n"
            "  - **HRA u/s 10(13A):** Tax-free rent allowance\n\n"
            "💡 **CA Rule of Thumb:** If your total deductions exceed **₹3.75 - ₹4.0 Lakhs**, the **Old Regime** typically saves more. Otherwise, the **New Regime** is superior. Upload your Form 16 to let NexTax calculate your exact rupee savings!"
        )

    if any(k in q for k in ["80c", "deduction", "save tax", "80d", "nps", "exempt"]):
        return (
            "### 💰 Key Tax Deductions (Under Old Regime - FY 2024-25)\n\n"
            "1. **Section 80C (Max ₹1.50 Lakhs):**\n"
            "   - Employee Provident Fund (EPF) & Public Provident Fund (PPF)\n"
            "   - ELSS Mutual Funds (3-year lock-in)\n"
            "   - Life Insurance Premiums & Term Plans\n"
            "   - Children's School Tuition Fees (max 2 kids)\n"
            "   - Home Loan Principal Repayment & Stamp Duty\n\n"
            "2. **Section 80D (Health Insurance):**\n"
            "   - Self, Spouse & Kids: Up to **₹25,000** (₹50,000 if senior citizen)\n"
            "   - Parents: Additional **₹25,000** (₹50,000 if parents are seniors)\n"
            "   - Preventive Health Checkup: Included up to ₹5,000\n\n"
            "3. **Section 80CCD(1B) (NPS):**\n"
            "   - Additional **₹50,000** deduction over and above Section 80C.\n\n"
            "4. **Section 24(b) (Home Loan Interest):**\n"
            "   - Up to **₹2,00,000** for self-occupied property.\n\n"
            "5. **Standard Deduction:** Flat **₹50,000** (Old) or **₹75,000** (New) automatically applied for salaried taxpayers."
        )

    if any(k in q for k in ["hra", "rent", "house rent"]):
        return (
            "### 🏠 House Rent Allowance (HRA) Exemption Rules\n\n"
            "HRA exemption is calculated under **Section 10(13A)** and is only available under the **Old Tax Regime**.\n\n"
            "The exempt amount is the **LEAST** of the following three:\n"
            "1. Actual HRA received from your employer.\n"
            "2. **50% of Basic Salary + DA** (if living in Delhi, Mumbai, Kolkata, Chennai) or **40%** (for other cities).\n"
            "3. Actual Rent Paid minus **10% of Basic Salary + DA**.\n\n"
            "📋 **Requirements:**\n"
            "- Rent receipts are mandatory if annual rent exceeds ₹1 Lakh.\n"
            "- Landlord's PAN is required if annual rent exceeds ₹1,00,000."
        )

    if any(k in q for k in ["capital gain", "stcg", "ltcg", "shares", "stocks", "mutual fund"]):
        return (
            "### 📈 Capital Gains Tax Rates (Budget 2024 Updates)\n\n"
            "**1. Listed Equity & Equity Mutual Funds:**\n"
            "- **Short Term (STCG - Held < 12 months):** Taxed at **20%** (increased from 15%).\n"
            "- **Long Term (LTCG - Held > 12 months):** Taxed at **12.5%** for gains exceeding **₹1.25 Lakhs** per year (exemption limit raised from ₹1L).\n\n"
            "**2. Real Estate / Immovable Property:**\n"
            "- Long term holding period: 24 months.\n"
            "- Taxed at **12.5% without indexation** (or optional 20% with indexation for properties bought before July 23, 2024).\n\n"
            "**3. Debt Funds:** Taxed as per your applicable income tax slab rate."
        )

    if any(k in q for k in ["deadline", "due date", "last date", "penalty", "late"]):
        return (
            "### 🗓️ Important ITR Filing Deadlines & Penalties\n\n"
            "- **Standard Due Date:** **July 31** of the Assessment Year for non-audit individual taxpayers.\n"
            "- **Belated & Revised Return (u/s 139(4) & 139(5)):** Last date is **December 31**.\n\n"
            "⚠️ **Late Filing Fee (Section 234F):**\n"
            "- If Total Income ≤ ₹5,00,000: **₹1,000**\n"
            "- If Total Income > ₹5,00,000: **₹5,000**\n"
            "- Plus interest @ 1% per month u/s 234A on any outstanding unpaid tax."
        )

    if any(k in q for k in ["notice", "scrutiny", "143(1)", "defective", "139(9)"]):
        return (
            "### 📩 Income Tax Notice Assistance\n\n"
            "Common notices received by taxpayers:\n"
            "1. **Section 143(1) Intimation:** Not a penalty notice; shows comparison between return filed and CPC computation. Check for refund or demand.\n"
            "2. **Section 139(9) Defective Return:** Discrepancy in data; must be rectified within 15 days on the e-filing portal.\n"
            "3. **Section 142(1) / 148:** Scrutiny or reassessment inquiry. Requires supporting documentation.\n\n"
            "💡 Our certified CA team can review your notice and draft an official compliant reply. Reach out via our 'Talk to a Real CA' section."
        )

    # General Tax Expert response
    context_note = ""
    if context and context.get("gross_salary"):
        salary = context.get("gross_salary")
        context_note = f"\n\n*Noted from your uploaded profile: Gross Salary of ₹{salary:,.0f}.*"

    return (
        f"### 👨‍💼 NexTax CA AI Advisor\n\n"
        f"I can assist you with all Indian Income Tax matters for **FY 2024-25 (AY 2025-26)**.\n\n"
        f"**Popular Topics I can help with:**\n"
        f"- ⚖️ **Old vs New Regime:** Find which regime saves you more money.\n"
        f"- 💰 **Tax Deductions:** Maximize 80C, 80D, 80CCD, HRA, and Home Loan benefits.\n"
        f"- 📄 **Form 16 & TDS:** Verify your TDS matches Form 26AS/AIS.\n"
        f"- 📈 **Capital Gains:** Rules for stocks, mutual funds, and property.\n"
        f"- 🚀 **E-Filing Steps:** How to file and e-verify via Aadhaar OTP.{context_note}\n\n"
        f"Please ask a specific question or mention your salary to get an immediate tax breakdown!"
    )

@router.post("")
@limiter.limit("30/minute")
def chat_with_expert(
    request: Request,
    chat_req: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    NexTax AI Assistant endpoint.
    Accessible to both authenticated users and guests.
    - If user is logged in, their tax context is personalized.
    - Uses Gemini 1.5 Flash when available with CA system prompt.
    - Gracefully falls back to high-accuracy CA knowledge base if external AI is unconfigured or rate-limited.
    """
    if not chat_req.messages:
        raise HTTPException(status_code=400, detail="At least one message is required.")

    last_user_msg = chat_req.messages[-1].content.strip()

    # If Gemini is configured, attempt AI inference
    if gemini_model:
        try:
            # Build conversation history
            history = []
            for msg in chat_req.messages[:-1]:
                role = "user" if msg.role == "user" else "model"
                history.append({"role": role, "parts": [msg.content]})

            chat = gemini_model.start_chat(history=history)

            context_str = ""
            if chat_req.user_context:
                context_str = f"\n[User Verified Tax Context: {chat_req.user_context}]\n"
            elif current_user:
                context_str = f"\n[User Name: {current_user.full_name or current_user.email}]\n"

            system_instructions = (
                "You are an expert Indian Chartered Accountant (CA) named NexTax AI. "
                "You provide concise, highly accurate, structured advice based strictly on Indian Income Tax laws "
                "for Financial Year 2024-25 (Assessment Year 2025-26). "
                "Use formatting like bolding, bullet points, and rupee symbols (₹). "
                "Be polite, professional, and explain complex tax rules simply."
            )

            final_prompt = f"{system_instructions}{context_str}\nUser Question: {last_user_msg}"
            response = chat.send_message(final_prompt)
            if response and response.text:
                return {"reply": response.text}
        except Exception as e:
            logger.warning(f"Gemini API invocation failed ({e}), falling back to CA expert engine.")

    # Graceful CA Expert fallback
    reply = get_ca_expert_fallback(last_user_msg, chat_req.user_context)
    return {"reply": reply}
