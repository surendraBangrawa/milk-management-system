import logging
import json
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.db.models import OfflineSync, MilkRecord, ExpenseRecord, User
from app.middleware.security_middleware import (
    security_middleware,
    get_current_user_enhanced,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/offline-sync",
    tags=["offline-sync"],
)


# Pydantic models for offline sync
class OfflineTransaction(BaseModel):
    id: Optional[str] = None  # Local ID for offline transactions
    type: str  # "milk" or "expense"
    data: Dict[str, Any]
    timestamp: datetime
    device_id: str


class SyncRequest(BaseModel):
    device_id: str
    sync_token: Optional[str] = None
    offline_transactions: List[OfflineTransaction] = []
    last_sync: Optional[datetime] = None


class SyncResponse(BaseModel):
    sync_token: str
    server_time: datetime
    conflicts: List[Dict[str, Any]] = []
    synced_transactions: List[Dict[str, Any]] = []


@router.post("/sync")
async def sync_offline_data(
    request: Request,
    sync_data: SyncRequest,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(get_current_user_enhanced),
):
    """Sync offline transactions with server"""
    try:
        # Get or create sync record
        sync_record = (
            db.query(OfflineSync)
            .filter(
                OfflineSync.user_mobile == user_mobile,
                OfflineSync.device_id == sync_data.device_id,
            )
            .first()
        )

        if not sync_record:
            # Create new sync record
            sync_token = hashlib.md5(
                f"{user_mobile}_{sync_data.device_id}_{datetime.now()}".encode()
            ).hexdigest()
            sync_record = OfflineSync(
                user_mobile=user_mobile,
                device_id=sync_data.device_id,
                sync_token=sync_token,
                last_sync=datetime.now(),
            )
            db.add(sync_record)
        else:
            sync_token = sync_record.sync_token
            sync_record.last_sync = datetime.now()

        # Process offline transactions
        synced_transactions = []
        conflicts = []

        for offline_tx in sync_data.offline_transactions:
            try:
                if offline_tx.type == "milk":
                    result = await _process_offline_milk_transaction(
                        offline_tx, user_mobile, db
                    )
                elif offline_tx.type == "expense":
                    result = await _process_offline_expense_transaction(
                        offline_tx, user_mobile, db
                    )
                else:
                    conflicts.append(
                        {"local_id": offline_tx.id, "error": "Unknown transaction type"}
                    )
                    continue

                if result.get("success"):
                    synced_transactions.append(
                        {
                            "local_id": offline_tx.id,
                            "server_id": result.get("server_id"),
                            "type": offline_tx.type,
                        }
                    )
                else:
                    conflicts.append(
                        {"local_id": offline_tx.id, "error": result.get("error")}
                    )

            except Exception as e:
                logger.error(f"Error processing offline transaction: {e}")
                conflicts.append({"local_id": offline_tx.id, "error": str(e)})

        # Get server changes since last sync
        server_changes = await _get_server_changes(user_mobile, sync_data.last_sync, db)

        db.commit()

        return SyncResponse(
            sync_token=sync_token,
            server_time=datetime.now(),
            conflicts=conflicts,
            synced_transactions=synced_transactions,
            server_changes=server_changes,
        )

    except Exception as e:
        logger.error(f"Offline sync error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Sync failed")


async def _process_offline_milk_transaction(
    offline_tx: OfflineTransaction, user_mobile: str, db: Session
) -> Dict[str, Any]:
    """Process offline milk transaction"""
    try:
        data = offline_tx.data

        # Validate required fields
        required_fields = ["seller_mobile", "quantity", "rate", "shift"]
        for field in required_fields:
            if field not in data:
                return {"success": False, "error": f"Missing required field: {field}"}

        # Create milk record
        milk_record = MilkRecord(
            buyer_mobile=user_mobile,
            seller_mobile=data["seller_mobile"],
            quantity=float(data["quantity"]),
            fat=data.get("fat"),
            snf=data.get("snf"),
            rate=float(data["rate"]),
            shift=data["shift"],
            milk_detail=data.get("milk_detail"),
            total_till_record=0,  # Will be calculated by existing logic
            custom_date=offline_tx.timestamp,
            device_id=offline_tx.device_id,
            sync_status="synced",
        )

        # Add GPS and media data if available
        if "location_lat" in data and "location_lng" in data:
            milk_record.location_lat = float(data["location_lat"])
            milk_record.location_lng = float(data["location_lng"])

        if "photo_url" in data:
            milk_record.photo_url = data["photo_url"]

        if "barcode_data" in data:
            milk_record.barcode_data = data["barcode_data"]

        if "voice_note_url" in data:
            milk_record.voice_note_url = data["voice_note_url"]

        db.add(milk_record)
        db.flush()  # Get the ID without committing

        return {"success": True, "server_id": milk_record.id}

    except Exception as e:
        logger.error(f"Error processing offline milk transaction: {e}")
        return {"success": False, "error": str(e)}


