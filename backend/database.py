from sqlalchemy import (
    create_engine,
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
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import enum
import pytz
import os
from dotenv import load_dotenv

# Load environment variables from .env file if available
load_dotenv()
time_zone = os.getenv("TZ", "Asia/Kolkata")

# Get the current time in the time zone specified in the environment variable
local_timezone = pytz.timezone(time_zone)

# MySQL Database Configuration
# DB_USER = "root"
# DB_PASSWORD = "1234"
# DB_HOST = "localhost"
# DB_NAME = "nits"
# DB_PORT = "3306"
DB_USER = "milkManagementApp_sleepfine"
DB_PASSWORD = "7764640b5257b2d69877b37878213b289613ad91"
DB_HOST = "35xrn.h.filess.io"
DB_NAME = "milkManagementApp_sleepfine"
DB_PORT = "3307"

#DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
DATABASE_URL = f"mysql://milkManagementApp_sleepfine:7764640b5257b2d69877b37878213b289613ad91@35xrn.h.filess.io:3307/milkManagementApp_sleepfine"
# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Define Base for ORM models
Base = declarative_base()


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def local_now():
    return datetime.now(local_timezone)


# User Table Schema
class User(Base):
    __tablename__ = "users"

    mobile = Column(String(10), primary_key=True, nullable=False)  # Mobile as PK
    name = Column(String(100), nullable=False)
    referral_code = Column(String(20), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    registered_at = Column(DateTime, default=local_now)


# Customers Table Schema
class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(Integer, primary_key=True, autoincrement=True)
    mobile = Column(String(10), nullable=False)
    name = Column(String(100), nullable=False)
    added_under = Column(String(255), nullable=False)  # Comma-separated list of sellers
    is_deleted = Column(Boolean, default=False, nullable=False)
    added_at = Column(DateTime, default=local_now)


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
    M = "M"
    E = "E"


class MilkRecord(Base):
    __tablename__ = "milk_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    buyer_mobile = Column(String(10), nullable=False)
    seller_mobile = Column(String(10), nullable=False)
    quantity = Column(Float, nullable=False)
    fat = Column(Float, nullable=True)
    snf = Column(Float, nullable=True)
    rate = Column(Float, nullable=False)
    shift = Column(Enum(ShiftEnum), nullable=False)  # ✅ Only 'M' or 'E' allowed
    milk_detail = Column(String(256), nullable=True)
    total_till_record = Column(Float, nullable=False)
    custom_date = Column(DateTime, nullable=False)  # ✅ Stores user-entered date
    is_deleted = Column(Boolean, default=False, nullable=False)
    added_at = Column(DateTime, default=local_now)
    updated_at = Column(DateTime, nullable=True, onupdate=local_now)

    # ✅ Ensure shift only accepts 'M' or 'E'
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
    custom_date = Column(DateTime, nullable=False)  # ✅ Stores user-entered date
    is_deleted = Column(Boolean, default=False, nullable=False)
    added_at = Column(DateTime, default=local_now)
    updated_at = Column(DateTime, nullable=True, onupdate=local_now)


class RateList(Base):
    __tablename__ = "RateList"

    buyer_mobile = Column(String(10), primary_key=True, nullable=False)
    rates = Column(JSON, nullable=False)  # Store the JSON data in this column
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=local_now)
    updated_at = Column(DateTime, nullable=True, onupdate=local_now)


class Subscription(Base):
    __tablename__ = "subscription"

    id = Column(Integer, primary_key=True, autoincrement=True)
    buyer_mobile = Column(String(10), nullable=False)
    subscription_type = Column(String(10), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=local_now)
    updated_at = Column(DateTime, nullable=True, onupdate=local_now)


class AccessType(str, enum.Enum):
    FULL = "Full"
    PARTIAL = "Partial"


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plan"

    id = Column(Integer, primary_key=True, autoincrement=True)
    price = Column(Float, nullable=False)
    validity = Column(Integer, nullable=False)
    access_type = Column(Enum(AccessType), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=local_now)
    updated_at = Column(DateTime, nullable=True, onupdate=local_now)


# Create tables in MySQL
Base.metadata.create_all(bind=engine)
