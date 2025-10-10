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
    BigInteger,
)
from datetime import datetime
import enum
from app.core.config import local_timezone
from app.db.session import Base


def local_now():
    """Returns the current time in the configured local timezone."""
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

    customer_id = Column(Integer, primary_key=True)
    mobile = Column(String(10), nullable=False)
    name = Column(String(100), nullable=False)
    added_under = Column(String(255), nullable=False)  # Comma-separated list of sellers
    is_deleted = Column(Boolean, default=False, nullable=False)
    added_at = Column(DateTime, default=local_now)  # Use local_now


# class AuthUser(Base):
#     __tablename__ = "login_details"

#     mobile = Column(String(10), primary_key=True, nullable=False)  # Mobile as PK
#     otp = Column(String(6), nullable=False)
#     expire_at = Column(DateTime, nullable=False)
#     login_at = Column(DateTime, nullable=True)
#     logout_at = Column(DateTime, nullable=True)
#     access_token = Column(String(255), nullable=True)


# Milk Transactions
class ShiftEnum(str, enum.Enum):
    M = "M"  # Morning
    E = "E"  # Evening


class MilkRecord(Base):
    __tablename__ = "milk_records"

    id = Column(
        Integer,
        primary_key=True,
    )
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

    expense_id = Column(
        Integer,
        primary_key=True,
    )
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
    min_fat = Column(Float, nullable=False)
    max_fat = Column(Float, nullable=False)
    min_snf = Column(Float, nullable=False)
    max_snf = Column(Float, nullable=False)
    rates = Column(JSON, nullable=False)  # Store the JSON data in this column
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=local_now)  # Use local_now
    updated_at = Column(DateTime, nullable=True, onupdate=local_now)  # Use local_now
    status = Column(
        String(20), nullable=False, default="processing"
    )  # processing, complete, failed


class Subscription(Base):
    __tablename__ = "subscription"

    id = Column(
        Integer,
        primary_key=True,
    )
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

    id = Column(
        Integer,
        primary_key=True,
    )
    plan_name = Column(String(20), nullable=False, unique=True)  # Free, Trial, Premium
    price = Column(Float, nullable=False)
    validity = Column(Integer, nullable=False)  # in days
    access_type = Column(Enum(AccessType), nullable=False)
    customer_limit = Column(Integer, nullable=True)  # Null means unlimited
    supplier_limit = Column(Integer, nullable=True)
    transaction_limit = Column(Integer, nullable=True)
    ratelist_upload_limit = Column(Integer, nullable=True)  # Null means unlimited
    description = Column(String(255), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=local_now)  # Use local_now
    updated_at = Column(DateTime, nullable=True, onupdate=local_now)  # Use local_now

    @staticmethod
    def seed_plans(session):
        plans = [
            {
                "plan_name": "Free",
                "price": 0.0,
                "validity": 3650,  # 10 years, effectively unlimited
                "access_type": AccessType.PARTIAL,
                "customer_limit": 5,
                "supplier_limit": 5,
                "transaction_limit": 3,
                "ratelist_upload_limit": 3,  # Can upload ratelist up to 3 times
                "description": "Free plan: 5 customers, 5 suppliers, 3 daily transactions, 3 rate list uploads.",
            },
            {
                "plan_name": "Trial",
                "price": 0.0,
                "validity": 15,
                "access_type": AccessType.PARTIAL,
                "customer_limit": 5,
                "supplier_limit": 5,
                "transaction_limit": 3,
                "ratelist_upload_limit": 3,  # Can upload ratelist up to 3 times
                "description": "Trial plan: 15 days, 5 customers, 5 suppliers, 3 daily transactions, 3 rate list uploads.",
            },
            {
                "plan_name": "Premium",
                "price": 99.0,
                "validity": 30,
                "access_type": AccessType.FULL,
                "customer_limit": None,
                "supplier_limit": None,
                "transaction_limit": None,
                "ratelist_upload_limit": None,  # Unlimited
                "description": "Premium plan: 30 days, unlimited customers, suppliers, transactions, and rate list uploads.",
            },
        ]
        for plan in plans:
            existing = (
                session.query(SubscriptionPlan)
                .filter_by(plan_name=plan["plan_name"])
                .first()
            )
            if not existing:
                session.add(SubscriptionPlan(**plan))
        session.commit()


class Otp_Table(Base):
    __tablename__ = "otp_table"

    otp_id = Column(BigInteger, primary_key=True, index=True)
    mobile_number = Column(String(12), nullable=False)
    otp = Column(String(6), nullable=True)
    count = Column(BigInteger, nullable=True, default=1)
    time = Column(DateTime, nullable=False, default=local_now)
    create_date = Column(DateTime, nullable=False, default=local_now)
    update_date = Column(
        DateTime, nullable=False, default=local_now, onupdate=local_now
    )
