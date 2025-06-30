import logging
from datetime import datetime, date
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.db.models import User, Subscription, ReferralReward
from app.middleware.security_middleware import security_middleware
from app.services.subscription_service import subscription_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/subscription",
    tags=["subscription"],
)


# Pydantic models
class ReferralRequest(BaseModel):
    referral_code: str


class PaymentVerificationRequest(BaseModel):
    order_id: str
    payment_id: str
    signature: str


class RewardUsageRequest(BaseModel):
    reward_id: int


@router.get("/plan-info")
async def get_plan_info(
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request),
):
    """Get current plan information and usage for user"""
    try:
        plan_info = subscription_service.get_user_plan_info(db, user_mobile)
        if not plan_info["success"]:
            raise HTTPException(status_code=400, detail=plan_info["error"])

        return plan_info

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting plan info: {e}")
        raise HTTPException(status_code=500, detail="Failed to get plan info")


@router.get("/plans")
async def get_available_plans(
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request),
):
    """Get all available subscription plans"""
    try:
        plans = subscription_service.plans

        # Get user's current plan info
        user_plan_info = subscription_service.get_user_plan_info(db, user_mobile)
        current_plan = user_plan_info.get("current_plan", "free")

        # Format plans for response
        formatted_plans = []
        for plan_key, plan_data in plans.items():
            formatted_plan = {
                "plan_id": plan_key,
                "name": plan_data["name"],
                "price": plan_data["price"],
                "validity_days": plan_data["validity"],
                "features": plan_data["features"],
                "limits": {
                    "max_customers": plan_data["max_customers"],
                    "max_suppliers": plan_data["max_suppliers"],
                    "max_daily_transactions": plan_data["max_daily_transactions"],
                },
                "is_current_plan": plan_key == current_plan,
                "can_upgrade": plan_key != current_plan and plan_key != "free",
            }
            formatted_plans.append(formatted_plan)

        return {"plans": formatted_plans, "current_plan": current_plan}

    except Exception as e:
        logger.error(f"Error getting plans: {e}")
        raise HTTPException(status_code=500, detail="Failed to get plans")


