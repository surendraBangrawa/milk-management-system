import os
import pytz
from dotenv import load_dotenv, find_dotenv


APP_ENV = os.getenv("APP_ENV", "dev").lower()

dotenv_file = find_dotenv(f".env.{APP_ENV}")

if not dotenv_file:
    dotenv_file = find_dotenv(".env")
    if dotenv_file:
        print(
            f"Warning: Specific environment file '.env.{APP_ENV}' not found. Loading generic '.env'."
        )
    else:
        print(
            "Warning: No .env file found. Loading configuration from environment variables only."
        )

# Load environment variables from the determined .env file (if found)
if dotenv_file:
    load_dotenv(dotenv_path=dotenv_file)
    print(f"Loaded environment variables from: {dotenv_file}")
else:
    # If no .env file was found, load from the system environment
    load_dotenv()  # This call without path loads from the actual environment


# --- Configuration Variables (Loaded from Environment) ---

# Timezone Configuration
TIME_ZONE = os.getenv("TZ", "Asia/Kolkata")
try:
    local_timezone = pytz.timezone(TIME_ZONE)
except pytz.UnknownTimeZoneError:
    print(f"Warning: Unknown timezone '{TIME_ZONE}'. Defaulting to 'Asia/Kolkata'.")
    TIME_ZONE = "Asia/Kolkata"  # Fallback to a known timezone
    local_timezone = pytz.timezone(TIME_ZONE)  # Set the timezone object


# Security Configuration
# Get the JWT secret key from the environment variable "SECRET_KEY"
# Provide a default value, but strongly recommend setting this in your .env file for security
SECRET_KEY = os.getenv(
    "SECRET_KEY", "your_default_secret_key"
)  # !! CHANGE THIS IN PRODUCTION !!
if SECRET_KEY == "your_default_secret_key":
    print(
        "Warning: SECRET_KEY is using the default value. Set SECRET_KEY in your .env file for security."
    )


# Get the JWT algorithm from the environment variable "ALGORITHM"
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Get the access token expiration minutes from the environment variable "ACCESS_TOKEN_EXPIRE_MINUTES"
# Convert the value to an integer, default to 30 minutes
# Use a try-except block in case the environment variable is not a valid integer
try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
except ValueError:
    print(
        "Warning: ACCESS_TOKEN_EXPIRE_MINUTES is not a valid integer. Defaulting to 30."
    )
    ACCESS_TOKEN_EXPIRE_MINUTES = 30


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY is not set. AI features may not work.")

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
