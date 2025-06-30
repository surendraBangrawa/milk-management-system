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
            if existing_rate_list.is_deleted == 1:
                existing_rate_list.is_deleted = 0

            # Update the existing rate list with new rates
            existing_rate_list.rates = rates_for_db  # Assign the list of dicts
            existing_rate_list.min_fat = record.min_fat
            existing_rate_list.max_fat = record.max_fat
            existing_rate_list.min_snf = record.min_snf
            existing_rate_list.max_snf = record.max_snf

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
    process it to extract data, and store the rate list in the database.
    """
    # Define file_path outside try block so it's accessible in except blocks
    file_path = None
    try:
        logger.info(f"In upload_rate_list_image endpoint for buyer: {buyer_mobile}")
        logger.info(
            f"File received: filename='{file.filename}', content_type='{file.content_type}'"
        )

        if not file.content_type or not file.content_type.startswith("image/"):
            logger.warning(f"Invalid file type uploaded: {file.content_type}")
            raise HTTPException(
                status_code=400, detail="Invalid file type. Only images are allowed."
            )

        # Save the uploaded file temporarily
        upload_folder = "temp_uploads"  # Consider making this configurable
        os.makedirs(upload_folder, exist_ok=True)
        file_extension = (
            os.path.splitext(file.filename)[1] or ".tmp"
        )  # Handle missing extension
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        new_filename = f"{timestamp}{file_extension}"
        file_path = os.path.join(upload_folder, new_filename)

        logger.info(f"Attempting to save file to: {file_path}")
        # Use async file writing for better performance with large files
        # Requires aiofiles: pip install aiofiles
        # async with aiofiles.open(file_path, 'wb') as buffer:
        #     while content := await file.read(1024): # Read in chunks
        #         await buffer.write(content)
        # For simplicity using sync shutil.copyfileobj for now:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info(f"File successfully saved to: {file_path}")

        # Process the image to extract text
        logger.info("Attempting to extract text from image via API...")
        extracted_text = get_text_from_image_via_api(file_path)
        logger.info(
            f"Text extraction completed. Extracted text length: {len(extracted_text) if extracted_text else 0}"
        )

        if (
            not extracted_text or len(extracted_text.strip()) < 250
        ):  # Example: Check for minimal extracted text
            logger.warning("Insufficient text extracted from image.")
            # File cleanup is handled in the finally block or outer except
            raise HTTPException(
                status_code=400,
                detail="Failed to extract sufficient text from the image. Please upload a clearer, higher quality image.",
            )

        logger.info(f"Text extracted: {extracted_text[:200]}...")

        # Parse the extracted text into a DataFrame
        logger.info("Attempting to parse extracted text into DataFrame...")
        success, extracted_df = parse_extracted_text_to_dataframe(extracted_text)
        logger.info(
            f"DataFrame parsing completed. Success: {success}, DataFrame empty: {extracted_df.empty}"
        )

        if not success or extracted_df.empty:
            logger.warning("Failed to parse data or DataFrame is empty after parsing.")
            # File cleanup is handled in the finally block or outer except
            raise HTTPException(
                status_code=400, detail="Failed to parse data from the extracted text."
            )

        logger.info(
            f"DataFrame created successfully:\n{extracted_df.head().to_string()}"
        )

        # Convert DataFrame to list of RateData Pydantic models
        rate_list_for_api: List[RateData] = []
        # Assuming SNF columns are numeric and represent SNF values
        snf_columns = [
            col
            for col in extracted_df.columns
            if re.match(r"^\d+(\.\d+)?$", str(col))  # More robust regex for numbers
        ]

        for index, row in extracted_df.iterrows():
            # Assuming the first column is 'Fat/SNF' or similar and contains the Fat value
            # You might need more robust logic here if the column name varies
            fat_col_name = extracted_df.columns[0]  # Assuming first column is FAT
            fat_snf_value = row.get(fat_col_name)

            if fat_snf_value is None:
                logger.warning(
                    f"Skipping row {index}: FAT column '{fat_col_name}' not found."
                )
                continue

            try:
                fat_value = float(fat_snf_value)
            except (ValueError, TypeError):
                logger.warning(
                    f"Skipping row {index}: Could not parse FAT value from '{fat_snf_value}'."
                )
                continue

            for snf_col in snf_columns:
                rate_value = row.get(snf_col)
                if rate_value is None:
                    logger.warning(
                        f"Skipping SNF column '{snf_col}' for FAT '{fat_value}': Rate value not found."
                    )
                    continue

                try:
                    snf_value = float(snf_col)
                    if pd.notna(rate_value):
                        rate_list_for_api.append(
                            RateData(
                                fat=fat_value, snf=snf_value, rate=float(rate_value)
                            )
                        )
                except (ValueError, TypeError):
                    logger.warning(
                        f"Skipping SNF column '{snf_col}' for FAT '{fat_value}': Could not parse SNF or Rate value '{rate_value}'."
                    )

        if not rate_list_for_api:
            logger.warning("No valid rate data extracted and parsed from the image.")
            # File cleanup is handled in the finally block or outer except
            raise HTTPException(
                status_code=400,
                detail="No valid rate data could be extracted and parsed from the image.",
            )

        # Convert list of Pydantic models to list of dicts for database storage
        rates_for_db = [rate.model_dump() for rate in rate_list_for_api]

        # Check if a RateList entry exists for the buyer
        existing_rate_list = (
            db.query(RateList).filter(RateList.buyer_mobile == buyer_mobile).first()
        )

        if existing_rate_list:
            # If the rate list is deleted, reactivate it
            if existing_rate_list.is_deleted == 1:
                existing_rate_list.is_deleted = 0

            # Update the existing RateList entry
            existing_rate_list.rates = rates_for_db
            db.commit()
            db.refresh(existing_rate_list)
            logger.info(f"Rate list updated for buyer: {buyer_mobile}")
        else:
            # Create a new RateList entry
            new_rate_list = RateList(buyer_mobile=buyer_mobile, rates=rates_for_db)
            db.add(new_rate_list)
            db.commit()
            db.refresh(new_rate_list)
            logger.info(f"Rate list created for buyer: {buyer_mobile}")

        logger.info("--- Upload and processing completed successfully ---")
        return JSONResponse(
            status_code=200,
            content={"message": "Rate list uploaded and stored successfully"},
        )

    except HTTPException as http_exc:
        logger.error(
            f"--- HTTP Exception in upload_rate_list_image: {http_exc.status_code} - {http_exc.detail} ---"
        )
        # Re-raise HTTPExceptions directly
        raise http_exc

    except Exception as e:
        logger.error(
            f"--- An unexpected error occurred in upload_rate_list_image: {e} ---",
            exc_info=True,
        )
        if db:  # Check if db session exists before rollback
            db.rollback()
        # Raise a generic 500 error to the client
        raise HTTPException(
            status_code=500,
            detail=f"An internal server error occurred during processing.",
        )
    finally:
        # Ensure temporary file is cleaned up in all cases
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Temporary file cleaned up: {file_path}")
            except OSError as e:
                logger.error(f"Error removing temporary file {file_path}: {e}")


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

        rate_list_record.is_deleted = 1  # Soft delete
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
            raise HTTPException(status_code=404, detail="Rate List not found")

        return {"rates": rate_list.rates}

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

        # Cap snf and fat at their maximum values
        snf = min(snf, rate_list.max_snf)  # Cap SNF to max_snf
        fat = min(fat, rate_list.max_fat)  # Cap Fat to max_fat

        logger.info(f"Looking for rate with Fat: {fat}, SNF: {snf}")

        # First, check for an exact match in the rate list
        matching_rate = None
        snf_diff = None

        if fat >= rate_list.min_fat and snf >= rate_list.min_snf:
            for rate in rate_list.rates:
                if rate["fat"] == fat and rate["snf"] == snf:
                    matching_rate = rate["rate"]  # Exact match found, apply fat
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
        # Handle raised HTTPException and include exception details in the response
        logger.error(f"HTTPException: {e.detail}")
        raise HTTPException(status_code=e.status_code, detail=e.detail)

    except Exception as e:
        # Log the error and raise a generic error
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


def calculate_snf_diff(rate_list, fat_value):
    """
    Calculate the average rate difference for SNF changes at a given fat value.
    Handles edge cases and prevents division by zero.
    """
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
                # Calculate SNF difference
                snf_diff = abs(
                    rate_list.rates[i]["snf"] - rate_list.rates[i - 1]["snf"]
                )

                # Only add if SNF difference is not zero to avoid division by zero
                if snf_diff > 0:
                    rate_diffs.append(rate_diff / snf_diff)

    # Calculate the average of rate_diff if any differences exist
    if rate_diffs:
        average_rate_diff = sum(rate_diffs) / len(rate_diffs)
    else:
        # Default fallback if no valid differences found
        average_rate_diff = 0.1  # Default small value

    return average_rate_diff
