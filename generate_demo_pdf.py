from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
import os

def generate_dummy_form16(filename="Demo_Form_16.pdf"):
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4

    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width/2, height - 50, "FORM NO. 16")
    c.setFont("Helvetica", 10)
    c.drawCentredString(width/2, height - 65, "[See rule 31(1)(a)]")
    c.drawCentredString(width/2, height - 80, "Certificate under section 203 of the Income-tax Act, 1961 for tax deducted at source on salary")

    # Deductor Info
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 120, "Name and address of the Employer / Deductor:")
    c.setFont("Helvetica", 11)
    c.drawString(50, height - 135, "ACME Tech Corp Pvt. Ltd.")
    c.drawString(50, height - 150, "Cyber City, Gurugram, 122002")

    # Employee Info
    c.setFont("Helvetica-Bold", 12)
    c.drawString(300, height - 120, "Name and address of the Employee:")
    c.setFont("Helvetica", 11)
    c.drawString(300, height - 135, "John Doe")
    c.drawString(300, height - 150, "PAN: ABCDE1234F")

    c.line(50, height - 170, width - 50, height - 170)

    # Part B (Details of Salary)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 200, "PART B (Details of Salary paid and any other income and tax deducted)")

    c.setFont("Helvetica", 11)
    
    # Gross Salary
    c.drawString(50, height - 230, "1. Gross Salary")
    c.drawString(70, height - 245, "(a) Salary as per provisions contained in section 17(1)")
    c.drawRightString(width - 60, height - 245, "24,50,000.00")
    
    c.drawString(70, height - 260, "(b) Value of perquisites u/s 17(2)")
    c.drawRightString(width - 60, height - 260, "0.00")
    
    c.drawString(70, height - 275, "(c) Profits in lieu of salary u/s 17(3)")
    c.drawRightString(width - 60, height - 275, "0.00")
    
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, height - 295, "Total Gross Salary")
    c.drawRightString(width - 60, height - 295, "24,50,000.00")
    
    # Exemptions
    c.setFont("Helvetica", 11)
    c.drawString(50, height - 325, "2. Less: Allowances to the extent exempt under section 10")
    c.drawString(70, height - 340, "House Rent Allowance")
    c.drawRightString(width - 60, height - 340, "1,20,000.00")

    # Chapter VIA Deductions
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, height - 380, "Deductions under Chapter VI-A")
    c.setFont("Helvetica", 11)
    
    c.drawString(50, height - 400, "80C - Total amount deductible under section 80C")
    c.drawRightString(width - 60, height - 400, "1,45,000.00")
    
    c.drawString(50, height - 415, "80D - Health Insurance Premium")
    c.drawRightString(width - 60, height - 415, "0.00")

    # Tax info
    c.line(50, height - 440, width - 50, height - 440)
    
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, height - 460, "Tax Payable")
    c.drawRightString(width - 60, height - 460, "3,83,500.00")

    c.drawString(50, height - 480, "Total tax deducted")
    c.drawRightString(width - 60, height - 480, "3,83,500.00")
    
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 550, "This is a computer generated demo certificate.")

    c.save()
    print(f"Generated {filename}")

if __name__ == "__main__":
    generate_dummy_form16()
