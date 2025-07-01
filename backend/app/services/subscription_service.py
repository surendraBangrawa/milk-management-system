from sqlalchemy.orm import Session
from datetime import date, datetime
from app.db.models import (
    Subscription,
    SubscriptionPlan,
    Customer,
    MilkRecord,
    ExpenseRecord,
)
from app.core.config import local_timezone
import logging

logger = logging.getLogger(__name__)


def get_active_subscription(db: Session, buyer_mobile: str):
    """Get the user's active subscription if any."""
    today = date.today()
    return (
        db.query(Subscription)
        .filter(
            Subscription.buyer_mobile == buyer_mobile,
            Subscription.start_date <= today,
            Subscription.end_date >= today,
        )
        .order_by(Subscription.end_date.desc())
        .first()
    )


def get_plan_limits(db: Session, buyer_mobile: str):
    """Get the current user's plan limits."""
    sub = get_active_subscription(db, buyer_mobile)
    if not sub:
        # Default to Free plan limits
        return {
            "plan_name": "Free",
            "customer_limit": 5,
            "supplier_limit": 5,
            "transaction_limit": 3,
            "validity": 3650,
            "price": 0.0,
        }

    plan = (
        db.query(SubscriptionPlan)
        .filter(SubscriptionPlan.access_type == sub.subscription_type)
        .first()
    )

    if not plan:
        # Fallback to Free plan if plan not found
        return {
            "plan_name": "Free",
            "customer_limit": 5,
            "supplier_limit": 5,
            "transaction_limit": 3,
            "validity": 3650,
            "price": 0.0,
        }

    return {
        "plan_name": plan.plan_name,
        "customer_limit": plan.customer_limit,
        "supplier_limit": plan.supplier_limit,
        "transaction_limit": plan.transaction_limit,
        "validity": plan.validity,
        "price": plan.price,
    }


def can_add_customer(db: Session, buyer_mobile: str) -> bool:
    """Check if user can add more customers based on their subscription."""
    try:
        limits = get_plan_limits(db, buyer_mobile)
        if limits["customer_limit"] is None:
            return True  # Unlimited

        current_count = (
            db.query(Customer)
            .filter(Customer.added_under == buyer_mobile, Customer.is_deleted == 0)
            .count()
        )

        return current_count < limits["customer_limit"]
    except Exception as e:
        logger.error(f"Error checking customer limit for {buyer_mobile}: {e}")
        return False  # Fail safe - don't allow if error


def can_add_transaction_today(db: Session, buyer_mobile: str) -> bool:
    """Check if user can add more transactions today based on their subscription."""
    try:
        limits = get_plan_limits(db, buyer_mobile)
        if limits["transaction_limit"] is None:
            return True  # Unlimited

        today = datetime.now(local_timezone).replace(tzinfo=None).date()
        start_of_day = datetime.combine(today, datetime.min.time())
        end_of_day = datetime.combine(today, datetime.max.time())

        # Count today's transactions (both milk and expense)
        milk_count = (
            db.query(MilkRecord)
            .filter(
                MilkRecord.buyer_mobile == buyer_mobile,
                MilkRecord.is_deleted == 0,
                MilkRecord.added_at >= start_of_day,
                MilkRecord.added_at <= end_of_day,
            )
            .count()
        )

        expense_count = (
            db.query(ExpenseRecord)
            .filter(
                ExpenseRecord.buyer_mobile == buyer_mobile,
                ExpenseRecord.is_deleted == 0,
                ExpenseRecord.added_at >= start_of_day,
                ExpenseRecord.added_at <= end_of_day,
            )
            .count()
        )

        total_today = milk_count + expense_count
        return total_today < limits["transaction_limit"]
    except Exception as e:
        logger.error(f"Error checking transaction limit for {buyer_mobile}: {e}")
        return False  # Fail safe - don't allow if error


def get_subscription_status(db: Session, buyer_mobile: str):
    """Get comprehensive subscription status for a user."""
    try:
        user = db.query(Customer).filter(Customer.mobile == buyer_mobile).first()

        if not user:
            return None

        # Check if user is in trial period (first 15 days)
        registration_date = user.registered_at.date()
        today = date.today()
        days_since_registration = (today - registration_date).days

        if days_since_registration < 15:
            return {
                "plan_name": "Trial",
                "days_remaining": 15 - days_since_registration,
                "customer_limit": 5,
                "supplier_limit": 5,
                "transaction_limit": 3,
            }

        # Check active subscription
        active_sub = get_active_subscription(db, buyer_mobile)
        if active_sub:
            limits = get_plan_limits(db, buyer_mobile)
            return {
                "plan_name": limits["plan_name"],
                "start_date": active_sub.start_date,
                "end_date": active_sub.end_date,
                "days_remaining": (active_sub.end_date - today).days,
                **limits,
            }

        # Default to Free plan
        return {
            "plan_name": "Free",
            "customer_limit": 5,
            "supplier_limit": 5,
            "transaction_limit": 3,
        }
    except Exception as e:
        logger.error(f"Error getting subscription status for {buyer_mobile}: {e}")
        return None
