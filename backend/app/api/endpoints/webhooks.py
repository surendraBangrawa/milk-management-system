import logging
import json
import hmac
import hashlib
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
import httpx

from app.db.session import get_db
from app.db.models import Webhook, User
from app.middleware.security_middleware import security_middleware

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/webhooks",
    tags=["webhooks"],
)


# Pydantic models for webhooks
class WebhookCreate(BaseModel):
    name: str
    url: str
    events: List[str]  # List of events to trigger webhook
    secret_key: Optional[str] = None


class WebhookUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    events: Optional[List[str]] = None
    secret_key: Optional[str] = None
    is_active: Optional[bool] = None


class WebhookEvent(BaseModel):
    event_type: str
    data: Dict[str, Any]
    timestamp: datetime
    user_mobile: str


# Webhook event types
WEBHOOK_EVENTS = [
    "transaction.created",
    "transaction.updated",
    "transaction.deleted",
    "customer.created",
    "customer.updated",
    "customer.deleted",
    "payment.received",
    "payment.pending",
    "user.login",
    "user.logout",
    "device.registered",
    "device.removed",
]


@router.post("/")
async def create_webhook(
    request: Request,
    webhook_data: WebhookCreate,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request),
):
    """Create a new webhook"""
    try:
        # Validate events
        invalid_events = [
            event for event in webhook_data.events if event not in WEBHOOK_EVENTS
        ]
        if invalid_events:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid events: {invalid_events}. Valid events: {WEBHOOK_EVENTS}",
            )

        # Check if webhook with same name exists
        existing_webhook = (
            db.query(Webhook)
            .filter(
                Webhook.user_mobile == user_mobile,
                Webhook.name == webhook_data.name,
                Webhook.is_active == True,
            )
            .first()
        )

        if existing_webhook:
            raise HTTPException(
                status_code=400, detail="Webhook with this name already exists"
            )

        # Create webhook
        webhook = Webhook(
            user_mobile=user_mobile,
            name=webhook_data.name,
            url=webhook_data.url,
            events=webhook_data.events,
            secret_key=webhook_data.secret_key,
        )

        db.add(webhook)
        db.commit()
        db.refresh(webhook)

        # Log webhook creation
        await security_middleware._log_audit_trail(
            user_mobile=user_mobile,
            action="WEBHOOK_CREATED",
            resource_type="WEBHOOK",
            resource_id=str(webhook.id),
            request=request,
            db=db,
            new_values=webhook_data.dict(),
        )

        return {
            "id": webhook.id,
            "name": webhook.name,
            "url": webhook.url,
            "events": webhook.events,
            "is_active": webhook.is_active,
            "created_at": webhook.created_at,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create webhook error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create webhook")


@router.get("/")
async def list_webhooks(
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request),
):
    """List all webhooks for the user"""
    try:
        webhooks = db.query(Webhook).filter(Webhook.user_mobile == user_mobile).all()

        webhook_list = []
        for webhook in webhooks:
            webhook_list.append(
                {
                    "id": webhook.id,
                    "name": webhook.name,
                    "url": webhook.url,
                    "events": webhook.events,
                    "is_active": webhook.is_active,
                    "created_at": webhook.created_at,
                    "last_triggered": webhook.last_triggered,
                }
            )

        return {"webhooks": webhook_list}

    except Exception as e:
        logger.error(f"List webhooks error: {e}")
        raise HTTPException(status_code=500, detail="Failed to list webhooks")


