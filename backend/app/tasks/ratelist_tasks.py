import os
import re
import pandas as pd
import logging
from inngest import Inngest, TriggerEvent, Context
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import RateList
from app.services.ocr_parser import (
    get_text_from_image_via_api,
    parse_extracted_text_to_dataframe,
)

logger = logging.getLogger(__name__)

# Initialize Inngest client - CORRECT SYNTAX
inngest = Inngest(app_id="milk-management")


# CORRECT SYNTAX - Import TriggerEvent and use it properly
@inngest.create_function(
    fn_id="process-rate-list-image",
    trigger=TriggerEvent(event="image.uploaded"),
)
async def process_rate_list_image_task(ctx: Context, step=None) -> dict:
    """
    Inngest function to process rate list images (replaces Celery task).
    """
    file_path = ctx.event.data["file_path"]
    buyer_mobile = ctx.event.data["buyer_mobile"]
    db: Session = None

    try:
        logger.info(f"Starting background processing for buyer: {buyer_mobile}")
        db = next(get_db())

        # Update status to processing
        existing_rate_list = (
            db.query(RateList).filter(RateList.buyer_mobile == buyer_mobile).first()
        )
        if existing_rate_list:
            existing_rate_list.status = "processing"
            db.commit()
            logger.info(f"Updated status to 'processing' for buyer: {buyer_mobile}")

        # Extract text from image
        extracted_text = get_text_from_image_via_api(file_path)
        if not extracted_text or len(extracted_text.strip()) < 250:
            raise Exception("Failed to extract sufficient text from the image.")

        logger.info(f"Text extracted successfully, length: {len(extracted_text)}")

        # Parse extracted text
        success, extracted_df = parse_extracted_text_to_dataframe(extracted_text)
        if not success or extracted_df.empty:
            raise Exception("Failed to parse data from the extracted text.")

        logger.info(f"DataFrame created successfully with {len(extracted_df)} rows")

        # Process rate data (your existing logic)
        rate_list_for_api = []
        snf_columns = [
            col for col in extracted_df.columns if re.match(r"^\d+(\.\d+)?$", str(col))
        ]

        for index, row in extracted_df.iterrows():
            fat_col_name = extracted_df.columns[0]
            fat_snf_value = row.get(fat_col_name)
            if fat_snf_value is None:
                continue
            try:
                fat_value = float(fat_snf_value)
            except (ValueError, TypeError):
                continue

            for snf_col in snf_columns:
                rate_value = row.get(snf_col)
                if rate_value is None:
                    continue
                try:
                    snf_value = float(snf_col)
                    if pd.notna(rate_value):
                        rate_entry = {
                            "fat": fat_value,
                            "snf": snf_value,
                            "rate": float(rate_value),
                        }
                        rate_list_for_api.append(rate_entry)
                except (ValueError, TypeError):
                    continue

        if not rate_list_for_api:
            raise Exception(
                "No valid rate data could be extracted and parsed from the image."
            )

        # Calculate ranges
        fat_values = [rate["fat"] for rate in rate_list_for_api]
        snf_values = [rate["snf"] for rate in rate_list_for_api]

        min_fat = min(fat_values) if fat_values else 0.0
        max_fat = max(fat_values) if fat_values else 0.0
        min_snf = min(snf_values) if snf_values else 0.0
        max_snf = max(snf_values) if snf_values else 0.0

        # Save to database (your existing logic)
        existing_rate_list = (
            db.query(RateList).filter(RateList.buyer_mobile == buyer_mobile).first()
        )
        if existing_rate_list:
            if existing_rate_list.is_deleted is True:
                existing_rate_list.is_deleted = False
            existing_rate_list.rates = rate_list_for_api
            existing_rate_list.min_fat = min_fat
            existing_rate_list.max_fat = max_fat
            existing_rate_list.min_snf = min_snf
            existing_rate_list.max_snf = max_snf
            existing_rate_list.status = "complete"
            db.commit()
            db.refresh(existing_rate_list)
        else:
            new_rate_list = RateList(
                buyer_mobile=buyer_mobile,
                rates=rate_list_for_api,
                min_fat=min_fat,
                max_fat=max_fat,
                min_snf=min_snf,
                max_snf=max_snf,
                status="complete",
            )
            db.add(new_rate_list)
            db.commit()
            db.refresh(new_rate_list)

        # Update status to complete
        if existing_rate_list:
            existing_rate_list.status = "complete"
            db.commit()
            logger.info(f"Updated status to 'complete' for buyer: {buyer_mobile}")

        return {
            "status": "success",
            "buyer_mobile": buyer_mobile,
            "entries_processed": len(rate_list_for_api),
        }

    except Exception as e:
        logger.error(
            f"Background processing failed for buyer {buyer_mobile}: {e}", exc_info=True
        )
        if db:
            try:
                existing_rate_list = (
                    db.query(RateList)
                    .filter(RateList.buyer_mobile == buyer_mobile)
                    .first()
                )
                if existing_rate_list:
                    existing_rate_list.status = "failed"
                    # Optionally store error details in a separate field if you have one
                    # existing_rate_list.error_message = str(e)
                    db.commit()
                    logger.info(f"Updated status to 'failed' for buyer: {buyer_mobile}")
                else:
                    logger.warning(
                        f"No rate list record found for buyer: {buyer_mobile}"
                    )
            except Exception as db_error:
                logger.error(
                    f"Failed to update database status for buyer {buyer_mobile}: {db_error}"
                )
        return {"status": "error", "error": str(e), "buyer_mobile": buyer_mobile}
    finally:
        if db:
            db.close()
        # Clean up temporary file
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError as e:
                logger.error(f"Failed to remove temporary file {file_path}: {e}")
