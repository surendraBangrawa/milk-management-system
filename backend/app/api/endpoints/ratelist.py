import os
import shutil
import re
import pandas as pd
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import (
    User,
    RateList,
)
from app.core.security import (
    get_current_user,
)
from app.schemas.ratelist import (
    RateData,
    RateListRequest,
)
from app.services.ocr_parser import (
    get_text_from_image_via_api,
    parse_extracted_text_to_dataframe,
)
from app.tasks.ratelist_tasks import process_rate_list_image_task
from app.services.subscription_service import can_upload_ratelist

import logging

logger = logging.getLogger(__name__)  # Use __name__ for module-specific logging

router = APIRouter(
    prefix="/ratelist",  # Optional: Add a common prefix for all routes in this file
    tags=["ratelist"],  # Optional: Group these endpoints in the OpenAPI docs
)


@router.post("/store")  # Changed path slightly to fit prefix pattern if used
def store_rate_list(
    record: RateListRequest,
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
):
    """
    API endpoint to store a rate list provided in the request body.
    """
    try:
        logger.info(f"In store_rate_list endpoint for buyer: {buyer_mobile}")

        # Enforce ratelist upload limit
        if not can_upload_ratelist(db, buyer_mobile):
            raise HTTPException(
                status_code=403,
                detail="Rate list upload limit reached for your subscription plan. You can upload up to 3 rate lists on the free plan. Upgrade to upload unlimited rate lists.",
            )

        # Validate user existence (can potentially be part of get_current_user dependency)
        get_user = (
            db.query(User)
            .filter(User.mobile == buyer_mobile, User.is_deleted == 0)
            .first()
        )

        if not get_user:
            logger.warning(f"User not found for mobile: {buyer_mobile}")
            raise HTTPException(status_code=404, detail="User not found")

        # Check if the buyer already has an entry
        existing_rate_list = (
            db.query(RateList).filter(RateList.buyer_mobile == buyer_mobile).first()
        )

        # Convert Pydantic models to dicts for database storage
        rates_for_db = [
            rate.model_dump() for rate in record.rates
        ]  # Use model_dump for Pydantic v2+

        if existing_rate_list:
            # If the rate list is deleted, reactivate it
            if bool(existing_rate_list.is_deleted):
                setattr(existing_rate_list, "is_deleted", False)

            # Update the existing rate list with new rates
            setattr(existing_rate_list, "rates", rates_for_db)
            setattr(existing_rate_list, "min_fat", record.min_fat)
            setattr(existing_rate_list, "max_fat", record.max_fat)
            setattr(existing_rate_list, "min_snf", record.min_snf)
            setattr(existing_rate_list, "max_snf", record.max_snf)

            db.commit()
            db.refresh(existing_rate_list)
            logger.info(f"Rate list updated for buyer: {buyer_mobile}")

            return {"message": "Rate list updated successfully"}

        # Create new RateList entry
        new_rate_list = RateList(
            buyer_mobile=buyer_mobile,
            rates=rates_for_db,  # Assign the list of dicts
            min_fat=record.min_fat,
            max_fat=record.max_fat,
            min_snf=record.min_snf,
            max_snf=record.max_snf,
        )

        # Add new rate list to the database
        db.add(new_rate_list)
        db.commit()
        db.refresh(new_rate_list)
        logger.info(f"Rate list created for buyer: {buyer_mobile}")

        return {"message": "Rate list added successfully"}

    except HTTPException as http_exc:
        # Re-raise HTTPExceptions directly
        raise http_exc
    except Exception as e:
        logger.error(
            f"An unexpected error occurred in store_rate_list: {e}", exc_info=True
        )
        if db:  # Check if db session exists before rollback
            db.rollback()
        raise HTTPException(
            status_code=500, detail=f"An internal server error occurred."
        )


