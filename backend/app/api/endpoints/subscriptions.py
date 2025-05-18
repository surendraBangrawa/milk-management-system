from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.security import get_current_user
from app.db.session import get_db
from app.schemas.subscriptions import SubscriptionRequest
from app.core.config import local_timezone
from app.db.models import Subscription, SubscriptionPlan, User
from datetime import datetime, timedelta
import logging
import datetime

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/subscriptions",
    tags=["subscriptions"],
)


@router.post("/take")
def take_subscription(
    subscription_request: SubscriptionRequest,  # Body parameter
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
):
    try:
        logger.info(f"In take_subscription")
        local_time = datetime.now(local_timezone).replace(tzinfo=None)
        plan_id = subscription_request.plan_id
        user_info = (
            db.query(User)
            .filter(User.mobile == buyer_mobile, User.is_deleted == 0)
            .first()
        )

        subscription_info = (
            db.query(Subscription)
            .filter(Subscription.buyer_mobile == buyer_mobile)
            .order_by(Subscription.end_date.desc())
            .first()
        )

        subscription_plan_info = (
            db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
        )

        if not subscription_plan_info:
            raise HTTPException(status_code=404, detail="Subscription plan not found")

        if subscription_info:
            if subscription_info.subscription_type.lower() == "partial":
                if subscription_plan_info.access_type.lower() == "partial":
                    if subscription_info.end_date < local_time.date():
                        subscription_info.start_date = local_time.date()
                        subscription_info.end_date = local_time.date() + timedelta(
                            days=subscription_plan_info.validity - 1
                        )
                    else:
                        subscription_info.end_date += timedelta(
                            days=subscription_plan_info.validity
                        )
                else:
                    if subscription_info.end_date < local_time.date():
                        start_date = local_time.date()
                        end_date = local_time.date() + timedelta(
                            days=subscription_plan_info.validity - 1
                        )
                    else:
                        start_date = subscription_info.end_date + timedelta(days=1)
                        end_date = subscription_info.end_date + timedelta(
                            days=subscription_plan_info.validity
                        )

                    new_entry = Subscription(
                        buyer_mobile=buyer_mobile,
                        start_date=start_date,
                        end_date=end_date,
                        subscription_type=subscription_plan_info.access_type,
                    )
                    db.add(new_entry)
                    db.commit()
                    return {"message": "Subscription added succesfully"}

            else:
                if subscription_plan_info.access_type.lower() == "full":
                    if subscription_info.end_date < local_time.date():
                        subscription_info.start_date = local_time.date()
                        subscription_info.end_date = local_time.date() + timedelta(
                            days=subscription_plan_info.validity - 1
                        )
                    else:
                        subscription_info.end_date += timedelta(
                            days=subscription_plan_info.validity
                        )
                else:
                    if subscription_info.end_date < local_time.date():
                        start_date = local_time.date()
                        end_date = local_time.date() + timedelta(
                            days=subscription_plan_info.validity - 1
                        )
                    else:
                        start_date = subscription_info.end_date + timedelta(days=1)
                        end_date = subscription_info.end_date + timedelta(
                            days=subscription_plan_info.validity
                        )

                    new_entry = Subscription(
                        buyer_mobile=buyer_mobile,
                        start_date=start_date,
                        end_date=end_date,
                        subscription_type=subscription_plan_info.access_type,
                    )
                    db.add(new_entry)
                    db.commit()
                    return {"message": "Subscription added succesfully"}

        else:
            free_trial = user_info.registered_at
            free_trial_end_date = free_trial.date() + timedelta(days=30 - 1)

            if free_trial_end_date < local_time.date():
                start_date = local_time.date()
                end_date = local_time.date() + timedelta(
                    days=subscription_plan_info.validity - 1
                )

            else:
                start_date = free_trial_end_date + timedelta(days=1)
                end_date = start_date + timedelta(
                    days=subscription_plan_info.validity - 1
                )

            new_entry = Subscription(
                buyer_mobile=buyer_mobile,
                start_date=start_date,
                end_date=end_date,
                subscription_type=subscription_plan_info.access_type,
            )
            db.add(new_entry)
            db.commit()
            return {"message": "Subscription added succesfully"}

        db.commit()
        return {"message": "Subscription added succesfully"}
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")


@router.get("/check")
def check_subscription(
    db: Session = Depends(get_db), buyer_mobile: str = Depends(get_current_user)
):
    try:
        logger.info(f"In check_subscription")
        user_info = (
            db.query(User)
            .filter(User.mobile == buyer_mobile, User.is_deleted == 0)
            .first()
        )

        local_time = datetime.now(local_timezone).replace(tzinfo=None)

        # Calculate days since the user registered
        days_till_now = (local_time - user_info.registered_at).days
        print(user_info.registered_at)

        if days_till_now <= 30:
            return {"message": "User is on free trial"}

        # After 30 days, check the subscription status
        subscription_info = (
            db.query(Subscription)
            .filter(
                Subscription.buyer_mobile == buyer_mobile,
                Subscription.start_date <= local_time.date(),
                Subscription.end_date >= local_time.date(),
            )
            .first()
        )

        if subscription_info:
            subscription_type = subscription_info.subscription_type
            return {
                "message": "User is on subscription",
                "subsription_type": subscription_type,
            }

        # If no active subscription found
        raise HTTPException(status_code=404, detail="Subscription is not live")
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")


@router.get("/fetch_plans")
def fetch_plans(
    db: Session = Depends(get_db), buyer_mobile: str = Depends(get_current_user)
):
    try:
        logger.info("In fetch_plans")
        all_plans = (
            db.query(SubscriptionPlan).filter(SubscriptionPlan.is_deleted == 0).all()
        )

        if not all_plans:
            raise HTTPException(status_code=404, detail="No plan found")

        return all_plans

    except Exception as e:
        logger.error(f"Error : {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")
