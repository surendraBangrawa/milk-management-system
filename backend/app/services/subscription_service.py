import logging
import razorpay
import secrets
import string
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.db.models import User, Subscription, SubscriptionPlan, ReferralReward
from app.core.config import local_timezone

logger = logging.getLogger(__name__)

# Initialize Razorpay client
razorpay_client = razorpay.Client(
    auth=("rzp_test_YOUR_KEY_ID", "YOUR_SECRET_KEY")  # Replace with your keys
)


class SubscriptionService:
    """Service for managing subscriptions, trials, and usage limits"""

    def __init__(self):
        self.plans = {
            "free": {
                "name": "Free",
                "price": 0,
                "validity": 0,  # Forever
                "max_customers": 10,
                "max_suppliers": 10,
                "max_daily_transactions": 3,
                "features": [
                    "Basic milk tracking",
                    "Limited customers",
                    "Limited suppliers",
                ],
            },
            "trial": {
                "name": "Trial",
                "price": 0,
                "validity": 30,  # 30 days
                "max_customers": -1,  # Unlimited
                "max_suppliers": -1,  # Unlimited
                "max_daily_transactions": -1,  # Unlimited
                "features": [
                    "All premium features",
                    "Unlimited customers",
                    "Unlimited suppliers",
                    "Advanced analytics",
                ],
            },
            "premium": {
                "name": "Premium",
                "price": 99,
                "validity": 365,  # 1 year
                "max_customers": -1,  # Unlimited
                "max_suppliers": -1,  # Unlimited
                "max_daily_transactions": -1,  # Unlimited
                "features": [
                    "All premium features",
                    "Unlimited customers",
                    "Unlimited suppliers",
                    "Advanced analytics",
                    "Priority support",
                ],
            },
        }

    def generate_referral_code(self, user_mobile: str) -> str:
        """Generate a unique referral code for the user"""
        # Use last 4 digits of mobile + random string
        mobile_suffix = user_mobile[-4:]
        random_string = "".join(
            secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4)
        )
        return f"{mobile_suffix}{random_string}"

    def setup_new_user(
        self, db: Session, user_mobile: str, referred_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """Setup new user with trial and referral rewards"""
        try:
            user = db.query(User).filter(User.mobile == user_mobile).first()
            if not user:
                return {"success": False, "error": "User not found"}

            # Generate referral code if not exists
            if not user.referral_code:
                user.referral_code = self.generate_referral_code(user_mobile)

            # Set referred_by if provided
            if referred_by:
                user.referred_by = referred_by

            # Setup trial period
            trial_start = date.today()
            trial_end = trial_start + timedelta(days=30)

            user.current_plan = "trial"
            user.trial_start_date = trial_start
            user.trial_end_date = trial_end

            # Create trial subscription record
            trial_subscription = Subscription(
                buyer_mobile=user_mobile,
                subscription_type="trial",
                start_date=trial_start,
                end_date=trial_end,
                payment_status="completed",
            )
            db.add(trial_subscription)

            # Handle referral rewards
            if referred_by:
                self._process_referral_rewards(db, referred_by, user_mobile)

            db.commit()

            return {
                "success": True,
                "plan": "trial",
                "trial_end_date": trial_end.isoformat(),
                "referral_code": user.referral_code,
            }

        except Exception as e:
            logger.error(f"Error setting up new user: {e}")
            db.rollback()
            return {"success": False, "error": str(e)}

    def _process_referral_rewards(
        self, db: Session, referrer_mobile: str, referred_mobile: str
    ):
        """Process referral rewards for both users"""
        try:
            # Reward for referrer: 7 extra days of premium features
            referrer_reward = ReferralReward(
                referrer_mobile=referrer_mobile,
                referred_mobile=referred_mobile,
                reward_type="extra_premium_days",
                reward_value=7,
            )
            db.add(referrer_reward)

            # Reward for referred user: 15 extra days of trial
            referred_reward = ReferralReward(
                referrer_mobile=referrer_mobile,
                referred_mobile=referred_mobile,
                reward_type="extra_trial_days",
                reward_value=15,
            )
            db.add(referred_reward)

            # Update user reward counts
            referrer = db.query(User).filter(User.mobile == referrer_mobile).first()
            if referrer:
                referrer.referral_rewards_earned += 1

            referred = db.query(User).filter(User.mobile == referred_mobile).first()
            if referred:
                referred.referral_rewards_earned += 1

        except Exception as e:
            logger.error(f"Error processing referral rewards: {e}")

    def get_user_plan_info(self, db: Session, user_mobile: str) -> Dict[str, Any]:
        """Get current plan information and usage for user"""
        try:
            user = db.query(User).filter(User.mobile == user_mobile).first()
            if not user:
                return {"success": False, "error": "User not found"}

            current_plan = user.current_plan
            plan_info = self.plans.get(current_plan, self.plans["free"])

            # Check if trial expired
            if (
                current_plan == "trial"
                and user.trial_end_date
                and user.trial_end_date < date.today()
            ):
                current_plan = "free"
                user.current_plan = "free"
                db.commit()
                plan_info = self.plans["free"]

            # Reset daily transaction count if it's a new day
            if user.last_transaction_date != date.today():
                user.daily_transactions_count = 0
                user.last_transaction_date = date.today()
                db.commit()

            return {
                "success": True,
                "current_plan": current_plan,
                "plan_info": plan_info,
                "usage": {
                    "customers_added": user.total_customers_added,
                    "suppliers_added": user.total_suppliers_added,
                    "daily_transactions": user.daily_transactions_count,
                    "max_customers": plan_info["max_customers"],
                    "max_suppliers": plan_info["max_suppliers"],
                    "max_daily_transactions": plan_info["max_daily_transactions"],
                },
                "trial_info": {
                    "trial_start_date": (
                        user.trial_start_date.isoformat()
                        if user.trial_start_date
                        else None
                    ),
                    "trial_end_date": (
                        user.trial_end_date.isoformat() if user.trial_end_date else None
                    ),
                    "is_trial_active": current_plan == "trial",
                },
                "referral_info": {
                    "referral_code": user.referral_code,
                    "referred_by": user.referred_by,
                    "rewards_earned": user.referral_rewards_earned,
                    "rewards_used": user.referral_rewards_used,
                },
            }

        except Exception as e:
            logger.error(f"Error getting user plan info: {e}")
            return {"success": False, "error": str(e)}

    def check_usage_limits(
        self, db: Session, user_mobile: str, action: str
    ) -> Tuple[bool, str]:
        """Check if user can perform an action based on their plan limits"""
        try:
            user = db.query(User).filter(User.mobile == user_mobile).first()
            if not user:
                return False, "User not found"

            plan_info = self.get_user_plan_info(db, user_mobile)
            if not plan_info["success"]:
                return False, plan_info["error"]

            current_plan = plan_info["current_plan"]
            usage = plan_info["usage"]

            if action == "add_customer":
                if (
                    usage["max_customers"] != -1
                    and usage["customers_added"] >= usage["max_customers"]
                ):
                    return (
                        False,
                        f"Free plan limit reached. You can add maximum {usage['max_customers']} customers.",
                    )

            elif action == "add_supplier":
                if (
                    usage["max_suppliers"] != -1
                    and usage["suppliers_added"] >= usage["max_suppliers"]
                ):
                    return (
                        False,
                        f"Free plan limit reached. You can add maximum {usage['max_suppliers']} suppliers.",
                    )

            elif action == "add_transaction":
                if (
                    usage["max_daily_transactions"] != -1
                    and usage["daily_transactions"] >= usage["max_daily_transactions"]
                ):
                    return (
                        False,
                        f"Free plan limit reached. You can add maximum {usage['max_daily_transactions']} transactions per day.",
                    )

            return True, "Allowed"

        except Exception as e:
            logger.error(f"Error checking usage limits: {e}")
            return False, "Error checking limits"

    def update_usage(self, db: Session, user_mobile: str, action: str):
        """Update usage counters for user"""
        try:
            user = db.query(User).filter(User.mobile == user_mobile).first()
            if not user:
                return

            if action == "add_customer":
                user.total_customers_added += 1
            elif action == "add_supplier":
                user.total_suppliers_added += 1
            elif action == "add_transaction":
                # Reset counter if it's a new day
                if user.last_transaction_date != date.today():
                    user.daily_transactions_count = 1
                    user.last_transaction_date = date.today()
                else:
                    user.daily_transactions_count += 1

            db.commit()

        except Exception as e:
            logger.error(f"Error updating usage: {e}")
            db.rollback()

    def create_razorpay_order(
        self, user_mobile: str, plan_type: str = "premium"
    ) -> Dict[str, Any]:
        """Create Razorpay order for subscription payment"""
        try:
            plan_info = self.plans.get(plan_type)
            if not plan_info:
                return {"success": False, "error": "Invalid plan"}

            # Create Razorpay order
            order_data = {
                "amount": int(plan_info["price"] * 100),  # Convert to paise
                "currency": "INR",
                "receipt": f'sub_{user_mobile}_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
                "notes": {"user_mobile": user_mobile, "plan_type": plan_type},
            }

            order = razorpay_client.order.create(data=order_data)

            return {
                "success": True,
                "order_id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"],
                "receipt": order["receipt"],
            }

        except Exception as e:
            logger.error(f"Error creating Razorpay order: {e}")
            return {"success": False, "error": str(e)}

    def verify_payment(
        self,
        db: Session,
        user_mobile: str,
        order_id: str,
        payment_id: str,
        signature: str,
    ) -> Dict[str, Any]:
        """Verify Razorpay payment and activate subscription"""
        try:
            # Verify payment signature
            params_dict = {
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment_id,
                "razorpay_signature": signature,
            }

            razorpay_client.utility.verify_payment_signature(params_dict)

            # Get payment details
            payment = razorpay_client.payment.fetch(payment_id)

            # Create subscription
            subscription_start = date.today()
            subscription_end = subscription_start + timedelta(days=365)  # 1 year

            subscription = Subscription(
                buyer_mobile=user_mobile,
                subscription_type="premium",
                start_date=subscription_start,
                end_date=subscription_end,
                razorpay_order_id=order_id,
                razorpay_payment_id=payment_id,
                payment_status="completed",
                amount_paid=payment["amount"] / 100,  # Convert from paise
            )
            db.add(subscription)

            # Update user plan
            user = db.query(User).filter(User.mobile == user_mobile).first()
            if user:
                user.current_plan = "premium"
                # Reset trial info
                user.trial_start_date = None
                user.trial_end_date = None

            db.commit()

            return {
                "success": True,
                "subscription_id": subscription.id,
                "start_date": subscription_start.isoformat(),
                "end_date": subscription_end.isoformat(),
                "amount_paid": subscription.amount_paid,
            }

        except Exception as e:
            logger.error(f"Error verifying payment: {e}")
            db.rollback()
            return {"success": False, "error": str(e)}

    def get_available_rewards(self, db: Session, user_mobile: str) -> Dict[str, Any]:
        """Get available referral rewards for user"""
        try:
            rewards = (
                db.query(ReferralReward)
                .filter(
                    ReferralReward.referrer_mobile == user_mobile,
                    ReferralReward.is_used == False,
                )
                .all()
            )

            reward_list = []
            for reward in rewards:
                reward_list.append(
                    {
                        "id": reward.id,
                        "reward_type": reward.reward_type,
                        "reward_value": reward.reward_value,
                        "created_at": reward.created_at.isoformat(),
                        "description": self._get_reward_description(
                            reward.reward_type, reward.reward_value
                        ),
                    }
                )

            return {
                "success": True,
                "rewards": reward_list,
                "total_available": len(reward_list),
            }

        except Exception as e:
            logger.error(f"Error getting rewards: {e}")
            return {"success": False, "error": str(e)}

    def use_reward(
        self, db: Session, user_mobile: str, reward_id: int
    ) -> Dict[str, Any]:
        """Use a referral reward"""
        try:
            reward = (
                db.query(ReferralReward)
                .filter(
                    ReferralReward.id == reward_id,
                    ReferralReward.referrer_mobile == user_mobile,
                    ReferralReward.is_used == False,
                )
                .first()
            )

            if not reward:
                return {"success": False, "error": "Reward not found or already used"}

            # Mark reward as used
            reward.is_used = True
            reward.used_at = datetime.now(local_timezone)

            # Apply reward benefits
            user = db.query(User).filter(User.mobile == user_mobile).first()
            if user:
                user.referral_rewards_used += 1

                if reward.reward_type == "extra_premium_days":
                    # Extend premium subscription
                    current_subscription = (
                        db.query(Subscription)
                        .filter(
                            Subscription.buyer_mobile == user_mobile,
                            Subscription.subscription_type == "premium",
                            Subscription.payment_status == "completed",
                        )
                        .order_by(Subscription.created_at.desc())
                        .first()
                    )

                    if current_subscription:
                        current_subscription.end_date += timedelta(
                            days=reward.reward_value
                        )

            db.commit()

            return {
                "success": True,
                "reward_used": reward.reward_type,
                "benefit": self._get_reward_description(
                    reward.reward_type, reward.reward_value
                ),
            }

        except Exception as e:
            logger.error(f"Error using reward: {e}")
            db.rollback()
            return {"success": False, "error": str(e)}

    def _get_reward_description(self, reward_type: str, reward_value: int) -> str:
        """Get human-readable description of reward"""
        if reward_type == "extra_premium_days":
            return f"{reward_value} extra days of premium features"
        elif reward_type == "extra_trial_days":
            return f"{reward_value} extra days of trial"
        else:
            return f"Unknown reward: {reward_type}"


# Global subscription service instance
subscription_service = SubscriptionService()
