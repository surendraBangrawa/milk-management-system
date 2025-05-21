from fastapi import APIRouter, Depends, HTTPException, Body, Query, Response
from sqlalchemy.orm import Session
from app.schemas.transactions import (
    AddExpenseRecordRequest,
    AddMilkRecordRequest,
    GetTransactionsRequest,
    GetTransactionsSellerRequest,
    GetTotalDateBasisRecordRequest,
    GetCustomersDateBasisRecordRequest,
)
from app.db.session import get_db
from app.db.models import Customer, MilkRecord, ExpenseRecord, User
from app.core.security import get_current_user
from app.core.config import local_timezone
from datetime import datetime, date, time, timedelta
import logging
from sqlalchemy import func
from typing import Optional

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


@router.get("/get_transactions_customer")
def get_transactions_customer(
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


@router.get("/get_transactions_supplier")
def get_transactions_supplier(
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


@router.get("/get_customer_summary")
def get_customer_summary(
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


@router.get("/get_supplier_summary")
def get_supplier_summary(
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
    
@router.get('/total_record_date_range')
def get_total_records(
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
    request: GetTotalDateBasisRecordRequest = Depends(),
    shift: Optional[str] = Query(None, description="Optional filter for shift ('M' for Morning, 'E' for Evening)"),
):
    if not request.start_date or not request.end_date:
        raise HTTPException(
            status_code=400, # Bad Request
            detail="Both start_date and end_date are required."
        )

    if request.start_date > request.end_date:
        raise HTTPException(
            status_code=400, # Bad Request
            detail="start_date cannot be after end_date."
        )

    try:
        # Optimized: Calculate total milk quantity and amount in a single query
        milk_summary_query = db.query(
            func.sum(MilkRecord.quantity).label("total_quantity"),
            func.sum(MilkRecord.quantity * MilkRecord.rate).label("total_amount")
        ).filter(
            MilkRecord.buyer_mobile == buyer_mobile,
            MilkRecord.is_deleted == False, # Use False for boolean
            MilkRecord.custom_date >= request.start_date,
            MilkRecord.custom_date <= request.end_date
        )

        # Add optional filter for shift
        if shift:
            if shift.upper() not in ['M', 'E']:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid shift value. Must be 'M' or 'E'."
                )
            milk_summary_query = milk_summary_query.filter(MilkRecord.shift == shift.upper())


        milk_summary_result = milk_summary_query.first() # Returns a Row or None

        if milk_summary_result:
            # If sum results in None (e.g., no records or all values are NULL), default to 0.0
            total_milk_quantity = milk_summary_result.total_quantity or 0.0
            total_milk_amount = (-1 * (milk_summary_result.total_amount)) or 0.0
        else:
            # If no rows match, .first() is None, so both are 0.
            total_milk_quantity = 0.0
            total_milk_amount = 0.0


        # Calculate total expense amount (still a separate query as it's a different table)
        # Assuming ExpenseRecord has an 'amount' field for its value
        total_expense_amount = (
            db.query(func.sum(ExpenseRecord.amount).label("total_expense"))
            .filter(
                ExpenseRecord.buyer_mobile == buyer_mobile,
                ExpenseRecord.is_deleted == False,
                ExpenseRecord.custom_date >= request.start_date,
                ExpenseRecord.custom_date <= request.end_date
            )
            .scalar() # Gets the first column of the first row, or None
        )

        data = {
            "total_milk_quantity": total_milk_quantity, # Already defaulted to 0.0 if None
            "total_milk_amount": total_milk_amount,     # Already defaulted to 0.0 if None
            "total_expense_amount": (-1*(total_expense_amount)) or 0.0 # Handle None if no records
        }
        return data
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")


@router.get('/customer_record_date_range')
def customer_record_date_range(
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
    request: GetCustomersDateBasisRecordRequest = Depends(),
    shift: Optional[str] = Query(None, description="Optional filter for shift ('M' for Morning, 'E' for Evening)"),
):
    if not request.start_date or not request.end_date:
        raise HTTPException(
            status_code=400, # Bad Request
            detail="Both start_date and end_date are required."
        )

    if request.start_date > request.end_date:
        raise HTTPException(
            status_code=400, # Bad Request
            detail="start_date cannot be after end_date."
        )

    try:
        # Optimized: Calculate total milk quantity and amount in a single query
        milk_summary_query = db.query(
            func.sum(MilkRecord.quantity).label("total_quantity"),
            func.sum(MilkRecord.quantity * MilkRecord.rate).label("total_amount")
        ).filter(
            MilkRecord.buyer_mobile == buyer_mobile,
            MilkRecord.is_deleted == False, # Use False for boolean
            MilkRecord.custom_date >= request.start_date,
            MilkRecord.custom_date <= request.end_date,
            MilkRecord.seller_mobile == request.seller_mobile
        )

        # Add optional filter for shift
        if shift:
            if shift.upper() not in ['M', 'E']:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid shift value. Must be 'M' or 'E'."
                )
            milk_summary_query = milk_summary_query.filter(MilkRecord.shift == shift.upper())


        milk_summary_result = milk_summary_query.first() # Returns a Row or None

        if milk_summary_result:
            # If sum results in None (e.g., no records or all values are NULL), default to 0.0
            total_milk_quantity = milk_summary_result.total_quantity or 0.0
            total_milk_amount = (-1*(milk_summary_result.total_amount)) or 0.0
        else:
            # If no rows match, .first() is None, so both are 0.
            total_milk_quantity = 0.0
            total_milk_amount = 0.0


        # Calculate total expense amount (still a separate query as it's a different table)
        # Assuming ExpenseRecord has an 'amount' field for its value
        total_expense_amount = (
            db.query(func.sum(ExpenseRecord.amount).label("total_expense"))
            .filter(
                ExpenseRecord.buyer_mobile == buyer_mobile,
                ExpenseRecord.is_deleted == False,
                ExpenseRecord.custom_date >= request.start_date,
                ExpenseRecord.custom_date <= request.end_date,
                ExpenseRecord.seller_mobile == request.seller_mobile
            )
            .scalar() # Gets the first column of the first row, or None
        )

        data = {
            "total_milk_quantity": total_milk_quantity, # Already defaulted to 0.0 if None
            "total_milk_amount": total_milk_amount,     # Already defaulted to 0.0 if None
            "total_expense_amount": (-1*(total_expense_amount)) or 0.0 # Handle None if no records
        }
        return data
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")
    

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageTemplate, Frame, PageBreak, KeepTogether  # Import PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from io import BytesIO
from reportlab.lib.units import inch  # Import inch
from reportlab.pdfbase import pdfmetrics



@router.get('/generate_milk_report', response_class=Response)
def generate_milk_report(
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
    request: GetCustomersDateBasisRecordRequest = Depends(),
):
    try:
        seller_data = db.query(Customer).filter(
            Customer.mobile == request.seller_mobile,
            Customer.added_under == buyer_mobile,
            Customer.is_deleted == 0).first()

        buyer_data = db.query(User).filter(
            User.mobile == buyer_mobile,
            User.is_deleted == 0).first()

        if not buyer_data:
            buyer_name = "Customer"
            raise HTTPException(status_code=404, detail="Buyer not found")
        else:
            buyer_name = buyer_data.name.title()

        if not seller_data:
            raise HTTPException(status_code=404, detail="Seller not found")

        adjusted_end_date = datetime.combine(request.end_date, time.max)

        milk_records = db.query(MilkRecord).filter(
            MilkRecord.seller_mobile == request.seller_mobile,
            MilkRecord.is_deleted == False,
            MilkRecord.custom_date >= request.start_date,
            MilkRecord.custom_date <= adjusted_end_date
        ).order_by(MilkRecord.custom_date.desc()).all()

        expense_records = db.query(ExpenseRecord).filter(
            ExpenseRecord.seller_mobile == request.seller_mobile,
            ExpenseRecord.is_deleted == False,
            ExpenseRecord.custom_date >= request.start_date,
            ExpenseRecord.custom_date <= adjusted_end_date
        ).order_by(ExpenseRecord.custom_date.desc()).all()

        total_milk_quantity = sum(record.quantity for record in milk_records)
        total_milk_amount = sum((record.quantity * record.rate) if record.rate is not None else 0 for record in milk_records)
        total_expense_amount = sum(record.amount for record in expense_records)
        total_net_amount = total_milk_amount - total_expense_amount

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, title="Milk Record", topMargin=40, bottomMargin=20)
        styles = getSampleStyleSheet()

        centered_style = ParagraphStyle(name='Centered', parent=styles['h1'], alignment=1, fontName='NotoSans-Bold' if 'NotoSans-Bold' in pdfmetrics.getRegisteredFontNames() else 'Helvetica-Bold')
        left_aligned_style = ParagraphStyle(name='LeftAligned', parent=styles['Normal'], alignment=0, fontName='NotoSans-Bold' if 'NotoSans-Bold' in pdfmetrics.getRegisteredFontNames() else 'Helvetica-Bold')
        centered_left_aligned_style = ParagraphStyle(name='CenteredLeftAligned', parent=left_aligned_style, alignment=1, fontName='NotoSans-Bold' if 'NotoSans-Bold' in pdfmetrics.getRegisteredFontNames() else 'Helvetica-Bold')
        normal_text_style = ParagraphStyle(name='NormalText', parent=styles['Normal'], fontName='NotoSans' if 'NotoSans' in pdfmetrics.getRegisteredFontNames() else 'Helvetica')
        bold_normal_text_style = ParagraphStyle(name='BoldNormalText', parent=styles['Normal'], fontName='NotoSans-Bold' if 'NotoSans-Bold' in pdfmetrics.getRegisteredFontNames() else 'Helvetica-Bold')

        story = []

        header = Paragraph("Aapka DudhBahi", centered_style)
        story.append(header)
        story.append(Spacer(1, 18))

        payment_message = ""
        if total_net_amount < 0:
            payment_message = f"{total_net_amount:.2f} ({seller_data.name.title()} pays to {buyer_name})"
        elif total_net_amount > 0:
            payment_message = f"{total_net_amount:.2f} ({buyer_name} pays to {seller_data.name.title()})"
        else:
            payment_message = "No net payment due."

        info_table_data = [
            ["Name:", seller_data.name.title()],
            ["Mobile No.:", seller_data.mobile],
            ["Download Date:", date.today().strftime("%d-%m-%Y")],
            ["Total Milk Quantity(L/Kg):", f"{total_milk_quantity:.2f}"],
            ["Total Milk Amount:", f"{total_milk_amount:.2f}"],
            ["Total Expense Amount:", f"{total_expense_amount:.2f}"],
            ["Net Amount (Milk - Expense):", Paragraph(payment_message, bold_normal_text_style)]
        ]
        info_table = Table(info_table_data, colWidths=[2*doc.width / 4.0, 2 * doc.width / 4.0])
        info_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'NotoSans-Bold' if 'NotoSans-Bold' in pdfmetrics.getRegisteredFontNames() else 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('FONTNAME', (0, 3), (0, -2), 'NotoSans-Bold' if 'NotoSans-Bold' in pdfmetrics.getRegisteredFontNames() else 'Helvetica-Bold'),
            # ('BACKGROUND', (0, 3), (-1, -1), colors.HexColor('#F0F8FF')),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 18))

        start_date_str = request.start_date.strftime("%d-%m-%Y")
        end_date_str = request.end_date.strftime("%d-%m-%Y")
        date_range_paragraph_milk = Paragraph(f"Milk Records for: {start_date_str} to {end_date_str}", centered_left_aligned_style)
        story.append(date_range_paragraph_milk)
        story.append(Spacer(1, 12))

        milk_table_header = [["Date", "Shift", "Quantity", "Rate", "Amount"]]
        milk_table_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'NotoSans-Bold' if 'NotoSans-Bold' in pdfmetrics.getRegisteredFontNames() else 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('FONTNAME', (0, 1), (-1, -1), 'NotoSans' if 'NotoSans' in pdfmetrics.getRegisteredFontNames() else 'Helvetica'),
        ])

        expense_table_header = [["Date", "Amount"]]
        expense_table_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3F4A59')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'NotoSans-Bold' if 'NotoSans-Bold' in pdfmetrics.getRegisteredFontNames() else 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F0FFF0')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#D3D3D3')),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('FONTNAME', (0, 1), (-1, -1), 'NotoSans' if 'NotoSans' in pdfmetrics.getRegisteredFontNames() else 'Helvetica'),
        ])

        def build_table_data(records, is_expense_table_flag):
            records_to_display = []
            for record in records:
                if is_expense_table_flag:
                    records_to_display.append([
                        record.custom_date.strftime("%d-%m-%Y"),
                        f"{record.amount:.2f}"
                    ])
                else:
                    amount = record.quantity * record.rate if record.rate is not None else 0
                    records_to_display.append([
                        record.custom_date.strftime("%d-%m-%Y"),
                        record.shift.value,
                        str(record.quantity),
                        str(record.rate),
                        f"{amount:.2f}"
                    ])
            return records_to_display

        # Build the Milk Records table
        milk_records_data = build_table_data(milk_records, False)
        if milk_records_data:
            milk_table = Table(milk_table_header + milk_records_data, colWidths=[doc.width / 5.0] * 5)
            milk_table.setStyle(milk_table_style)
            story.extend([milk_table])
        else:
            story.append(Paragraph("No milk records found for this period.", normal_text_style))

        # --- Expense Table Section (Unified, no explicit KeepTogether on entire section) ---
        if expense_records:
            story.append(Spacer(1, 24)) # Space before expense section
            
            # Add the expense section title and spacer directly to the story
            date_range_paragraph_expense = Paragraph(f"Expense Records for: {start_date_str} to {end_date_str}", centered_left_aligned_style)
            story.append(date_range_paragraph_expense)
            story.append(Spacer(1, 12))

            formatted_expense_records = build_table_data(expense_records, True)

            # Create a single table for all expense records
            full_expense_table_data = expense_table_header + formatted_expense_records
            full_expense_table = Table(full_expense_table_data, colWidths=[doc.width / 2.0, doc.width / 2.0])
            full_expense_table.setStyle(expense_table_style)

            # Append the full expense table directly. ReportLab will handle page breaks automatically.
            story.append(full_expense_table)
        else:
            story.append(Spacer(1, 24))
            story.append(Paragraph("No expense records found for this period.", normal_text_style))
        # --- End Expense Table Section ---

        doc.build(story)
        pdf_content = buffer.getvalue()
        buffer.close()

        headers = {
            'Content-Disposition': f'attachment; filename="milk_and_expense_report_{seller_data.name}.pdf"',
            'Content-Type': 'application/pdf',
        }

        return Response(content=pdf_content, headers=headers, media_type="application/pdf")

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Error generating PDF report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate PDF report")
