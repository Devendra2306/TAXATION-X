from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
import tempfile
import uuid

from .. import models, schemas
from ..database import get_db
from ..database import get_db
from ..routers.auth import get_current_user as get_user
from ..parsing.form16 import extract_form16_data

router = APIRouter()

@router.post("/form16")
async def upload_form16(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_user)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Save uploaded file to a temporary location
    try:
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name
        
        # Parse PDF
        parsed_data = extract_form16_data(tmp_path)
        
        # Clean up temp file
        os.remove(tmp_path)
        
        if not parsed_data:
            raise HTTPException(status_code=500, detail="Failed to parse PDF data")
            
        # Save to database
        doc = models.Document(
            user_id=current_user.id,
            filename=file.filename,
            document_type="Form16",
            gross_salary=parsed_data.get("gross_salary", 0),
            deductions_80c=parsed_data.get("deductions_80c", 0),
            tds_deducted=parsed_data.get("tds_deducted", 0),
            employer_name=parsed_data.get("employer_name", ""),
            pan=parsed_data.get("pan", "")
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        return {
            "message": "Form 16 uploaded and parsed successfully",
            "document_id": doc.id,
            "parsed_data": parsed_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
