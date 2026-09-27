import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.document import Document
# In production, we'd trigger parsing task via Celery here.
from ..parsing.tasks import parse_form16_task

router = APIRouter(prefix="/api/documents", tags=["documents"])

# Temporary local upload directory for MVP instead of S3
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    file_id = uuid.uuid4()
    s3_key = f"{file_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, s3_key)

    # Save file locally (simulating S3 upload)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Note: user_id is hardcoded for MVP until auth is connected
    dummy_user_id = uuid.uuid4() # We'd get this from token

    new_doc = Document(
        id=file_id,
        user_id=dummy_user_id,
        file_name=file.filename,
        s3_key=s3_key,
        document_type="form_16",
        status="processing"
    )
    
    # Normally we'd save to DB here, but since dummy_user_id violates foreign key (unless user exists),
    # For this local demo router, we'll just queue the task and return.
    # In a real app: db.add(new_doc); db.commit()

    # Trigger Celery Task
    task = parse_form16_task.delay(str(file_id), file_path)

    return {
        "message": "File uploaded successfully",
        "document_id": str(file_id),
        "task_id": task.id
    }
