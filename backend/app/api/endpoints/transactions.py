from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.schemas.transactions import (
    AddExpenseRecordRequest,
    AddMilkRecordRequest,
    GetTransactionsRequest,
    GetTransactionsSellerRequest,
)
from app.db.session import get_db
from app.db.models import Customer, MilkRecord, ExpenseRecord, User
from app.core.security import get_current_user
from app.core.config import local_timezone
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/transactions",
    tags=["transactions"],
)


def update_total_till_records(
    db: Session,
    buyer_mobile: str,
    seller_mobile: str,
    added_at_date: datetime,
    diff: float,
):

    future_milk_records = (
        db.query(MilkRecord)
        .filter(
            MilkRecord.buyer_mobile == buyer_mobile,
            MilkRecord.seller_mobile == seller_mobile,
            MilkRecord.is_deleted == 0,
            MilkRecord.added_at > added_at_date,
        )
        .order_by(MilkRecord.added_at.asc())
        .all()
    )

    future_expense_records = (
        db.query(ExpenseRecord)
        .filter(
            ExpenseRecord.buyer_mobile == buyer_mobile,
            ExpenseRecord.seller_mobile == seller_mobile,
            ExpenseRecord.is_deleted == 0,
            ExpenseRecord.added_at > added_at_date,
        )
        .order_by(ExpenseRecord.added_at.asc())
        .all()
    )

    all_future_records = sorted(
        future_milk_records + future_expense_records,
        key=lambda record: (record.added_at),
    )

    for record in all_future_records:
        record.total_till_record = round(record.total_till_record + diff, 2)

    db.commit()


