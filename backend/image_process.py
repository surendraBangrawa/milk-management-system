import pandas as pd
import re
import io
import os
from typing import List
from pydantic import BaseModel


class RateData(BaseModel):
    fat: float
    snf: float
    rate: float


class RateListRequest(BaseModel):
    rates: List[RateData]  # A list of RateData objects


def get_text_from_image_via_api(image_path):
    import google.generativeai as genai
    genai.configure(api_key="AIzaSyC1vxRQ97DGnZ7XtiEJOvZSLmQosOlpOjs")
    model = genai.GenerativeModel('gemini-2.0-flash') # Or another suitable model
    try:
        # Read the image file
        with open(image_path, 'rb') as f:
            image_bytes = f.read()

        # Create a Generative Part from the image bytes
        image_part = {'mime_type': 'image/jpeg', 'data': image_bytes} # Adjust mime_type if needed

        # Send the image to the model with a prompt
        # The prompt can guide the model to extract table data
        prompt_parts = [
            "Extract the data from the image, ensuring the output is clearly formatted as a table with rows and columns.",
            image_part
        ]
        response = model.generate_content(prompt_parts)

        # Return the extracted text
        return response.text

    except Exception as e:
        print(f"Error during simulated API call: {e}")
        return None
    return simulated_extracted_text


# --- Function to parse the extracted text into a DataFrame with dynamic columns ---
def parse_extracted_text_to_dataframe(extracted_text):
    """
    Parses the extracted text content into a pandas DataFrame, dynamically identifying columns
    from the first table row and subsequent rows as data.

    Args:
        extracted_text (str): The text content extracted from the image.

    Returns:
        pandas.DataFrame: A DataFrame containing the table data, or an empty DataFrame if parsing fails.
    """
    if not extracted_text:
        print("No text provided for parsing.")
        return pd.DataFrame()

    lines = extracted_text.strip().split('\n')
    columns = []
    data_rows = []
    numeric_pattern = re.compile(r'\d+\.\d+|\d+')
    data_start = False

    for line in lines:
        cleaned_line = line.strip()
        if not cleaned_line:
            continue

        if not data_start and cleaned_line.startswith("| Fat/SNF |"):
            data_start = True
            # Extract column headers by splitting the first line by '|' and cleaning
            raw_columns = [h.strip() for h in cleaned_line.split('|') if h.strip()]
            columns = raw_columns
            print(f"Dynamically identified columns: {columns}")
            continue  # Move to the next line to process data

        if data_start and cleaned_line.startswith("|"):
            # Split the data row by '|' and clean up the values
            row_values = [v.strip() for v in cleaned_line.split('|') if v.strip()]
            if columns and len(row_values) == len(columns):
                data_rows.append(row_values)
            elif columns and row_values:
                # If the number of values doesn't match columns, try to extract numeric values
                numeric_data = [val for val in row_values if numeric_pattern.match(val)]
                if numeric_data:
                    padded_row = numeric_data + [None] * (len(columns) - len(numeric_data))
                    data_rows.append(padded_row[:len(columns)])
            elif not columns and row_values:
                # If no headers are found yet but we have data
                numeric_data = [val for val in row_values if numeric_pattern.match(val)]
                if numeric_data:
                    data_rows.append(numeric_data)

    success = False
    if data_rows:
        success = True
        df = pd.DataFrame(data_rows, columns=columns if columns else [f"Column_{i+1}" for i in range(len(data_rows[0]))])
    else:
        df = pd.DataFrame(columns=columns)
        print("Warning: No data rows identified in the extracted text.")

    return success, df


