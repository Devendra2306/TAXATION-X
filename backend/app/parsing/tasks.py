from celery import shared_task
import time
import os
from .extractors.rule_based import parse_form16_pdf

@shared_task(bind=True, max_retries=3)
def parse_form16_task(self, document_id: str, file_path: str):
    """
    Celery task to parse a Form 16 PDF asynchronously.
    """
    try:
        # Simulate initial processing delay
        time.sleep(1)
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        # Call the rule-based extractor
        extracted_data = parse_form16_pdf(file_path)
        
        # Here we would update the Document status to 'done' in the DB
        # and store the extracted_data in the parsed_data JSONB column.
        
        return {
            "status": "success",
            "document_id": document_id,
            "data": extracted_data
        }
    except Exception as exc:
        # In production, we'd update Document status to 'failed' in DB before raising
        raise self.retry(exc=exc, countdown=5)
