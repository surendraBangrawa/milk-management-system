from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.security import get_current_user
from app.db.session import get_db
from app.schemas.subscriptions import SubscriptionRequest
from app.core.config import local_timezone
from app.db.models import Subscription, SubscriptionPlan, User
from datetime import datetime, timedelta
import logging
from app.services.razorpay_service import (
    create_payment_link,
    verify_webhook_signature,
)
import os


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

        # First check for active subscription (this takes priority over free trial)
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
            logger.info(f"Active subscription found: {subscription_type}")
            return {
                "message": "User is on subscription",
                "subsription_type": subscription_type,
            }

        # If no active subscription, check if user is in free trial period
        days_till_now = (local_time - user_info.registered_at).days
        logger.info(f"Days since registration: {days_till_now}")
        logger.info(f"Registration date: {user_info.registered_at}")

        if days_till_now <= 30:
            return {"message": "User is on free trial"}

        # If no active subscription found and past free trial
        raise HTTPException(status_code=404, detail="Subscription is not live")
    # except Exception as e:
    #     logger.error(f"Error: {e}")
    #     raise HTTPException(status_code=404, detail="Something went wrong")
    except HTTPException as http_exc:
        # Catch and re-raise explicit HTTPExceptions to preserve their specific details
        raise http_exc
    except Exception as e:
        # This catches any other unexpected errors and provides a more specific 500 error.
        logger.error(f"Error in check_subscription: {e}")
        raise HTTPException(
            status_code=500,
            detail="An internal server error occurred while checking subscription.",
        )


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


