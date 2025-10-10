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

# PostgreSQL Configuration
DATABASE_URL = os.getenv("DATABASE_URL")

# Fallback to individual components if DATABASE_URL not provided
if not DATABASE_URL:
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST")
    DB_NAME = os.getenv("DB_NAME")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"DEBUG: TIME_ZONE = {TIME_ZONE}")
print(f"DEBUG: SECRET_KEY = {SECRET_KEY}")
print(f"DEBUG: GEMINI_API_KEY = {GEMINI_API_KEY}")
print(f"DEBUG: DB_USER = {DB_USER}")
print(f"DEBUG: DATABASE_URL = {DATABASE_URL}")

# Razorpay Configuration
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")
RAZORPAY_CALLBACK_URL = os.getenv("RAZORPAY_CALLBACK_URL")

if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
    print("Warning: Razorpay keys not configured. Payment features will not work.")

if not RAZORPAY_WEBHOOK_SECRET:
    print(
        "Warning: Razorpay webhook secret not configured. Webhook verification will fail."
    )

# Redis Configuration for Celery
REDIS_URL = os.getenv("REDIS_URL")

# Fallback to individual components if REDIS_URL not provided
if not REDIS_URL:
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB = int(os.getenv("REDIS_DB", "0"))
    REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

# Celery Configuration
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TIMEZONE = TIME_ZONE
CELERY_ENABLE_UTC = True
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60  # 25 minutes