@router.post("/create-order")
async def create_payment_order(
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request),
):
    """Create Razorpay order for premium subscription"""
    try:
        # Check if user already has premium
        user_plan_info = subscription_service.get_user_plan_info(db, user_mobile)
        if user_plan_info["current_plan"] == "premium":
            raise HTTPException(
                status_code=400, detail="You already have a premium subscription"
            )

        # Create Razorpay order
        order_result = subscription_service.create_razorpay_order(
            user_mobile, "premium"
        )
        if not order_result["success"]:
            raise HTTPException(status_code=400, detail=order_result["error"])

        return {
            "success": True,
            "order_id": order_result["order_id"],
            "amount": order_result["amount"],
            "currency": order_result["currency"],
            "receipt": order_result["receipt"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment order: {e}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")


@router.post("/verify-payment")
async def verify_payment(
    request: Request,
    payment_data: PaymentVerificationRequest,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request),
):
    """Verify Razorpay payment and activate premium subscription"""
    try:
        # Verify payment
        verification_result = subscription_service.verify_payment(
            db,
            user_mobile,
            payment_data.order_id,
            payment_data.payment_id,
            payment_data.signature,
        )

        if not verification_result["success"]:
            raise HTTPException(status_code=400, detail=verification_result["error"])

        return {
            "success": True,
            "message": "Payment verified and subscription activated successfully",
            "subscription": verification_result,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying payment: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify payment")


@router.post("/apply-referral")
async def apply_referral_code(
    request: Request,
    referral_data: ReferralRequest,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request),
):
    """Apply referral code for rewards"""
    try:
        # Find user with this referral code
        referrer = (
            db.query(User)
            .filter(
                User.referral_code == referral_data.referral_code,
                User.mobile != user_mobile,  # Can't refer yourself
            )
            .first()
        )

        if not referrer:
            raise HTTPException(status_code=400, detail="Invalid referral code")

        # Check if user already has a referrer
        user = db.query(User).filter(User.mobile == user_mobile).first()
        if user.referred_by:
            raise HTTPException(status_code=400, detail="Referral code already applied")

        # Apply referral
        user.referred_by = referrer.mobile

        # Process referral rewards
        subscription_service._process_referral_rewards(db, referrer.mobile, user_mobile)

        db.commit()

        return {
            "success": True,
            "message": "Referral code applied successfully",
            "referrer_name": referrer.name,
            "rewards_earned": "15 extra trial days",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error applying referral: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to apply referral code")


@router.get("/referral-info")
async def get_referral_info(
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request),
):
    """Get user's referral information"""
    try:
        user = db.query(User).filter(User.mobile == user_mobile).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get referral rewards
        rewards_result = subscription_service.get_available_rewards(db, user_mobile)

        return {
            "referral_code": user.referral_code,
            "referred_by": user.referred_by,
            "rewards_earned": user.referral_rewards_earned,
            "rewards_used": user.referral_rewards_used,
            "available_rewards": rewards_result.get("rewards", []),
            "total_available": rewards_result.get("total_available", 0),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting referral info: {e}")
        raise HTTPException(status_code=500, detail="Failed to get referral info")


@router.post("/use-reward")
async def use_referral_reward(
    request: Request,
    reward_data: RewardUsageRequest,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request),
):
    """Use a referral reward"""
    try:
        reward_result = subscription_service.use_reward(
            db, user_mobile, reward_data.reward_id
        )

        if not reward_result["success"]:
            raise HTTPException(status_code=400, detail=reward_result["error"])

        return {
            "success": True,
            "message": "Reward used successfully",
            "benefit": reward_result["benefit"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error using reward: {e}")
        raise HTTPException(status_code=500, detail="Failed to use reward")


@router.get("/usage")
async def get_usage_info(
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request),
):
    """Get detailed usage information"""
    try:
        plan_info = subscription_service.get_user_plan_info(db, user_mobile)
        if not plan_info["success"]:
            raise HTTPException(status_code=400, detail=plan_info["error"])

        usage = plan_info["usage"]
        current_plan = plan_info["current_plan"]

        # Calculate usage percentages
        customer_usage = 0
        supplier_usage = 0
        transaction_usage = 0

        if usage["max_customers"] != -1:
            customer_usage = (usage["customers_added"] / usage["max_customers"]) * 100

        if usage["max_suppliers"] != -1:
            supplier_usage = (usage["suppliers_added"] / usage["max_suppliers"]) * 100

        if usage["max_daily_transactions"] != -1:
            transaction_usage = (
                usage["daily_transactions"] / usage["max_daily_transactions"]
            ) * 100

        return {
            "current_plan": current_plan,
            "usage": {
                "customers": {
                    "used": usage["customers_added"],
                    "limit": usage["max_customers"],
                    "percentage": round(customer_usage, 1),
                    "unlimited": usage["max_customers"] == -1,
                },
                "suppliers": {
                    "used": usage["suppliers_added"],
                    "limit": usage["max_suppliers"],
                    "percentage": round(supplier_usage, 1),
                    "unlimited": usage["max_suppliers"] == -1,
                },
                "daily_transactions": {
                    "used": usage["daily_transactions"],
                    "limit": usage["max_daily_transactions"],
                    "percentage": round(transaction_usage, 1),
                    "unlimited": usage["max_daily_transactions"] == -1,
                },
            },
            "trial_info": plan_info["trial_info"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting usage info: {e}")
        raise HTTPException(status_code=500, detail="Failed to get usage info")


@router.get("/history")
async def get_subscription_history(
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request),
):
    """Get subscription history for user"""
    try:
        subscriptions = (
            db.query(Subscription)
            .filter(Subscription.buyer_mobile == user_mobile)
            .order_by(Subscription.created_at.desc())
            .all()
        )

        history = []
        for sub in subscriptions:
            history.append(
                {
                    "id": sub.id,
                    "type": sub.subscription_type,
                    "start_date": sub.start_date.isoformat(),
                    "end_date": sub.end_date.isoformat(),
                    "payment_status": sub.payment_status,
                    "amount_paid": sub.amount_paid,
                    "created_at": sub.created_at.isoformat(),
                    "razorpay_order_id": sub.razorpay_order_id,
                    "razorpay_payment_id": sub.razorpay_payment_id,
                }
            )

        return {"subscriptions": history, "total_subscriptions": len(history)}

    except Exception as e:
        logger.error(f"Error getting subscription history: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to get subscription history"
        )


@router.get("/check-limit/{action}")
async def check_action_limit(
    action: str,
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request),
):
    """Check if user can perform an action based on their plan limits"""
    try:
        allowed, message = subscription_service.check_usage_limits(
            db, user_mobile, action
        )

        return {"allowed": allowed, "message": message, "action": action}

    except Exception as e:
        logger.error(f"Error checking action limit: {e}")
        raise HTTPException(status_code=500, detail="Failed to check action limit")


@router.post("/setup-new-user")
async def setup_new_user_subscription(
    request: Request,
    user_mobile: str,
    referred_by: str = None,
    db: Session = Depends(get_db),
):
    """Setup new user with trial and referral rewards (called during signup)"""
    try:
        result = subscription_service.setup_new_user(db, user_mobile, referred_by)

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting up new user: {e}")
        raise HTTPException(status_code=500, detail="Failed to setup new user")
