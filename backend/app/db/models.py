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
    Text,
    ForeignKey,
)
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum
from app.core.config import local_timezone

Base = declarative_base()


def local_now():
    """Returns the current time in the configured local timezone."""
    return datetime.now(local_timezone)


# User Table Schema
class User(Base):
    __tablename__ = "users"

    mobile = Column(String(10), primary_key=True, nullable=False)  # Mobile as PK
    name = Column(String(100), nullable=False)
    referral_code = Column(String(20), nullable=True)
    referred_by = Column(String(10), nullable=True)  # Mobile of user who referred
    is_deleted = Column(Boolean, default=False, nullable=False)
    registered_at = Column(DateTime, default=local_now)
    # Enhanced security fields
    last_login = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    account_locked_until = Column(DateTime, nullable=True)
    two_factor_enabled = Column(Boolean, default=False)
    preferred_language = Column(String(10), default="en")
    theme_preference = Column(String(20), default="system")  # light, dark, system
    # Subscription tracking
    current_plan = Column(String(20), default="free")  # free, trial, premium
    trial_start_date = Column(Date, nullable=True)
    trial_end_date = Column(Date, nullable=True)
    # Usage tracking
    total_customers_added = Column(Integer, default=0)
    total_suppliers_added = Column(Integer, default=0)
    daily_transactions_count = Column(Integer, default=0)
    last_transaction_date = Column(Date, nullable=True)
    # Referral rewards
    referral_rewards_earned = Column(Integer, default=0)  # Number of rewards earned
    referral_rewards_used = Column(Integer, default=0)  # Number of rewards used


# Enhanced User Sessions for security
class UserSession(Base):
    __tablename__ = "user_sessions"

    session_id = Column(String(255), primary_key=True)
    user_mobile = Column(String(10), ForeignKey("users.mobile"), nullable=False)
    device_id = Column(String(255), nullable=True)
    device_name = Column(String(100), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 support
    user_agent = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=local_now)
    last_activity = Column(DateTime, default=local_now)
    expires_at = Column(DateTime, nullable=False)


# Audit Logs for compliance
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_mobile = Column(String(10), ForeignKey("users.mobile"), nullable=True)
    action = Column(String(100), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    resource_type = Column(
        String(50), nullable=False
    )  # USER, TRANSACTION, CUSTOMER, etc.
    resource_id = Column(String(100), nullable=True)
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    session_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=local_now)


# Device Management for enhanced security
class UserDevice(Base):
    __tablename__ = "user_devices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_mobile = Column(String(10), ForeignKey("users.mobile"), nullable=False)
    device_id = Column(String(255), nullable=False)
    device_name = Column(String(100), nullable=True)
    device_type = Column(String(50), nullable=True)  # mobile, tablet, desktop
    os_info = Column(String(100), nullable=True)
    app_version = Column(String(20), nullable=True)
    is_trusted = Column(Boolean, default=False)
    last_used = Column(DateTime, default=local_now)
    created_at = Column(DateTime, default=local_now)


# Offline Sync Management
class OfflineSync(Base):
    __tablename__ = "offline_sync"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_mobile = Column(String(10), ForeignKey("users.mobile"), nullable=False)
    device_id = Column(String(255), nullable=False)
    sync_token = Column(String(255), nullable=False)
    last_sync = Column(DateTime, default=local_now)
    pending_changes = Column(JSON, nullable=True)  # Store pending offline changes
    created_at = Column(DateTime, default=local_now)


# Customers Table Schema
class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(Integer, primary_key=True, autoincrement=True)
    mobile = Column(String(10), nullable=False)
    name = Column(String(100), nullable=False)
    added_under = Column(String(255), nullable=False)  # Comma-separated list of sellers
    is_deleted = Column(Boolean, default=False, nullable=False)
    added_at = Column(DateTime, default=local_now)  # Use local_now
    # Enhanced customer fields
    address = Column(Text, nullable=True)
    email = Column(String(100), nullable=True)
    gst_number = Column(String(20), nullable=True)
    payment_terms = Column(String(100), nullable=True)
    credit_limit = Column(Float, nullable=True)


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
    # Enhanced transaction fields
    location_lat = Column(Float, nullable=True)  # GPS coordinates
    location_lng = Column(Float, nullable=True)
    photo_url = Column(String(500), nullable=True)  # Photo capture
    barcode_data = Column(String(255), nullable=True)  # Barcode/QR data
    voice_note_url = Column(String(500), nullable=True)  # Voice input
    device_id = Column(String(255), nullable=True)  # Device tracking
    sync_status = Column(String(20), default="synced")  # synced, pending, failed

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
    # Enhanced expense fields
    category = Column(String(50), nullable=True)  # fuel, maintenance, etc.
    receipt_url = Column(String(500), nullable=True)  # Photo capture
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    device_id = Column(String(255), nullable=True)
    sync_status = Column(String(20), default="synced")


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


