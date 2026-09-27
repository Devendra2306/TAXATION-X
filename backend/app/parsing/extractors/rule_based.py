import pdfplumber
import re

def parse_form16_pdf(file_path: str) -> dict:
    """
    Rule-based extraction for Form 16 using pdfplumber.
    In a real scenario, this would use complex regex or coordinate mapping.
    For this MVP, it extracts text and runs basic regex to find key fields.
    """
    extracted_data = {
        "pan": None,
        "employer_name": None,
        "gross_salary": 0.0,
        "standard_deduction": 50000.0,
        "total_tax_deducted": 0.0
    }
    
    try:
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
                
        # Basic Regex Patterns for demo purposes
        pan_match = re.search(r"PAN of the Employee:\s*([A-Z]{5}[0-9]{4}[A-Z]{1})", text, re.IGNORECASE)
        if pan_match:
            extracted_data["pan"] = pan_match.group(1)
            
        tax_match = re.search(r"Total amount of tax deducted at source.*?([0-9,]+\.[0-9]{2})", text, re.IGNORECASE)
        if tax_match:
            val = tax_match.group(1).replace(",", "")
            extracted_data["total_tax_deducted"] = float(val)
            
        salary_match = re.search(r"Gross Salary.*?([0-9,]+\.[0-9]{2})", text, re.IGNORECASE)
        if salary_match:
            val = salary_match.group(1).replace(",", "")
            extracted_data["gross_salary"] = float(val)

    except Exception as e:
        print(f"Error parsing PDF: {e}")
        # Could flag for AI fallback here
        
    return extracted_data