@router.post("/create_payment_intent")
def create_premium_payment_intent(
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
):
    """
    Create a Razorpay payment intent for the Premium plan and return payment details.
    """
    user = (
        db.query(User).filter(User.mobile == buyer_mobile, User.is_deleted == 0).first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    plan = (
        db.query(SubscriptionPlan)
        .filter(SubscriptionPlan.plan_name == "Premium")
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Premium plan not found")

    # For test, use dummy email if not present
    email = getattr(user, "email", None) or f"{buyer_mobile}@test.com"

    try:
        # Create payment intent using the existing service
        payment_intent = create_payment_link(
            amount=plan.price,
            customer_name=user.name,
            customer_email=email,
            customer_contact=buyer_mobile,
            description="Premium Subscription - DigiDairy",
            callback_url=os.getenv(
                "RAZORPAY_CALLBACK_URL", "https://example.com/payment-callback"
            ),
        )

        return {
            "payment_id": payment_intent["id"],
            "payment_url": payment_intent["short_url"],
            "amount": plan.price,
            "currency": "INR",
            "description": "Premium Subscription - DigiDairy",
            "customer": {
                "name": user.name,
                "email": email,
                "contact": buyer_mobile,
            },
        }
    except Exception as e:
        logger.error(f"Error creating payment intent: {e}")
        raise HTTPException(status_code=500, detail="Failed to create payment intent")


@router.get("/payment-callback")
async def payment_callback(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Handle payment callback from Razorpay after payment completion.
    This is a fallback for browser-based payments.
    """
    try:
        # Get query parameters
        payment_id = request.query_params.get("razorpay_payment_id")
        payment_link_id = request.query_params.get("razorpay_payment_link_id")
        status = request.query_params.get("razorpay_payment_link_status")
        signature = request.query_params.get("razorpay_signature")

        logger.info(
            f"Payment callback received - Status: {status}, Payment ID: {payment_id}"
        )

        # Create a simple HTML page that redirects back to the app
        if status == "paid":
            html_content = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payment Successful</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .success { color: #4CAF50; }
                    .message { margin: 20px 0; }
                </style>
            </head>
            <body>
                <h1 class="success">Payment Successful!</h1>
                <div class="message">Your payment has been completed successfully.</div>
                <div class="message">You can close this window and return to the app.</div>
                <script>
                    // Try to close the window after 3 seconds
                    setTimeout(function() {
                        window.close();
                    }, 3000);
                </script>
            </body>
            </html>
            """
        else:
            html_content = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payment Failed</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .error { color: #f44336; }
                    .message { margin: 20px 0; }
                </style>
            </head>
            <body>
                <h1 class="error">Payment Failed</h1>
                <div class="message">Your payment could not be completed.</div>
                <div class="message">You can close this window and try again in the app.</div>
                <script>
                    // Try to close the window after 3 seconds
                    setTimeout(function() {
                        window.close();
                    }, 3000);
                </script>
            </body>
            </html>
            """

        from fastapi.responses import HTMLResponse

        return HTMLResponse(content=html_content)

    except Exception as e:
        logger.error(f"Payment callback error: {e}")
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Error</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .error { color: #f44336; }
                .message { margin: 20px 0; }
            </style>
        </head>
        <body>
            <h1 class="error">Error</h1>
            <div class="message">An error occurred while processing your payment.</div>
            <div class="message">Please close this window and try again.</div>
            <script>
                setTimeout(function() {
                    window.close();
                }, 3000);
            </script>
        </body>
        </html>
        """
        from fastapi.responses import HTMLResponse

        return HTMLResponse(content=html_content)


@router.post("/razorpay_webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle Razorpay webhook for payment success and activate subscription.
    """
    try:
        secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "testsecret")
        body = await request.body()
        signature = request.headers.get("x-razorpay-signature")

        # Log all headers for debugging
        logger.info(f"Webhook headers: {dict(request.headers)}")
        logger.info(f"Webhook body length: {len(body)}")

        if not signature:
            logger.error("Webhook called without signature")
            logger.error(f"Available headers: {list(request.headers.keys())}")

            # For development/testing, allow webhooks without signature if secret is not configured
            if secret == "testsecret":
                logger.warning("Allowing webhook without signature for development")
            else:
                raise HTTPException(status_code=400, detail="Missing signature")

        # Verify webhook signature only if signature is present
        if signature:
            try:
                verify_webhook_signature(body, signature, secret)
                logger.info("Webhook signature verified successfully")
            except Exception as e:
                logger.error(f"Invalid webhook signature: {e}")
                logger.error(f"Secret used: {secret[:10]}...")
                logger.error(f"Signature received: {signature}")

                # For development/testing, allow invalid signatures if secret is not configured
                if secret == "testsecret":
                    logger.warning(
                        "Allowing webhook with invalid signature for development"
                    )
                else:
                    raise HTTPException(
                        status_code=400, detail="Invalid webhook signature"
                    )

        payload = await request.json()
        event = payload.get("event")

        logger.info(f"Webhook event: {event}")
        logger.info(f"Webhook payload keys: {list(payload.keys())}")

        if event == "payment_link.paid":
            payment_link_id = payload["payload"]["payment_link"]["entity"]["id"]
            buyer_mobile = payload["payload"]["payment_link"]["entity"]["customer"][
                "contact"
            ]

            user = (
                db.query(User)
                .filter(User.mobile == buyer_mobile, User.is_deleted == 0)
                .first()
            )
            plan = (
                db.query(SubscriptionPlan)
                .filter(SubscriptionPlan.plan_name == "Premium")
                .first()
            )

            if not user or not plan:
                logger.error(f"User or plan not found for {buyer_mobile}")
                raise HTTPException(status_code=404, detail="User or plan not found")

            # Check if subscription already activated for this payment
            existing_sub = (
                db.query(Subscription)
                .filter(
                    Subscription.buyer_mobile == buyer_mobile,
                    Subscription.subscription_type == plan.access_type,
                )
                .order_by(Subscription.created_at.desc())
                .first()
            )

            if (
                existing_sub
                and (
                    datetime.now(local_timezone).date() - existing_sub.created_at.date()
                ).days
                < 1
            ):
                logger.info(f"Subscription already activated for {buyer_mobile} today")
                return {"message": "Subscription already activated"}

            if not user or not plan:
                logger.error(f"User or plan not found for {buyer_mobile}")
                raise HTTPException(status_code=404, detail="User or plan not found")

            local_time = datetime.now(local_timezone).replace(tzinfo=None)
            start_date = local_time.date()
            end_date = start_date + timedelta(days=plan.validity - 1)

            new_entry = Subscription(
                buyer_mobile=buyer_mobile,
                start_date=start_date,
                end_date=end_date,
                subscription_type=plan.access_type,
            )

            db.add(new_entry)
            db.commit()

            logger.info(f"Premium subscription activated for {buyer_mobile}")
            return {"message": "Subscription activated"}

        logger.info(f"Webhook event received: {event}")
        return {"message": "Webhook received"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/webhook-test")
async def webhook_test():
    """
    Test endpoint to verify webhook configuration.
    """
    return {
        "status": "success",
        "message": "Webhook endpoint is accessible",
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/debug-subscription/{mobile}")
async def debug_subscription(mobile: str, db: Session = Depends(get_db)):
    """
    Debug endpoint to check subscription status for a user.
    """
    try:
        user = (
            db.query(User).filter(User.mobile == mobile, User.is_deleted == 0).first()
        )
        if not user:
            return {"error": "User not found"}

        local_time = datetime.now(local_timezone).replace(tzinfo=None)
        days_till_now = (local_time - user.registered_at).days

        # Get all subscriptions for this user
        subscriptions = (
            db.query(Subscription)
            .filter(Subscription.buyer_mobile == mobile)
            .order_by(Subscription.created_at.desc())
            .all()
        )

        # Get active subscription
        active_subscription = (
            db.query(Subscription)
            .filter(
                Subscription.buyer_mobile == mobile,
                Subscription.start_date <= local_time.date(),
                Subscription.end_date >= local_time.date(),
            )
            .first()
        )

        return {
            "user_mobile": mobile,
            "registration_date": user.registered_at.isoformat(),
            "days_since_registration": days_till_now,
            "in_free_trial": days_till_now <= 30,
            "total_subscriptions": len(subscriptions),
            "active_subscription": (
                {
                    "exists": active_subscription is not None,
                    "type": (
                        active_subscription.subscription_type
                        if active_subscription
                        else None
                    ),
                    "start_date": (
                        active_subscription.start_date.isoformat()
                        if active_subscription
                        else None
                    ),
                    "end_date": (
                        active_subscription.end_date.isoformat()
                        if active_subscription
                        else None
                    ),
                }
                if active_subscription
                else None
            ),
            "all_subscriptions": [
                {
                    "id": sub.id,
                    "type": sub.subscription_type,
                    "start_date": sub.start_date.isoformat(),
                    "end_date": sub.end_date.isoformat(),
                    "created_at": sub.created_at.isoformat(),
                }
                for sub in subscriptions
            ],
        }
    except Exception as e:
        logger.error(f"Debug subscription error: {e}")
        return {"error": str(e)}