class Subscription(Base):
    __tablename__ = "subscription"

    id = Column(Integer, primary_key=True, autoincrement=True)
    buyer_mobile = Column(String(10), nullable=False)
    subscription_type = Column(String(10), nullable=False)  # trial, premium
    start_date = Column(Date, nullable=False)  # Date only
    end_date = Column(Date, nullable=False)  # Date only
    created_at = Column(DateTime, default=local_now)  # Use local_now
    updated_at = Column(DateTime, nullable=True, onupdate=local_now)  # Use local_now
    # Payment tracking
    razorpay_order_id = Column(String(255), nullable=True)
    razorpay_payment_id = Column(String(255), nullable=True)
    payment_status = Column(String(20), default="pending")  # pending, completed, failed
    amount_paid = Column(Float, nullable=True)


class AccessType(str, enum.Enum):
    FREE = "Free"
    TRIAL = "Trial"
    PREMIUM = "Premium"


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plan"

    id = Column(Integer, primary_key=True, autoincrement=True)
    plan_name = Column(String(50), nullable=False)  # Free, Trial, Premium
    price = Column(Float, nullable=False)  # 0 for free, 99 for premium
    validity = Column(Integer, nullable=False)  # days
    access_type = Column(Enum(AccessType), nullable=False)
    max_customers = Column(Integer, nullable=False)  # -1 for unlimited
    max_suppliers = Column(Integer, nullable=False)  # -1 for unlimited
    max_daily_transactions = Column(Integer, nullable=False)  # -1 for unlimited
    features = Column(JSON, nullable=True)  # List of features included
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=local_now)  # Use local_now
    updated_at = Column(DateTime, nullable=True, onupdate=local_now)  # Use local_now


class Otp_Table(Base):
    __tablename__ = "OTP_TABLE"

    otp_id = Column(
        BigInteger, primary_key=True, index=True, autoincrement=True, name="OTP_ID"
    )
    mobile_number = Column(
        String(12), unique=False, name="MOBILE_NUMBER", nullable=False
    )
    otp = Column(String(6), unique=False, name="OTP", nullable=True)
    count = Column(BigInteger, unique=False, name="COUNT", nullable=True, default=1)
    time = Column(
        DateTime, unique=False, name="TIME", nullable=False, default=local_now
    )
    CREATE_DATE = Column(
        DateTime,
        unique=False,
        name="CREATE_DATE",
        nullable=False,
        default=local_now,
    )
    UPDATE_DATE = Column(
        DateTime,
        unique=False,
        name="UPDATE_DATE",
        nullable=False,
        default=local_now,
        onupdate=local_now,
    )


# Notification System
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_mobile = Column(String(10), ForeignKey("users.mobile"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(
        String(50), nullable=False
    )  # transaction, payment, alert, etc.
    is_read = Column(Boolean, default=False)
    data = Column(JSON, nullable=True)  # Additional data for the notification
    created_at = Column(DateTime, default=local_now)
    read_at = Column(DateTime, nullable=True)


# API Rate Limiting
class ApiRateLimit(Base):
    __tablename__ = "api_rate_limits"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_mobile = Column(String(10), ForeignKey("users.mobile"), nullable=True)
    ip_address = Column(String(45), nullable=False)
    endpoint = Column(String(200), nullable=False)
    request_count = Column(Integer, default=1)
    window_start = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=local_now)


# Referral Rewards System
class ReferralReward(Base):
    __tablename__ = "referral_rewards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    referrer_mobile = Column(String(10), ForeignKey("users.mobile"), nullable=False)
    referred_mobile = Column(String(10), ForeignKey("users.mobile"), nullable=False)
    reward_type = Column(
        String(50), nullable=False
    )  # extra_trial_days, premium_features, etc.
    reward_value = Column(Integer, nullable=False)  # Number of days, features, etc.
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=local_now)
