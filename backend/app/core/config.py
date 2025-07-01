import os
import pytz
from dotenv import load_dotenv

load_dotenv()

TIME_ZONE = os.getenv("TZ", "Asia/Kolkata")
try:
    local_timezone = pytz.timezone(TIME_ZONE)
except pytz.UnknownTimeZoneError:
    print(f"Warning: Unknown timezone '{TIME_ZONE}'. Defaulting to 'Asia/Kolkata'.")
    TIME_ZONE = "Asia/Kolkata"
    local_timezone = pytz.timezone(TIME_ZONE)


# Security Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is required and must be set.")

ALGORITHM = os.getenv("ALGORITHM", "HS256")

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

# Database Configuration
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")

# Validate required database configuration
if not all([DB_USER, DB_PASSWORD, DB_HOST, DB_NAME, DB_PORT]):
    raise ValueError(
        "All database environment variables (DB_USER, DB_PASSWORD, DB_HOST, DB_NAME, DB_PORT) are required."
    )

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Only print non-sensitive debug information
print(f"DEBUG: TIME_ZONE = {TIME_ZONE}")
print(f"DEBUG: Database configured for {DB_HOST}:{DB_PORT}/{DB_NAME}")


class Settings:
    SECRET_KEY = SECRET_KEY
    ALGORITHM = ALGORITHM
    ACCESS_TOKEN_EXPIRE_MINUTES = ACCESS_TOKEN_EXPIRE_MINUTES
    GEMINI_API_KEY = GEMINI_API_KEY
    DB_USER = DB_USER
    DB_PASSWORD = DB_PASSWORD
    DB_HOST = DB_HOST
    DB_NAME = DB_NAME
    DB_PORT = DB_PORT
    DATABASE_URL = DATABASE_URL
    TIME_ZONE = TIME_ZONE
    local_timezone = local_timezone
    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:8081,http://localhost:19006",
    ).split(",")


settings = Settings()
