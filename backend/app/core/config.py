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
SECRET_KEY = os.getenv("SECRET_KEY", "your_default_secret_key")
if SECRET_KEY == "your_default_secret_key":
    print(
        "Warning: SECRET_KEY is using the default value. Set SECRET_KEY in your .env file for security."
    )


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

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"DEBUG: TIME_ZONE = {TIME_ZONE}")
print(f"DEBUG: SECRET_KEY = {SECRET_KEY}")
print(f"DEBUG: GEMINI_API_KEY = {GEMINI_API_KEY}")
print(f"DEBUG: DB_USER = {DB_USER}")
print(f"DEBUG: DATABASE_URL = {DATABASE_URL}")