@router.post("/add_milk_record")
def add_milk_record(
    record: AddMilkRecordRequest,
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
):
    try:
        logger.info(f"In add milk record api")
        local_time = datetime.now(local_timezone).replace(tzinfo=None)
        customer_info = (
            db.query(Customer)
            .filter(
                Customer.added_under == buyer_mobile,
                Customer.mobile == record.seller_mobile,
                Customer.is_deleted == 0,
            )
            .first()
        )
        if not customer_info:
            raise HTTPException(
                status_code=404, detail="Entered customer doesn't exist under you"
            )

        if record.custom_date is None:
            record.custom_date = local_time

        if record.shift is None:
            current_hour = local_time.hour
            if 3 <= current_hour < 15:
                record.shift = "M"
            else:
                record.shift = "E"

        if record.shift not in ["M", "E"]:
            raise HTTPException(
                status_code=400, detail="Shift must be 'M' (Morning) or 'E' (Evening)"
            )

        latest_milk_record = (
            db.query(MilkRecord)
            .filter(
                MilkRecord.buyer_mobile == buyer_mobile,
                MilkRecord.seller_mobile == record.seller_mobile,
                MilkRecord.is_deleted == 0,
            )
            .order_by(MilkRecord.added_at.desc())
            .first()
        )

        latest_expense_record = (
            db.query(ExpenseRecord)
            .filter(
                ExpenseRecord.buyer_mobile == buyer_mobile,
                ExpenseRecord.seller_mobile == record.seller_mobile,
                ExpenseRecord.is_deleted == 0,
            )
            .order_by(ExpenseRecord.added_at.desc())
            .first()
        )

        latest_record = None
        if latest_milk_record and latest_expense_record:
            if latest_milk_record.added_at > latest_expense_record.added_at:
                latest_record = latest_milk_record
            else:
                latest_record = latest_expense_record
        elif latest_milk_record:
            latest_record = latest_milk_record
        elif latest_expense_record:
            latest_record = latest_expense_record

        total_till_previous = latest_record.total_till_record if latest_record else 0

        quantity = round(record.quantity, 2)
        fat = round(record.fat, 2) if record.fat is not None else None
        snf = round(record.snf, 2) if record.snf is not None else None
        rate = round(record.rate, 2)
        total_till_record = round(total_till_previous + (quantity * rate), 2)

        new_record = MilkRecord(
            buyer_mobile=buyer_mobile,
            seller_mobile=record.seller_mobile,
            quantity=quantity,
            fat=fat,
            snf=snf,
            rate=rate,
            shift=record.shift,
            milk_detail=record.milk_detail,
            total_till_record=total_till_record,
            custom_date=record.custom_date,
        )

        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        return {
            "message": "Milk record added successfully!",
            "buyer_mobile": buyer_mobile,
            "shift": record.shift,
            "custom_date": record.custom_date,
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")


@router.post("/add_expense")
def add_expense(
    record: AddExpenseRecordRequest,
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
):
    try:
        logger.info(f"In add expense api")
        local_time = datetime.now(local_timezone).replace(tzinfo=None)
        customer_info = (
            db.query(Customer)
            .filter(
                Customer.added_under == buyer_mobile,
                Customer.mobile == record.seller_mobile,
                Customer.is_deleted == 0,
            )
            .first()
        )
        if not customer_info:
            raise HTTPException(
                status_code=404, detail="Entered customer doesn't exist under you"
            )

        if record.custom_date is None:
            record.custom_date = local_time
        else:
            record.custom_date = datetime.combine(record.custom_date, local_time.time())

        amount = round(record.amount, 2)
        if record.transaction_type == "GAVE":
            amount = -amount

        previous_record_expense = (
            db.query(ExpenseRecord)
            .filter(
                ExpenseRecord.buyer_mobile == buyer_mobile,
                ExpenseRecord.seller_mobile == record.seller_mobile,
                ExpenseRecord.is_deleted == 0,
            )
            .order_by(ExpenseRecord.added_at.desc())
            .first()
        )

        previous_record_milk = (
            db.query(MilkRecord)
            .filter(
                MilkRecord.buyer_mobile == buyer_mobile,
                MilkRecord.seller_mobile == record.seller_mobile,
                MilkRecord.is_deleted == 0,
            )
            .order_by(MilkRecord.added_at.desc())
            .first()
        )

        latest_record = None
        if previous_record_expense and previous_record_milk:
            latest_record = (
                previous_record_expense
                if previous_record_expense.added_at > previous_record_milk.added_at
                else previous_record_milk
            )
        else:
            latest_record = previous_record_expense or previous_record_milk

        total_till_previous = latest_record.total_till_record if latest_record else 0.00
        total_till_record = round(total_till_previous + amount, 2)

        new_expense = ExpenseRecord(
            buyer_mobile=buyer_mobile,
            seller_mobile=record.seller_mobile,
            amount=amount,
            expense_detail=record.expense_detail,
            total_till_record=total_till_record,
            custom_date=record.custom_date,
        )

        db.add(new_expense)
        db.commit()
        db.refresh(new_expense)

        return {
            "message": "Expense added successfully!",
            "buyer_mobile": buyer_mobile,
            "transaction_type": record.transaction_type,
            "amount": amount,
            "total_till_record": total_till_record,
            "custom_date": record.custom_date,
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")


@router.delete("/delete_transaction")
def delete_transaction(
    record_id: int,
    record_type: str,
    seller_mobile: str,
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
):
    try:
        logger.info(f"In delete transaction")
        if record_type.lower() == "milk":
            record_for_delete = (
                db.query(MilkRecord)
                .filter(
                    MilkRecord.id == record_id,
                    MilkRecord.buyer_mobile == buyer_mobile,
                    MilkRecord.seller_mobile == seller_mobile,
                    MilkRecord.is_deleted == 0,
                )
                .first()
            )
            diff = (
                record_for_delete.quantity * record_for_delete.rate
                if record_for_delete
                else 0
            )
        else:
            record_for_delete = (
                db.query(ExpenseRecord)
                .filter(
                    ExpenseRecord.expense_id == record_id,
                    ExpenseRecord.buyer_mobile == buyer_mobile,
                    ExpenseRecord.seller_mobile == seller_mobile,
                    ExpenseRecord.is_deleted == 0,
                )
                .first()
            )
            diff = record_for_delete.amount if record_for_delete else 0

        if not record_for_delete:
            raise HTTPException(status_code=404, detail="Transaction not found")

        added_at_date = record_for_delete.added_at

        update_total_till_records(db, buyer_mobile, seller_mobile, added_at_date, -diff)
        db.delete(record_for_delete)
        db.commit()

        return {"message": "Transaction deleted successfully"}
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")


@router.put("/edit_transaction")
def edit_transaction(
    record_id: int,
    record_type: str,
    seller_mobile: str,
    updated_data: dict = Body(...),
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
):
    try:
        local_time = datetime.now(local_timezone).replace(tzinfo=None)
        if record_type.lower() == "milk":
            record_for_update = (
                db.query(MilkRecord)
                .filter(
                    MilkRecord.id == record_id,
                    MilkRecord.buyer_mobile == buyer_mobile,
                    MilkRecord.seller_mobile == seller_mobile,
                    MilkRecord.is_deleted == 0,
                )
                .first()
            )

            previous_amount = record_for_update.quantity * record_for_update.rate
        else:
            record_for_update = (
                db.query(ExpenseRecord)
                .filter(
                    ExpenseRecord.expense_id == record_id,
                    ExpenseRecord.buyer_mobile == buyer_mobile,
                    ExpenseRecord.seller_mobile == seller_mobile,
                    ExpenseRecord.is_deleted == 0,
                )
                .first()
            )
            previous_amount = record_for_update.amount

        if not record_for_update:
            raise HTTPException(status_code=404, detail="Transaction not found")

        added_at_date = record_for_update.added_at

        if record_type.lower() == "milk":
            new_quantity = updated_data.get("quantity", record_for_update.quantity)
            new_rate = updated_data.get("rate", record_for_update.rate)
            new_amount = round(float(new_quantity) * float(new_rate), 2)
        else:
            new_amount = round(
                float(updated_data.get("amount", record_for_update.amount)), 2
            )

        diff = new_amount - previous_amount

        for key, value in updated_data.items():
            if hasattr(record_for_update, key) and value is not None:
                setattr(record_for_update, key, value)

        record_for_update.updated_at = local_time
        record_for_update.total_till_record = round(
            record_for_update.total_till_record + diff, 2
        )
        db.commit()

        update_total_till_records(db, buyer_mobile, seller_mobile, added_at_date, diff)

        return {
            "message": "Transaction updated successfully",
            "updated_record": record_for_update,
        }

    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")


@router.get("/get_transactions_buyer")
def get_transactions_buyer(
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
    request: GetTransactionsRequest = Depends(),
):
    try:
        seller_mobile = request.seller_mobile
        return update_balances(db, buyer_mobile, seller_mobile, negate_total=True)
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")


@router.get("/get_transactions_seller")
def get_transactions_seller(
    db: Session = Depends(get_db),
    seller_mobile: str = Depends(get_current_user),
    request: GetTransactionsSellerRequest = Depends(),
):
    try:
        buyer_mobile = request.buyer_mobile
        logger.info(f"buyer_mobile : {buyer_mobile}")
        logger.info(f"seller_mobile : {seller_mobile}")
        return update_balances(db, buyer_mobile, seller_mobile)
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")


def update_balances(
    db: Session, buyer_mobile: str, seller_mobile: str, negate_total: bool = False
):
    transactions = []
    running_balance = 0.00

    milk_records = (
        db.query(MilkRecord)
        .filter(
            MilkRecord.buyer_mobile == buyer_mobile,
            MilkRecord.seller_mobile == seller_mobile,
            MilkRecord.is_deleted == 0,
        )
        .all()
    )

    expense_records = (
        db.query(ExpenseRecord)
        .filter(
            ExpenseRecord.buyer_mobile == buyer_mobile,
            ExpenseRecord.seller_mobile == seller_mobile,
            ExpenseRecord.is_deleted == 0,
        )
        .all()
    )

    all_records = [
        {"type": "milk", "record": record, "amount": record.quantity * record.rate}
        for record in milk_records
    ] + [
        {"type": "expense", "record": record, "amount": record.amount}
        for record in expense_records
    ]

    all_records.sort(key=lambda x: (x["record"].added_at))

    for entry in all_records:
        if entry["type"] == "milk":
            running_balance += entry["amount"]
        else:
            running_balance += entry["amount"]

        entry["record"].total_till_record = round(running_balance, 2)

        total = (
            -round(entry["record"].total_till_record, 2)
            if negate_total
            else round(entry["record"].total_till_record, 2)
        )
        amt = -round(entry["amount"], 2) if negate_total else round(entry["amount"], 2)

        transaction_data = {
            "id": (
                entry["record"].id
                if entry["type"] == "milk"
                else entry["record"].expense_id
            ),
            "type": entry["type"],
            "amount": amt,
            "custom_date": entry["record"].custom_date,
            "added_at": entry["record"].added_at,
            "buyer_mobile": entry["record"].buyer_mobile,
            "seller_mobile": entry["record"].seller_mobile,
            "total_till_record": total,
            "updated_at": getattr(entry["record"], "updated_at", None),
        }

        if entry["type"] == "milk":
            for field in ["quantity", "fat", "snf", "rate", "milk_detail"]:
                if hasattr(entry["record"], field):
                    transaction_data[field] = getattr(entry["record"], field)
        elif entry["type"] == "expense":
            for field in ["expense_detail"]:
                if hasattr(entry["record"], field):
                    transaction_data[field] = getattr(entry["record"], field)

        transactions.append(transaction_data)

    db.commit()

    return transactions


@router.get("/get_seller_summary")
def get_seller_summary(
    db: Session = Depends(get_db), buyer_mobile: str = Depends(get_current_user)
):
    try:
        seller_details = []

        sellers = (
            db.query(Customer)
            .filter(Customer.added_under == buyer_mobile, Customer.is_deleted == 0)
            .all()
        )

        for seller in sellers:
            seller_mobile = seller.mobile
            seller_name = seller.name
            last_record_milk = (
                db.query(MilkRecord)
                .filter(
                    MilkRecord.seller_mobile == seller_mobile,
                    MilkRecord.buyer_mobile == buyer_mobile,
                    MilkRecord.is_deleted == 0,
                )
                .order_by(MilkRecord.added_at.desc())
                .first()
            )

            last_record_expense = (
                db.query(ExpenseRecord)
                .filter(
                    ExpenseRecord.seller_mobile == seller_mobile,
                    ExpenseRecord.buyer_mobile == buyer_mobile,
                    ExpenseRecord.is_deleted == 0,
                )
                .order_by(ExpenseRecord.added_at.desc())
                .first()
            )

            if last_record_milk is None and last_record_expense is None:
                seller_balance = 0
                updated_date = None
            else:
                if last_record_milk and last_record_expense:
                    last_record = (
                        last_record_milk
                        if last_record_milk.added_at > last_record_expense.added_at
                        else last_record_expense
                    )
                elif last_record_milk:
                    last_record = last_record_milk
                else:
                    last_record = last_record_expense

                seller_balance = last_record.total_till_record
                updated_date = last_record.added_at

            seller_details.append(
                {
                    "name": seller_name,
                    "mobile": seller_mobile,
                    "balance": -seller_balance,
                    "date": updated_date,
                }
            )
        return {
            "message": "Seller details fetched successfully",
            "seller_details": seller_details,
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")


@router.get("/get_buyer_summary")
def get_Buyer_summary(
    db: Session = Depends(get_db), seller_mobile: str = Depends(get_current_user)
):
    try:
        buyer_details = []

        buyers = (
            db.query(Customer)
            .filter(Customer.mobile == seller_mobile, Customer.is_deleted == 0)
            .all()
        )

        for buyer in buyers:
            buyer_mobile = buyer.added_under
            buyer_name = None
            buyer_info = (
                db.query(User)
                .filter(User.mobile == buyer_mobile, User.is_deleted == 0)
                .first()
            )
            if buyer_info:
                buyer_name = buyer_info.name

            last_record_milk = (
                db.query(MilkRecord)
                .filter(
                    MilkRecord.seller_mobile == seller_mobile,
                    MilkRecord.buyer_mobile == buyer_mobile,
                    MilkRecord.is_deleted == 0,
                )
                .order_by(MilkRecord.added_at.desc())
                .first()
            )

            last_record_expense = (
                db.query(ExpenseRecord)
                .filter(
                    ExpenseRecord.seller_mobile == seller_mobile,
                    ExpenseRecord.buyer_mobile == buyer_mobile,
                    ExpenseRecord.is_deleted == 0,
                )
                .order_by(ExpenseRecord.added_at.desc())
                .first()
            )

            if last_record_milk is None and last_record_expense is None:
                buyer_balance = 0
                updated_date = None
            else:
                if last_record_milk and last_record_expense:
                    last_record = (
                        last_record_milk
                        if last_record_milk.added_at > last_record_expense.added_at
                        else last_record_expense
                    )
                elif last_record_milk:
                    last_record = last_record_milk
                else:
                    last_record = last_record_expense

                buyer_balance = last_record.total_till_record
                updated_date = last_record.added_at

            buyer_details.append(
                {
                    "name": buyer_name,
                    "mobile": buyer_mobile,
                    "balance": buyer_balance,
                    "date": updated_date,
                }
            )
        return {
            "message": "Buyer details fetched successfully",
            "buyer_details": buyer_details,
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")
