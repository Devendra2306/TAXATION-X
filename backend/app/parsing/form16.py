import pdfplumber
import re
import json
import google.generativeai as genai
from typing import Dict, Any
from app.config import settings

# Initialize Gemini if key exists
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

def extract_form16_data(pdf_path: str) -> Dict[str, Any]:
    """
    Extracts key financial data from a Form 16 PDF using pdfplumber and Google Gemini.
    """
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return {}

    # Initialize extracted data dictionary
    data = {
        "gross_salary": 0.0,
        "deductions_80c": 0.0,
        "tds_deducted": 0.0,
        "employer_name": "Unknown",
        "pan": "",
        "financial_year": "2023-24"
    }

    if model and len(text.strip()) > 50:
        try:
            print("Using Gemini for smart extraction...")
            prompt = f"""
            You are a tax assistant. Extract the following precise numbers from the Form 16 text below.
            Return ONLY a valid JSON object with the exact keys:
            - gross_salary (number, usually under section 17(1))
            - deductions_80c (number, total 80C deductions)
            - tds_deducted (number, total tax deducted)
            - employer_name (string, name of the company/deductor)
            - pan (string, PAN of the employee)

            Do NOT include markdown formatting like ```json or any other text.
            If a value is not found, use 0 for numbers and "" for strings.
            
            Text:
            {text[:15000]}
            """
            response = model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Remove markdown if it was added by mistake
            if result_text.startswith("```json"):
                result_text = result_text.replace("```json", "").replace("```", "").strip()
            if result_text.startswith("```"):
                result_text = result_text.replace("```", "").strip()
                
            ai_data = json.loads(result_text)
            
            # Merge AI data
            if "gross_salary" in ai_data: data["gross_salary"] = float(ai_data["gross_salary"] or 0)
            if "deductions_80c" in ai_data: data["deductions_80c"] = float(ai_data["deductions_80c"] or 0)
            if "tds_deducted" in ai_data: data["tds_deducted"] = float(ai_data["tds_deducted"] or 0)
            if "employer_name" in ai_data: data["employer_name"] = str(ai_data["employer_name"] or "Unknown")
            if "pan" in ai_data: data["pan"] = str(ai_data["pan"] or "")
            
            return data
            
        except Exception as e:
            print(f"Gemini extraction failed: {e}")
            # Fall back to regex if AI fails

    # Basic regex fallback patterns for Form 16 extraction
    gross_salary_match = re.search(r'(?:Gross Salary|Salary as per provisions contained in section 17\(1\)).*?([\d,]+\.\d{2})', text, re.IGNORECASE)
    if gross_salary_match:
        data["gross_salary"] = float(gross_salary_match.group(1).replace(',', ''))

    deduction_match = re.search(r'Total amount deductible under section 80C.*?([\d,]+\.\d{2})', text, re.IGNORECASE)
    if deduction_match:
        data["deductions_80c"] = float(deduction_match.group(1).replace(',', ''))
        
    tds_match = re.search(r'Total tax deducted.*?([\d,]+\.\d{2})', text, re.IGNORECASE)
    if tds_match:
        data["tds_deducted"] = float(tds_match.group(1).replace(',', ''))

    return data
