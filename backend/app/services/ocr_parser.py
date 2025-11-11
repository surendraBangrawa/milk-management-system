import pandas as pd
import re
import io
import os
from typing import List, Tuple
from pydantic import BaseModel
import logging
from app.core.config import GEMINI_API_KEY

logger = logging.getLogger(__name__)


class RateData(BaseModel):
    fat: float
    snf: float
    rate: float


class RateListRequest(BaseModel):
    rates: List[RateData]


def get_text_from_image_via_api(image_path):
    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash")
    try:
        with open(image_path, "rb") as f:
            image_bytes = f.read()

        image_part = {
            "mime_type": "image/jpeg",
            "data": image_bytes,
        }

        # Improved prompt for better text extraction
        prompt_parts = [
            """Extract ALL text from this image. This appears to be a rate list or data table. 
            Please extract:
            1. All numbers (rates, quantities, percentages)
            2. All text labels and headers
            3. All table data in a structured format
            4. Any additional text visible in the image
            
            Format the output as a clear table with columns and rows.
            If you see any milk-related data, fat percentages, SNF values, or rate information, include all of it.
            Be thorough and extract everything you can see.""",
            image_part,
        ]

        response = model.generate_content(prompt_parts)
        extracted_text = response.text

        logger.info(f"OCR extracted text length: {len(extracted_text)}")
        logger.info(f"OCR extracted text preview: {extracted_text[:200]}...")

        return extracted_text

    except Exception as e:
        logger.error(f"Error during OCR extraction: {e}")
        return None


# --- Function to parse the extracted text into a DataFrame with dynamic columns ---
def parse_extracted_text_to_dataframe(
    extracted_text: str | None,
) -> Tuple[bool, pd.DataFrame]:
    """
    Parses the extracted text content into a pandas DataFrame, dynamically identifying columns
    from the first table row and subsequent rows as data.

    Args:
        extracted_text (str | None): The text content extracted from the image.

    Returns:
        tuple[bool, pandas.DataFrame]: A tuple containing:
            - bool: True if parsing was successful and data rows were found, False otherwise.
            - pandas.DataFrame: A DataFrame containing the table data, or an empty DataFrame if parsing fails or no data is found.
    """
    if not extracted_text:
        logger.warning("No text provided for parsing.")
        return False, pd.DataFrame()

    lines = extracted_text.strip().split("\n")
    columns = []
    data_rows = []
    # Regex to match numbers (integers or floats) - useful for data validation
    numeric_pattern = re.compile(r"^-?\d+(\.\d+)?$")
    header_found = False
    separator_found = False  # Track if the separator line is found

    logger.info("Starting text parsing into DataFrame...")
    logger.debug(f"Parsing text:\n{extracted_text}")

    for line in lines:
        cleaned_line = line.strip()
        if not cleaned_line:
            logger.debug("Skipping empty line.")
            continue  # Skip empty lines

        # Identify the header row - look for a line starting with '|' and containing 'fat/sn' case-insensitively
        if (
            not header_found
            and cleaned_line.startswith("|")
            and re.search(r"fat/sn", cleaned_line, re.IGNORECASE)
        ):
            header_found = True
            # Extract column headers by splitting the line by '|' and cleaning
            raw_columns = [h.strip() for h in cleaned_line.split("|") if h.strip()]
            columns = raw_columns
            logger.info(f"Dynamically identified columns: {columns}")
            continue  # Move to the next line

        # Identify the separator line - look for a line starting with '|' and containing only '-' or ':' within '|'
        if (
            header_found
            and not separator_found
            and cleaned_line.startswith("|")
            and all(
                re.match(r"^[-:]*$", part.strip())
                for part in cleaned_line.split("|")
                if part.strip()
            )
        ):
            separator_found = True
            logger.debug("Identified separator line.")
            continue  # Skip the separator line

        # Process data rows - assuming they start with '|' and we've found the header
        if header_found and cleaned_line.startswith("|"):
            # Split the data row by '|' and clean up the values
            row_values = [v.strip() for v in cleaned_line.split("|") if v.strip()]

            # Basic validation: Check if the number of values matches the number of columns
            if columns and len(row_values) == len(columns):
                data_rows.append(row_values)
                logger.debug(f"Added data row: {row_values}")
            elif columns:
                logger.warning(
                    f"Skipping row due to column mismatch. Expected {len(columns)} values, got {len(row_values)}: {cleaned_line}"
                )
            # If no columns are identified yet, we can't parse data rows reliably, so skip

    success = False
    df = pd.DataFrame()  # Initialize with empty DataFrame

    # Create DataFrame only if we found columns AND data rows
    if data_rows and columns:
        try:
            df = pd.DataFrame(data_rows, columns=columns)
            success = True
            logger.info("DataFrame created successfully.")
            logger.debug(f"Created DataFrame head:\n{df.head().to_string()}")
        except Exception as e:
            # Use logger.error for errors during DataFrame creation
            logger.error(f"Error creating DataFrame: {e}", exc_info=True)
            success = False
            df = pd.DataFrame(columns=columns)  # Return empty DF with columns on error

    elif not columns:
        logger.warning("No columns identified from the extracted text.")
        success = False  # Parsing considered unsuccessful without headers

    else:  # columns found, but no data_rows
        logger.info("No data rows identified in the extracted text after processing.")
        success = False  # No data found

    logger.info(
        f"DataFrame parsing finished. Success: {success}, DataFrame empty: {df.empty}"
    )
    return success, df
