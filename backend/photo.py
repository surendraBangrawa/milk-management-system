import pytesseract
from PIL import Image
import pandas as pd
import re

def process_image(image_path):
    # Open the image using Pillow
    img = Image.open("D:/OneDrive - Decimal Point Analytics Pvt. Ltd/Pictures/Screenshots/photo2.png")

    # Extract text from the image using pytesseract
    extracted_text = pytesseract.image_to_string(img)

    # Split the extracted text into lines
    lines = extracted_text.split('\n')

    # Define the columns for the table
    columns = ['Fat/SNF', '8.1', '8.2', '8.3', '8.4', '8.5', '8.6', '8.7', '8.8', '8.9', '9', '9.1', '9.2', '9.3']

    # Process the lines and extract data
    data_fixed = []
    current_row = []

    for line in lines:
        # Use regular expressions to capture numeric values
        row = re.findall(r'\d+\.\d+|\d+', line.strip())
        
        if row:
            current_row.extend(row)
            if len(current_row) >= 14:  # If we reach a full row (14 values)
                data_fixed.append(current_row)
                current_row = []  # Reset for the next row

    # Create a DataFrame from the extracted data
    df = pd.DataFrame(data_fixed, columns=columns)

    # Display the dataframe as HTML to the user
    html_output = df.to_html()  # Convert dataframe to HTML

    # Save the HTML to a file
    with open("output_table.html", "w") as f:
        f.write(html_output)

    print("Data has been saved to 'output_table.html'.")

# Example usage: Upload an image and process it
# Replace 'your_image_path.png' with the path of the uploaded image
process_image('your_image_path.png')