# Background processing function
async def process_rate_list_image(file_path, db, buyer_mobile):
    try:
        import pandas as pd
        import re
        import os
        import logging

        logger = logging.getLogger(__name__)
        logger.info(f"Starting background processing for buyer: {buyer_mobile}")

        # Process the image to extract text
        extracted_text = get_text_from_image_via_api(file_path)
        if not extracted_text or len(extracted_text.strip()) < 250:
            raise Exception("Failed to extract sufficient text from the image.")

        logger.info(f"Text extracted successfully, length: {len(extracted_text)}")

        success, extracted_df = parse_extracted_text_to_dataframe(extracted_text)
        if not success or extracted_df.empty:
            raise Exception("Failed to parse data from the extracted text.")

        logger.info(f"DataFrame created successfully with {len(extracted_df)} rows")

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
                        rate_entry = RateData(
                            fat=fat_value, snf=snf_value, rate=float(rate_value)
                        )
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

        # Calculate min/max values from the extracted data
        fat_values = [rate.fat for rate in rate_list_for_api]
        snf_values = [rate.snf for rate in rate_list_for_api]

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

        # Convert to database format (list of dicts)
        rates_for_db = [rate.model_dump() for rate in rate_list_for_api]

        # Validate the data structure matches what get_rate expects
        for rate in rates_for_db:
            if not all(key in rate for key in ["fat", "snf", "rate"]):
                raise Exception("Invalid rate data structure detected.")
            if (
                not isinstance(rate["fat"], (int, float))
                or not isinstance(rate["snf"], (int, float))
                or not isinstance(rate["rate"], (int, float))
            ):
                raise Exception("Invalid data types in rate entries.")

        logger.info(f"Data structure validation passed for {len(rates_for_db)} entries")

        existing_rate_list = (
            db.query(RateList).filter(RateList.buyer_mobile == buyer_mobile).first()
        )
        if existing_rate_list:
            if bool(existing_rate_list.is_deleted):
                setattr(existing_rate_list, "is_deleted", False)
            setattr(existing_rate_list, "rates", rates_for_db)
            setattr(existing_rate_list, "min_fat", min_fat)
            setattr(existing_rate_list, "max_fat", max_fat)
            setattr(existing_rate_list, "min_snf", min_snf)
            setattr(existing_rate_list, "max_snf", max_snf)
            setattr(existing_rate_list, "status", "complete")
            db.commit()
            db.refresh(existing_rate_list)
            logger.info(f"Updated existing rate list for buyer: {buyer_mobile}")
        else:
            new_rate_list = RateList(
                buyer_mobile=buyer_mobile,
                rates=rates_for_db,
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

    except Exception as e:
        # Set status to failed
        existing_rate_list = (
            db.query(RateList).filter(RateList.buyer_mobile == buyer_mobile).first()
        )
        if existing_rate_list:
            existing_rate_list.status = "failed"
            db.commit()
        logger = logging.getLogger(__name__)
        logger.error(f"Background processing failed: {e}")
    finally:
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass


@router.post("/upload_image")
async def upload_rate_list_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
):
    """
    API endpoint to receive an uploaded image file containing a rate list,
    process it asynchronously using Celery, and store the rate list in the database.
    """
    file_path = None
    try:
        logger.info(f"Starting upload for buyer: {buyer_mobile}, file: {file.filename}")

        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400, detail="Invalid file type. Only images are allowed."
            )

        # Enforce ratelist upload limit
        if not can_upload_ratelist(db, buyer_mobile):
            raise HTTPException(
                status_code=403,
                detail="Rate list upload limit reached for your subscription plan. You can upload up to 3 rate lists on the free plan. Upgrade to upload unlimited rate lists.",
            )

        upload_folder = "temp_uploads"
        os.makedirs(upload_folder, exist_ok=True)
        logger.info(f"Created upload folder: {upload_folder}")

        file_extension = os.path.splitext(file.filename)[1] or ".tmp"
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        new_filename = f"{timestamp}{file_extension}"
        file_path = os.path.join(upload_folder, new_filename)

        logger.info(f"Saving file to: {file_path}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info(f"File saved successfully: {file_path}")

        # Set status to processing
        existing_rate_list = (
            db.query(RateList).filter(RateList.buyer_mobile == buyer_mobile).first()
        )
        if existing_rate_list:
            existing_rate_list.status = "processing"
            db.commit()
        else:
            new_rate_list = RateList(
                buyer_mobile=buyer_mobile,
                rates=[],
                min_fat=0,
                max_fat=0,
                min_snf=0,
                max_snf=0,
                status="processing",
            )
            db.add(new_rate_list)
            db.commit()

        # Launch Celery task for background processing
        logger.info(f"Creating Celery task for file: {file_path}")
        task = process_rate_list_image_task.delay(file_path, buyer_mobile)
        logger.info(f"Started Celery task {task.id} for buyer: {buyer_mobile}")

        return JSONResponse(
            status_code=202,
            content={
                "message": "Upload received. Processing in background.",
                "task_id": task.id,
            },
        )
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
        logger.error(f"Error in upload_rate_list_image: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An internal server error occurred during upload: {str(e)}",
        )


@router.get("/upload_status")
def get_upload_status(
    db: Session = Depends(get_db), buyer_mobile: str = Depends(get_current_user)
):
    rate_list = db.query(RateList).filter(RateList.buyer_mobile == buyer_mobile).first()
    if not rate_list:
        raise HTTPException(status_code=404, detail="No rate list found for this user.")
    return {"status": rate_list.status}


@router.get("/task_status/{task_id}")
async def get_task_status(task_id: str):
    """
    Get the status of a Celery task by its ID.
    """
    try:
        from app.celery_app import celery_app

        task_result = celery_app.AsyncResult(task_id)

        if task_result.state == "PENDING":
            response = {"state": task_result.state, "status": "Task is pending..."}
        elif task_result.state == "STARTED":
            response = {
                "state": task_result.state,
                "status": task_result.info.get("status", "Task is running..."),
                "progress": task_result.info.get("progress", 0),
            }
        elif task_result.state == "PROGRESS":
            response = {
                "state": task_result.state,
                "status": task_result.info.get("status", "Task is running..."),
                "progress": task_result.info.get("progress", 0),
            }
        elif task_result.state == "SUCCESS":
            response = {
                "state": task_result.state,
                "status": "Task completed successfully",
                "result": task_result.info.get("result", {}),
            }
        elif task_result.state == "FAILURE":
            response = {
                "state": task_result.state,
                "status": "Task failed",
                "error": task_result.info.get("error", "Unknown error"),
            }
        else:
            response = {"state": task_result.state, "status": "Unknown task state"}

        return response
    except Exception as e:
        logger.error(f"Error getting task status for {task_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get task status")


@router.delete("/delete")  # Changed path slightly to fit prefix pattern if used
def delete_rate_list(
    db: Session = Depends(get_db), buyer_mobile: str = Depends(get_current_user)
):
    """
    API endpoint to soft-delete the rate list for the current buyer.
    """
    try:
        logger.info(f"In delete_rate_list endpoint for buyer: {buyer_mobile}")
        rate_list_record = (
            db.query(RateList)
            .filter(RateList.buyer_mobile == buyer_mobile, RateList.is_deleted == 0)
            .first()
        )

        if not rate_list_record:
            logger.warning(
                f"Rate List not found for buyer: {buyer_mobile} or already deleted."
            )
            raise HTTPException(status_code=404, detail="Rate List not found")

        setattr(rate_list_record, "is_deleted", True)  # Soft delete
        db.commit()
        logger.info(f"Rate list soft-deleted for buyer: {buyer_mobile}")

        return {"message": "Rate list deleted successfully"}
    except HTTPException as http_exc:
        # Re-raise HTTPExceptions directly
        raise http_exc
    except Exception as e:
        logger.error(
            f"An unexpected error occurred in delete_rate_list: {e}", exc_info=True
        )
        # No rollback needed for soft delete unless other DB ops were in same transaction
        raise HTTPException(status_code=500, detail="An internal server error occurred")


@router.get("/get_list")
def show_rate_list(
    db: Session = Depends(get_db), buyer_mobile: str = Depends(get_current_user)
):
    try:
        logger.info(f"In show_rate_list_api")
        rate_list = (
            db.query(RateList)
            .filter(RateList.buyer_mobile == buyer_mobile, RateList.is_deleted == 0)
            .first()
        )
        if not rate_list:
            logger.info(f"No rate list found for buyer: {buyer_mobile}")
            return {"rates": []}
        return {"rates": rate_list.rates}
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/get_rate")
def fetch_rate(
    fat: float,
    snf: float,
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
):
    try:
        logger.info(f"In gate_rate")
        if len(str(fat).split(".")[1]) > 1 or len(str(snf).split(".")[1]) > 1:
            raise HTTPException(
                status_code=400, detail="Fat and SNF must have only 1 decimal place."
            )
        rate_list = (
            db.query(RateList)
            .filter(RateList.buyer_mobile == buyer_mobile, RateList.is_deleted == 0)
            .first()
        )
        if not rate_list:
            raise HTTPException(
                status_code=404,
                detail=f"Rate List not found for buyer_mobile: {buyer_mobile}",
            )
        snf = min(snf, rate_list.max_snf)
        fat = min(fat, rate_list.max_fat)
        logger.info(f"Looking for rate with Fat: {fat}, SNF: {snf}")
        matching_rate = None
        snf_diff = None
        if fat >= rate_list.min_fat and snf >= rate_list.min_snf:
            for rate in rate_list.rates:
                if rate["fat"] == fat and rate["snf"] == snf:
                    matching_rate = rate["rate"]
                    break
        # Step 2: If no exact match is found, apply the adjustment logic
        if not matching_rate:
            # Case 1: fat < min_fat and snf < min_snf
            if fat < rate_list.min_fat and snf < rate_list.min_snf:
                for rate in rate_list.rates:
                    if (
                        rate["fat"] == rate_list.min_fat
                        and rate["snf"] == rate_list.min_snf
                    ):
                        matching_rate = (
                            rate["rate"] / rate_list.min_fat
                        ) * fat  # Rate at (min_fat, min_snf)/min_fat * fat
                        # Calculate snf_diff if needed
                        if snf_diff is None:
                            snf_diff = calculate_snf_diff(rate_list, rate_list.min_fat)
                        rate_diff = (rate_list.min_snf - snf) * 10 * snf_diff
                        matching_rate -= (
                            rate_diff  # Subtract (min_snf - snf)*10 * snf_diff
                        )
                        matching_rate = round(matching_rate, 2)
                        break

            # Case 2: fat < min_fat and snf > min_snf
            elif fat < rate_list.min_fat and snf >= rate_list.min_snf:
                for rate in rate_list.rates:
                    if rate["fat"] == rate_list.min_fat and rate["snf"] == snf:
                        matching_rate = (rate["rate"] / rate_list.min_fat) * fat
                        matching_rate = round(matching_rate, 2)
                        break

            # Case 3: fat > min_fat and snf < min_snf
            elif fat >= rate_list.min_fat and snf < rate_list.min_snf:
                for rate in rate_list.rates:
                    if rate["fat"] == fat and rate["snf"] == rate_list.min_snf:
                        matching_rate = rate["rate"]  # Rate at (fat, min_snf) * fat
                        # Calculate snf_diff if needed
                        print(f"matching rate1 : {matching_rate}")
                        if snf_diff is None:
                            snf_diff = calculate_snf_diff(rate_list, fat)
                        rate_diff = (rate_list.min_snf - snf) * 10 * snf_diff
                        print(rate_diff)
                        matching_rate -= (
                            rate_diff  # Subtract (min_snf - snf)*10 * snf_diff
                        )
                        matching_rate = round(matching_rate, 2)
                        break

        # If no matching rate is found, raise 404 error with detailed message
        if not matching_rate:
            raise HTTPException(
                status_code=404,
                detail=f"Rate for given Fat ({fat}) and SNF ({snf}) is not found",
            )

        return {
            "buyer_mobile": rate_list.buyer_mobile,
            "fat": fat,
            "snf": snf,
            "rate": matching_rate,
        }
    except HTTPException as e:
        logger.error(f"HTTPException: {e.detail}")
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


def calculate_snf_diff(rate_list, fat_value):
    rate_diffs = []  # List to store rate differences

    # Iterate over the rates list
    for i, rate in enumerate(rate_list.rates):
        if rate["fat"] == fat_value:
            # Ensure there's a previous element to compare
            if i > 0 and rate_list.rates[i - 1]["fat"] == fat_value:
                # Calculate the difference between consecutive rate values
                rate_diff = abs(
                    rate_list.rates[i]["rate"] - rate_list.rates[i - 1]["rate"]
                )

                # Add the difference to the rate_diffs list
                rate_diffs.append(rate_diff)

    # Calculate the average of rate_diff if any differences exist
    average_rate_diff = sum(rate_diffs) / len(rate_diffs) if rate_diffs else 0

    return average_rate_diff
