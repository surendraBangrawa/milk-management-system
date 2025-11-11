import os
import tempfile

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import (
    User,
    RateList,
    RateListUploadHistory,
)
from app.core.security import (
    get_current_user,
)
from app.schemas.ratelist import (
    RateListRequest,
)
from app.services.subscription_service import can_upload_ratelist
from app.tasks.ratelist_tasks import inngest
from inngest import Event

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
            .filter(User.mobile == buyer_mobile, User.is_deleted.is_(False))
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


@router.post("/upload_image")
async def upload_rate_list_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
):
    """
    API endpoint to receive an uploaded image file containing a rate list,
    process it asynchronously using Inngest, and store the rate list in the database.
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

        # Save file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            file_path = tmp_file.name

        # Create upload history record
        upload_history = RateListUploadHistory(
            buyer_mobile=buyer_mobile,
            filename=file.filename,
            file_size=len(content),
            status="processing",
        )
        db.add(upload_history)
        db.commit()
        db.refresh(upload_history)

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

        # Send event to Inngest for background processing
        event = Event(
            name="image.uploaded",
            data={
                "file_path": file_path,
                "buyer_mobile": buyer_mobile,
                "original_filename": file.filename,
            },
        )

        logger.info(f"Sending Inngest event: {event.name} with data: {event.data}")
        await inngest.send(event)

        logger.info(f"Started Inngest processing for buyer: {buyer_mobile}")

        return JSONResponse(
            status_code=202,
            content={
                "message": "Upload received. Processing in background.",
                "status": "processing",
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
async def get_task_status(
    task_id: str,
    buyer_mobile: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Legacy endpoint for backward compatibility.
    Now uses database status instead of Celery task ID.
    """
    # Just redirect to upload_status since we don't use task IDs anymore
    rate_list = db.query(RateList).filter(RateList.buyer_mobile == buyer_mobile).first()
    if not rate_list:
        return {
            "state": "FAILURE",
            "status": "No rate list found",
            "error": "Not found",
        }

    # Map database status to Celery-like response for compatibility
    status_mapping = {
        "processing": {
            "state": "PROGRESS",
            "status": "Processing image...",
            "progress": 50,
        },
        "complete": {
            "state": "SUCCESS",
            "status": "Task completed successfully",
            "progress": 100,
        },
        "failed": {
            "state": "FAILURE",
            "status": "Task failed",
            "error": "Processing failed",
        },
    }

    return status_mapping.get(
        rate_list.status, {"state": "PENDING", "status": "Unknown status"}
    )


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
            .filter(
                RateList.buyer_mobile == buyer_mobile, RateList.is_deleted.is_(False)
            )
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
            .filter(
                RateList.buyer_mobile == buyer_mobile, RateList.is_deleted.is_(False)
            )
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
            .filter(
                RateList.buyer_mobile == buyer_mobile, RateList.is_deleted.is_(False)
            )
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


@router.get("/upload_history")
def get_upload_history(
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
):
    """
    Get upload history for the current user.
    """
    try:
        logger.info(f"Getting upload history for buyer: {buyer_mobile}")

        # Get upload history ordered by most recent first
        upload_history = (
            db.query(RateListUploadHistory)
            .filter(
                RateListUploadHistory.buyer_mobile == buyer_mobile,
                RateListUploadHistory.is_deleted.is_(False),
            )
            .order_by(RateListUploadHistory.created_at.desc())
            .all()
        )

        # Convert to response format
        history_data = []
        for upload in upload_history:
            history_data.append(
                {
                    "id": upload.id,
                    "filename": upload.filename,
                    "file_size": upload.file_size,
                    "status": upload.status,
                    "error_message": upload.error_message,
                    "entries_processed": upload.entries_processed,
                    "processing_time_seconds": upload.processing_time_seconds,
                    "created_at": (
                        upload.created_at.isoformat() if upload.created_at else None
                    ),
                    "completed_at": (
                        upload.completed_at.isoformat() if upload.completed_at else None
                    ),
                }
            )

        return {
            "upload_history": history_data,
            "total_uploads": len(history_data),
        }

    except Exception as e:
        logger.error(f"Error getting upload history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get upload history")