async def _process_offline_expense_transaction(
    offline_tx: OfflineTransaction, user_mobile: str, db: Session
) -> Dict[str, Any]:
    """Process offline expense transaction"""
    try:
        data = offline_tx.data

        # Validate required fields
        required_fields = ["seller_mobile", "amount"]
        for field in required_fields:
            if field not in data:
                return {"success": False, "error": f"Missing required field: {field}"}

        # Create expense record
        expense_record = ExpenseRecord(
            buyer_mobile=user_mobile,
            seller_mobile=data["seller_mobile"],
            amount=float(data["amount"]),
            expense_detail=data.get("expense_detail"),
            total_till_record=0,  # Will be calculated by existing logic
            custom_date=offline_tx.timestamp,
            category=data.get("category"),
            device_id=offline_tx.device_id,
            sync_status="synced",
        )

        # Add GPS and media data if available
        if "location_lat" in data and "location_lng" in data:
            expense_record.location_lat = float(data["location_lat"])
            expense_record.location_lng = float(data["location_lng"])

        if "receipt_url" in data:
            expense_record.receipt_url = data["receipt_url"]

        db.add(expense_record)
        db.flush()  # Get the ID without committing

        return {"success": True, "server_id": expense_record.expense_id}

    except Exception as e:
        logger.error(f"Error processing offline expense transaction: {e}")
        return {"success": False, "error": str(e)}


async def _get_server_changes(
    user_mobile: str, last_sync: Optional[datetime], db: Session
) -> List[Dict[str, Any]]:
    """Get server changes since last sync"""
    try:
        changes = []

        if last_sync:
            # Get milk records changed since last sync
            milk_records = (
                db.query(MilkRecord)
                .filter(
                    MilkRecord.buyer_mobile == user_mobile,
                    MilkRecord.updated_at >= last_sync,
                    MilkRecord.is_deleted == False,
                )
                .all()
            )

            for record in milk_records:
                changes.append(
                    {
                        "type": "milk",
                        "id": record.id,
                        "action": "update",
                        "data": {
                            "seller_mobile": record.seller_mobile,
                            "quantity": record.quantity,
                            "fat": record.fat,
                            "snf": record.snf,
                            "rate": record.rate,
                            "shift": record.shift,
                            "milk_detail": record.milk_detail,
                            "custom_date": record.custom_date.isoformat(),
                            "updated_at": (
                                record.updated_at.isoformat()
                                if record.updated_at
                                else None
                            ),
                        },
                    }
                )

            # Get expense records changed since last sync
            expense_records = (
                db.query(ExpenseRecord)
                .filter(
                    ExpenseRecord.buyer_mobile == user_mobile,
                    ExpenseRecord.updated_at >= last_sync,
                    ExpenseRecord.is_deleted == False,
                )
                .all()
            )

            for record in expense_records:
                changes.append(
                    {
                        "type": "expense",
                        "id": record.expense_id,
                        "action": "update",
                        "data": {
                            "seller_mobile": record.seller_mobile,
                            "amount": record.amount,
                            "expense_detail": record.expense_detail,
                            "category": record.category,
                            "custom_date": record.custom_date.isoformat(),
                            "updated_at": (
                                record.updated_at.isoformat()
                                if record.updated_at
                                else None
                            ),
                        },
                    }
                )

        return changes

    except Exception as e:
        logger.error(f"Error getting server changes: {e}")
        return []


@router.get("/status/{device_id}")
async def get_sync_status(
    device_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(get_current_user_enhanced),
):
    """Get sync status for a device"""
    try:
        sync_record = (
            db.query(OfflineSync)
            .filter(
                OfflineSync.user_mobile == user_mobile,
                OfflineSync.device_id == device_id,
            )
            .first()
        )

        if not sync_record:
            return {
                "device_id": device_id,
                "synced": False,
                "last_sync": None,
                "sync_token": None,
            }

        return {
            "device_id": device_id,
            "synced": True,
            "last_sync": sync_record.last_sync.isoformat(),
            "sync_token": sync_record.sync_token,
        }

    except Exception as e:
        logger.error(f"Get sync status error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get sync status")


@router.delete("/device/{device_id}")
async def remove_sync_device(
    device_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(get_current_user_enhanced),
):
    """Remove sync record for a device"""
    try:
        sync_record = (
            db.query(OfflineSync)
            .filter(
                OfflineSync.user_mobile == user_mobile,
                OfflineSync.device_id == device_id,
            )
            .first()
        )

        if sync_record:
            db.delete(sync_record)
            db.commit()

        return {"message": "Sync device removed successfully"}

    except Exception as e:
        logger.error(f"Remove sync device error: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove sync device")
