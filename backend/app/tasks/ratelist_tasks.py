import os
import re
import pandas as pd
import logging
from celery import current_task
from sqlalchemy.orm import Session
from app.celery_app import celery_app
from app.db.session import get_db
from app.db.models import RateList
from app.services.ocr_parser import (
    get_text_from_image_via_api,
    parse_extracted_text_to_dataframe,
)

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="app.tasks.ratelist_tasks.process_rate_list_image")
def process_rate_list_image_task(self, file_path: str, buyer_mobile: str):
    """
    Celery task to process rate list images asynchronously.

    Args:
        file_path (str): Path to the uploaded image file
        buyer_mobile (str): Mobile number of the buyer

    Returns:
        dict: Result of the processing operation
    """
    db: Session = None
    try:
        # Update task state to STARTED
        self.update_state(
            state="STARTED", meta={"status": "Processing image...", "progress": 10}
        )

        logger.info(f"Starting background processing for buyer: {buyer_mobile}")

        # Get database session
        db = next(get_db())

        # Update task state
        self.update_state(
            state="PROGRESS",
            meta={"status": "Extracting text from image...", "progress": 20},
        )

        # Process the image to extract text
        extracted_text = get_text_from_image_via_api(file_path)
        if not extracted_text or len(extracted_text.strip()) < 250:
            raise Exception("Failed to extract sufficient text from the image.")

        logger.info(f"Text extracted successfully, length: {len(extracted_text)}")

        # Update task state
        self.update_state(
            state="PROGRESS",
            meta={"status": "Parsing extracted text...", "progress": 40},
        )

        success, extracted_df = parse_extracted_text_to_dataframe(extracted_text)
        if not success or extracted_df.empty:
            raise Exception("Failed to parse data from the extracted text.")

        logger.info(f"DataFrame created successfully with {len(extracted_df)} rows")

        # Update task state
        self.update_state(
            state="PROGRESS", meta={"status": "Processing rate data...", "progress": 60}
        )

        rate_list_for_api = []
        snf_columns = [
            col for col in extracted_df.columns if re.match(r"^\d+(\.\d+)?$", str(col))
        ]

        logger.info(f"Found {len(snf_columns)} SNF columns: {snf_columns}")

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
                        logger.debug(
                            f"Added rate entry: Fat={fat_value}, SNF={snf_value}, Rate={rate_value}"
                        )
                except (ValueError, TypeError):
                    continue

        if not rate_list_for_api:
            raise Exception(
                "No valid rate data could be extracted and parsed from the image."
            )

        logger.info(f"Processed {len(rate_list_for_api)} valid rate entries")

        # Update task state
        self.update_state(
            state="PROGRESS", meta={"status": "Calculating ranges...", "progress": 80}
        )

        # Calculate min/max values from the extracted data
        fat_values = [rate["fat"] for rate in rate_list_for_api]
        snf_values = [rate["snf"] for rate in rate_list_for_api]

        min_fat = min(fat_values) if fat_values else 0.0
        max_fat = max(fat_values) if fat_values else 0.0
        min_snf = min(snf_values) if snf_values else 0.0
        max_snf = max(snf_values) if snf_values else 0.0

        logger.info(
            f"Calculated ranges: Fat({min_fat}-{max_fat}), SNF({min_snf}-{max_snf})"
        )

        # Validate the calculated values
        if min_fat < 0 or max_fat < 0 or min_snf < 0 or max_snf < 0:
            raise Exception("Invalid fat or SNF values detected in the image.")

        if min_fat > max_fat or min_snf > max_snf:
            raise Exception("Invalid range values detected in the image.")

        # Validate the data structure
        for rate in rate_list_for_api:
            if not all(key in rate for key in ["fat", "snf", "rate"]):
                raise Exception("Invalid rate data structure detected.")
            if (
                not isinstance(rate["fat"], (int, float))
                or not isinstance(rate["snf"], (int, float))
                or not isinstance(rate["rate"], (int, float))
            ):
                raise Exception("Invalid data types in rate entries.")

        logger.info(
            f"Data structure validation passed for {len(rate_list_for_api)} entries"
        )

        # Update task state
        self.update_state(
            state="PROGRESS", meta={"status": "Saving to database...", "progress": 90}
        )

        # Update database
        existing_rate_list = (
            db.query(RateList).filter(RateList.buyer_mobile == buyer_mobile).first()
        )
        if existing_rate_list:
            if existing_rate_list.is_deleted == 1:
                existing_rate_list.is_deleted = 0
            existing_rate_list.rates = rate_list_for_api
            existing_rate_list.min_fat = min_fat
            existing_rate_list.max_fat = max_fat
            existing_rate_list.min_snf = min_snf
            existing_rate_list.max_snf = max_snf
            existing_rate_list.status = "complete"
            db.commit()
            db.refresh(existing_rate_list)
            logger.info(f"Updated existing rate list for buyer: {buyer_mobile}")
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
            logger.info(f"Created new rate list for buyer: {buyer_mobile}")

        logger.info(
            f"Background processing completed successfully for buyer: {buyer_mobile}"
        )

        # Update task state to SUCCESS
        self.update_state(
            state="SUCCESS",
            meta={
                "status": "Processing completed successfully",
                "progress": 100,
                "result": {
                    "buyer_mobile": buyer_mobile,
                    "entries_processed": len(rate_list_for_api),
                    "fat_range": f"{min_fat}-{max_fat}",
                    "snf_range": f"{min_snf}-{max_snf}",
                },
            },
        )

        return {
            "status": "success",
            "buyer_mobile": buyer_mobile,
            "entries_processed": len(rate_list_for_api),
            "fat_range": f"{min_fat}-{max_fat}",
            "snf_range": f"{min_snf}-{max_snf}",
        }

    except Exception as e:
        logger.error(f"Background processing failed: {e}")

        # Set status to failed in database
        if db:
            try:
                existing_rate_list = (
                    db.query(RateList)
                    .filter(RateList.buyer_mobile == buyer_mobile)
                    .first()
                )
                if existing_rate_list:
                    existing_rate_list.status = "failed"
                    db.commit()
            except Exception as db_error:
                logger.error(f"Failed to update database status: {db_error}")

        # Update task state to FAILURE
        self.update_state(
            state="FAILURE", meta={"status": "Processing failed", "error": str(e)}
        )

        return {"status": "error", "error": str(e), "buyer_mobile": buyer_mobile}

    finally:
        # Clean up database session
        if db:
            try:
                db.close()
            except Exception as e:
                logger.error(f"Error closing database session: {e}")

        # Clean up temporary file
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Cleaned up temporary file: {file_path}")
            except OSError as e:
                logger.error(f"Failed to remove temporary file {file_path}: {e}")