@router.get("/{webhook_id}")
async def get_webhook(
    webhook_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request),
):
    """Get a specific webhook"""
    try:
        webhook = (
            db.query(Webhook)
            .filter(Webhook.id == webhook_id, Webhook.user_mobile == user_mobile)
            .first()
        )

        if not webhook:
            raise HTTPException(status_code=404, detail="Webhook not found")

        return {
            "id": webhook.id,
            "name": webhook.name,
            "url": webhook.url,
            "events": webhook.events,
            "is_active": webhook.is_active,
            "created_at": webhook.created_at,
            "last_triggered": webhook.last_triggered,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get webhook error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get webhook")


@router.put("/{webhook_id}")
async def update_webhook(
    webhook_id: int,
    request: Request,
    webhook_data: WebhookUpdate,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request),
):
    """Update a webhook"""
    try:
        webhook = (
            db.query(Webhook)
            .filter(Webhook.id == webhook_id, Webhook.user_mobile == user_mobile)
            .first()
        )

        if not webhook:
            raise HTTPException(status_code=404, detail="Webhook not found")

        # Store old values for audit
        old_values = {
            "name": webhook.name,
            "url": webhook.url,
            "events": webhook.events,
            "is_active": webhook.is_active,
        }

        # Update fields
        if webhook_data.name is not None:
            webhook.name = webhook_data.name
        if webhook_data.url is not None:
            webhook.url = webhook_data.url
        if webhook_data.events is not None:
            # Validate events
            invalid_events = [
                event for event in webhook_data.events if event not in WEBHOOK_EVENTS
            ]
            if invalid_events:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid events: {invalid_events}. Valid events: {WEBHOOK_EVENTS}",
                )
            webhook.events = webhook_data.events
        if webhook_data.secret_key is not None:
            webhook.secret_key = webhook_data.secret_key
        if webhook_data.is_active is not None:
            webhook.is_active = webhook_data.is_active

        db.commit()

        # Log webhook update
        await security_middleware._log_audit_trail(
            user_mobile=user_mobile,
            action="WEBHOOK_UPDATED",
            resource_type="WEBHOOK",
            resource_id=str(webhook_id),
            request=request,
            db=db,
            old_values=old_values,
            new_values=webhook_data.dict(exclude_unset=True),
        )

        return {
            "id": webhook.id,
            "name": webhook.name,
            "url": webhook.url,
            "events": webhook.events,
            "is_active": webhook.is_active,
            "created_at": webhook.created_at,
            "last_triggered": webhook.last_triggered,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update webhook error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update webhook")


@router.delete("/{webhook_id}")
async def delete_webhook(
    webhook_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request),
):
    """Delete a webhook"""
    try:
        webhook = (
            db.query(Webhook)
            .filter(Webhook.id == webhook_id, Webhook.user_mobile == user_mobile)
            .first()
        )

        if not webhook:
            raise HTTPException(status_code=404, detail="Webhook not found")

        db.delete(webhook)
        db.commit()

        # Log webhook deletion
        await security_middleware._log_audit_trail(
            user_mobile=user_mobile,
            action="WEBHOOK_DELETED",
            resource_type="WEBHOOK",
            resource_id=str(webhook_id),
            request=request,
            db=db,
        )

        return {"message": "Webhook deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete webhook error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete webhook")


@router.post("/test/{webhook_id}")
async def test_webhook(
    webhook_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request),
):
    """Test a webhook by sending a test event"""
    try:
        webhook = (
            db.query(Webhook)
            .filter(Webhook.id == webhook_id, Webhook.user_mobile == user_mobile)
            .first()
        )

        if not webhook:
            raise HTTPException(status_code=404, detail="Webhook not found")

        # Create test event
        test_event = WebhookEvent(
            event_type="webhook.test",
            data={
                "message": "This is a test webhook event",
                "timestamp": datetime.now().isoformat(),
                "webhook_id": webhook_id,
            },
            timestamp=datetime.now(),
            user_mobile=user_mobile,
        )

        # Send webhook
        success = await _send_webhook(webhook, test_event, db)

        if success:
            return {"message": "Test webhook sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send test webhook")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Test webhook error: {e}")
        raise HTTPException(status_code=500, detail="Failed to test webhook")


@router.get("/events")
async def get_webhook_events(
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request),
):
    """Get list of available webhook events"""
    return {"events": WEBHOOK_EVENTS}


async def _send_webhook(webhook: Webhook, event: WebhookEvent, db: Session) -> bool:
    """Send webhook to the configured URL"""
    try:
        # Prepare payload
        payload = {
            "event": event.event_type,
            "data": event.data,
            "timestamp": event.timestamp.isoformat(),
            "user_mobile": event.user_mobile,
        }

        # Add signature if secret key is configured
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "MilkManagementSystem/1.0",
        }

        if webhook.secret_key:
            signature = hmac.new(
                webhook.secret_key.encode(),
                json.dumps(payload, sort_keys=True).encode(),
                hashlib.sha256,
            ).hexdigest()
            headers["X-Webhook-Signature"] = f"sha256={signature}"

        # Send webhook
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(webhook.url, json=payload, headers=headers)

            # Update last triggered timestamp
            webhook.last_triggered = datetime.now()
            db.commit()

            if response.status_code >= 200 and response.status_code < 300:
                logger.info(f"Webhook sent successfully: {webhook.name}")
                return True
            else:
                logger.error(
                    f"Webhook failed: {webhook.name}, status: {response.status_code}"
                )
                return False

    except Exception as e:
        logger.error(f"Error sending webhook {webhook.name}: {e}")
        return False


# Global webhook dispatcher
async def dispatch_webhook_event(event: WebhookEvent, db: Session):
    """Dispatch webhook event to all registered webhooks"""
    try:
        # Get all active webhooks for the user that subscribe to this event
        webhooks = (
            db.query(Webhook)
            .filter(Webhook.user_mobile == event.user_mobile, Webhook.is_active == True)
            .all()
        )

        # Filter webhooks that subscribe to this event
        matching_webhooks = [
            webhook for webhook in webhooks if event.event_type in webhook.events
        ]

        # Send webhooks concurrently
        tasks = [_send_webhook(webhook, event, db) for webhook in matching_webhooks]

        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            success_count = sum(1 for result in results if result is True)
            logger.info(
                f"Dispatched {event.event_type} to {len(matching_webhooks)} webhooks, {success_count} successful"
            )

    except Exception as e:
        logger.error(f"Error dispatching webhook event {event.event_type}: {e}")
