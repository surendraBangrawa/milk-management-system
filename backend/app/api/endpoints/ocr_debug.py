from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.services.ocr_parser import get_text_from_image_via_api
import logging
import tempfile
import os

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/debug_ocr")
async def debug_ocr_extraction(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
):
    """Debug endpoint to test OCR extraction without full processing"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        # Check file size (max 10MB)
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")

        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file")

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_file:
            tmp_file.write(content)
            file_path = tmp_file.name

        logger.info(f"Debug OCR for buyer: {buyer_mobile}, file: {file.filename}")
        logger.info(f"File size: {len(content)} bytes")

        # Extract text using OCR
        extracted_text = get_text_from_image_via_api(file_path)

        # Clean up temporary file
        try:
            os.unlink(file_path)
        except OSError:
            pass  # File might already be deleted

        if not extracted_text:
            return {
                "success": False,
                "error": "No text extracted from image",
                "file_size": len(content),
                "filename": file.filename,
            }

        return {
            "success": True,
            "text_length": len(extracted_text),
            "text_preview": extracted_text[:500],
            "full_text": extracted_text,
            "file_size": len(content),
            "filename": file.filename,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Debug OCR error: {e}")
        raise HTTPException(status_code=500, detail=f"OCR debug failed: {str(e)}")
