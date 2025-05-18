import os
import pytz

TIME_ZONE = os.getenv("TZ", "Asia/Kolkata")
try:
    local_timezone = pytz.timezone(TIME_ZONE)
except pytz.UnknownTimeZoneError:
    print(f"Warning: Unknown timezone '{TIME_ZONE}'. Defaulting to 'Asia/Kolkata'.")
    TIME_ZONE = "Asia/Kolkata"
    local_timezone = pytz.timezone(TIME_ZONE)

SECRET_KEY = os.getenv("SECRET_KEY", "your_default_secret_key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
