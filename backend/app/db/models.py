from sqlalchemy import (
    Column,
    String,
    DateTime,
    Integer,
    Float,
    Date,
    Enum,
    CheckConstraint,
    Boolean,
    JSON,
)
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum
import pytz
import os

# Note: dotenv is loaded in session.py, but you might load it here too
# if you need env vars specifically for model definitions (like TZ)

# Define Base for ORM models
Base = declarative_base()

# Load time zone from environment variable
time_zone = os.getenv("TZ", "Asia/Kolkata")
local_timezone = pytz.timezone(time_zone)


# Helper function to get the current time in the specified timezone
def local_now():
    """Returns the current time in the configured local timezone."""
    return datetime.now(local_timezone)


# --- Define your SQLAlchemy Models ---


# User Table Schema
class User(Base):
    __tablename__ = "users"

    mobile = Column(String(10), primary_key=True, nullable=False)  # Mobile as PK
    name = Column(String(100), nullable=False)
    referral_code = Column(String(20), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    registered_at = Column(
        DateTime, default=local_now
    )  # Use local_now for timezone-aware timestamp


# Customers Table Schema
class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(Integer, primary_key=True, autoincrement=True)
    mobile = Column(String(10), nullable=False)
    name = Column(String(100), nullable=False)
    added_under = Column(String(255), nullable=False)  # Comma-separated list of sellers
    is_deleted = Column(Boolean, default=False, nullable=False)
    added_at = Column(DateTime, default=local_now)  # Use local_now


class AuthUser(Base):
    __tablename__ = "login_details"

    mobile = Column(String(10), primary_key=True, nullable=False)  # Mobile as PK
    otp = Column(String(6), nullable=False)
    expire_at = Column(DateTime, nullable=False)
    login_at = Column(DateTime, nullable=True)
    logout_at = Column(DateTime, nullable=True)
    access_token = Column(String(255), nullable=True)


# Milk Transactions
class ShiftEnum(str, enum.Enum):
    M = "M"  # Morning
    E = "E"  # Evening


class MilkRecord(Base):
    __tablename__ = "milk_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    buyer_mobile = Column(String(10), nullable=False)
    seller_mobile = Column(String(10), nullable=False)
    quantity = Column(Float, nullable=False)
    fat = Column(Float, nullable=True)
    snf = Column(Float, nullable=True)
    rate = Column(Float, nullable=False)
    shift = Column(Enum(ShiftEnum), nullable=False)  # Only 'M' or 'E' allowed
    milk_detail = Column(String(256), nullable=True)
    total_till_record = Column(Float, nullable=False)
    custom_date = Column(DateTime, nullable=False)  # Stores user-entered date/time
    is_deleted = Column(Boolean, default=False, nullable=False)
    added_at = Column(DateTime, default=local_now)  # Use local_now
    updated_at = Column(DateTime, nullable=True, onupdate=local_now)  # Use local_now

    # Ensure shift only accepts 'M' or 'E'
    __table_args__ = (
        CheckConstraint("shift IN ('M', 'E')", name="check_shift_values"),
    )


# Expense table
class ExpenseRecord(Base):
    __tablename__ = "Expenses"

    expense_id = Column(Integer, primary_key=True, autoincrement=True)
    buyer_mobile = Column(String(10), nullable=False)
    seller_mobile = Column(String(10), nullable=False)
    amount = Column(Float, nullable=False)
    expense_detail = Column(String(256), nullable=True)
    total_till_record = Column(Float, nullable=False)
    custom_date = Column(DateTime, nullable=False)  # Stores user-entered date/time
    is_deleted = Column(Boolean, default=False, nullable=False)
    added_at = Column(DateTime, default=local_now)  # Use local_now
    updated_at = Column(DateTime, nullable=True, onupdate=local_now)  # Use local_now


class RateList(Base):
    __tablename__ = "RateList"

    buyer_mobile = Column(String(10), primary_key=True, nullable=False)
    rates = Column(JSON, nullable=False)  # Store the JSON data in this column
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=local_now)  # Use local_now
    updated_at = Column(DateTime, nullable=True, onupdate=local_now)  # Use local_now


class Subscription(Base):
    __tablename__ = "subscription"

    id = Column(Integer, primary_key=True, autoincrement=True)
    buyer_mobile = Column(String(10), nullable=False)
    subscription_type = Column(String(10), nullable=False)
    start_date = Column(Date, nullable=False)  # Date only
    end_date = Column(Date, nullable=False)  # Date only
    created_at = Column(DateTime, default=local_now)  # Use local_now
    updated_at = Column(DateTime, nullable=True, onupdate=local_now)  # Use local_now


class AccessType(str, enum.Enum):
    FULL = "Full"
    PARTIAL = "Partial"


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plan"

    id = Column(Integer, primary_key=True, autoincrement=True)
    price = Column(Float, nullable=False)
    validity = Column(Integer, nullable=False)  # e.g., days, months
    access_type = Column(Enum(AccessType), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=local_now)  # Use local_now
    updated_at = Column(DateTime, nullable=True, onupdate=local_now)  # Use local_now
