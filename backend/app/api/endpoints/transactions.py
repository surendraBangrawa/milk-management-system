from fastapi import APIRouter, Depends, HTTPException, Body, Query, Response, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, or_, distinct, literal_column
from sqlalchemy.sql import select, text, alias
from app.core.i18n import t
from app.schemas.transactions import (
    AddExpenseRecordRequest,
    AddMilkRecordRequest,
    GetTransactionsRequest,
    GetTransactionsSellerRequest,
    GetTotalDateBasisRecordRequest,
    GetCustomersDateBasisRecordRequest,
    MilkRecordResponse,
    ExpenseRecordResponse,
    TotalRecordsSimplifiedResponse,
    CustomerSummaryResponse,
    SellerSummaryDetail,
    SupplierSummaryResponse,
    BuyerSummaryDetail,
)
from app.db.session import get_db
from app.db.models import Customer, MilkRecord, ExpenseRecord, User
from app.core.security import get_current_user
from app.core.config import local_timezone
from datetime import datetime, date, time, timedelta
import logging
from sqlalchemy import func
from typing import Optional
from app.services.subscription_service import can_add_transaction_today

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
        setattr(record, "total_till_record", round(record.total_till_record + diff, 2))

    db.commit()


@router.post("/add_milk_record")
def add_milk_record(
    record: AddMilkRecordRequest,
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
):
    try:
        # Enforce daily transaction limit
        if not can_add_transaction_today(db, buyer_mobile):
            raise HTTPException(
                status_code=403,
                detail="Daily transaction limit reached for your subscription plan. Upgrade to add more transactions.",
            )
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
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Something went wrong")


@router.post("/add_expense")
def add_expense(
    record: AddExpenseRecordRequest,
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
):
    try:
        # Enforce daily transaction limit
        if not can_add_transaction_today(db, buyer_mobile):
            raise HTTPException(
                status_code=403,
                detail="Daily transaction limit reached for your subscription plan. Upgrade to add more transactions.",
            )
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
        return update_balances(
            db,
            buyer_mobile,
            seller_mobile,
            negate_total=True,
            start_date=request.start_date,
            end_date=request.end_date,
        )
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Something went wrong")


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
        return update_balances(
            db,
            buyer_mobile,
            seller_mobile,
            start_date=request.start_date,
            end_date=request.end_date,
        )
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")


def update_balances(
    db: Session,
    buyer_mobile: str,
    seller_mobile: str,
    negate_total: bool = False,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    transactions = []
    running_balance = 0.0

    # Query for records within the specified date range (or all if no dates)
    milk_query = db.query(MilkRecord).filter(
        MilkRecord.buyer_mobile == buyer_mobile,
        MilkRecord.seller_mobile == seller_mobile,
        MilkRecord.is_deleted == 0,
    )
    if start_date:
        milk_query = milk_query.filter(
            MilkRecord.added_at >= datetime.combine(start_date, time.min)
        )
    if end_date:
        milk_query = milk_query.filter(
            MilkRecord.added_at <= datetime.combine(end_date, time.max)
        )
    milk_records = milk_query.all()

    expense_query = db.query(ExpenseRecord).filter(
        ExpenseRecord.buyer_mobile == buyer_mobile,
        ExpenseRecord.seller_mobile == seller_mobile,
        ExpenseRecord.is_deleted == 0,
    )
    if start_date:
        expense_query = expense_query.filter(
            ExpenseRecord.added_at >= datetime.combine(start_date, time.min)
        )
    if end_date:
        expense_query = expense_query.filter(
            ExpenseRecord.added_at <= datetime.combine(end_date, time.max)
        )
    expense_records = expense_query.all()

    all_records = [
        {"type": "milk", "record": record, "amount": record.quantity * record.rate}
        for record in milk_records
    ] + [
        {"type": "expense", "record": record, "amount": record.amount}
        for record in expense_records
    ]

    all_records.sort(key=lambda x: (x["record"].added_at))

    for entry in all_records:
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
            for field in ["quantity", "fat", "snf", "rate", "milk_detail", "shift"]:
                if hasattr(entry["record"], field):
                    transaction_data[field] = getattr(entry["record"], field)
        elif entry["type"] == "expense":
            for field in ["expense_detail"]:
                if hasattr(entry["record"], field):
                    transaction_data[field] = getattr(entry["record"], field)

        transactions.append(transaction_data)

    db.commit()

    return transactions


@router.get("/get_customer_summary", response_model=CustomerSummaryResponse)
def get_customer_summary(
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
    offset: int = Query(
        0, ge=0, description="Number of items to skip (for pagination)"
    ),
    limit: int = Query(
        20, ge=1, description="Maximum number of items to return (for pagination)"
    ),
):
    try:
        # --- 1. Get the total count of *active* sellers ---
        total_sellers_count = (
            db.query(Customer)
            .filter(Customer.added_under == buyer_mobile, Customer.is_deleted == 0)
            .count()
        )

        # --- 2. Calculate global totals (total_you_will_give, total_you_will_get) ---
        # This is the most complex but most optimized part.
        # We need to find the latest 'total_till_record' for each seller across both milk and expense tables.

        # Subquery to get the latest record's total_till_record and added_at for each seller
        # from both MilkRecord and ExpenseRecord
        milk_sub = (
            select(
                MilkRecord.seller_mobile,
                MilkRecord.total_till_record,
                MilkRecord.added_at,
            )
            .where(
                and_(
                    MilkRecord.buyer_mobile == buyer_mobile, MilkRecord.is_deleted == 0
                )
            )
            .cte("milk_sub")
        )

        expense_sub = (
            select(
                ExpenseRecord.seller_mobile,
                ExpenseRecord.total_till_record,
                ExpenseRecord.added_at,
            )
            .where(
                and_(
                    ExpenseRecord.buyer_mobile == buyer_mobile,
                    ExpenseRecord.is_deleted == 0,
                )
            )
            .cte("expense_sub")
        )

        # Union of milk and expense records for all relevant sellers
        # This includes only relevant columns for performance
        union_all_records = (
            milk_sub.select().union_all(expense_sub.select()).alias("union_all_records")
        )

        # Use a window function (ROW_NUMBER) to find the latest record per seller
        # This subquery finds the most recent balance for each seller
        latest_balance_per_seller = (
            db.query(
                union_all_records.c.seller_mobile,
                union_all_records.c.total_till_record,
                union_all_records.c.added_at,
            )
            .add_columns(
                func.row_number()
                .over(
                    partition_by=union_all_records.c.seller_mobile,  # Correctly referencing alias columns
                    order_by=union_all_records.c.added_at.desc(),  # Correctly referencing alias columns
                )
                .label("rn")
            )
            .cte("latest_balance_per_seller")
        )

        # Now, join with Customers to ensure we only sum for active customers added by buyer_mobile
        # and aggregate the global totals
        global_totals_query = (
            db.query(
                func.sum(
                    case(
                        (
                            latest_balance_per_seller.c.total_till_record > 0,
                            latest_balance_per_seller.c.total_till_record,
                        ),
                        else_=0,
                    )
                ).label("total_give"),
                func.sum(
                    case(
                        (
                            latest_balance_per_seller.c.total_till_record < 0,
                            func.abs(latest_balance_per_seller.c.total_till_record),
                        ),
                        else_=0,
                    )
                ).label("total_get"),
            )
            .join(
                Customer,
                and_(
                    latest_balance_per_seller.c.seller_mobile == Customer.mobile,
                    Customer.added_under == buyer_mobile,
                    Customer.is_deleted == 0,
                ),
            )
            .filter(latest_balance_per_seller.c.rn == 1)
        )

        global_sums = global_totals_query.first()
        total_you_will_give_global = (
            global_sums.total_give if global_sums.total_give is not None else 0.0
        )
        total_you_will_get_global = (
            global_sums.total_get if global_sums.total_get is not None else 0.0
        )

        # --- 3. Fetch paginated sellers details for the response list ---
        seller_details = []

        # Subquery to find the latest record's total_till_record and added_at for each seller
        # relevant for the CURRENT PAGINATED LIST
        # We re-use the 'latest_balance_per_seller' CTE for efficiency
        paginated_customers_only = (
            db.query(Customer)
            .filter(Customer.added_under == buyer_mobile, Customer.is_deleted == 0)
            .order_by(Customer.added_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        for seller in paginated_customers_only:
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

            seller_current_balance = 0.0
            updated_date: Optional[datetime] = None

            if last_record_milk is None and last_record_expense is None:
                pass  # balance and date remain 0/None
            else:
                last_record_for_display = None
                if last_record_milk and last_record_expense:
                    last_record_for_display = (
                        last_record_milk
                        if last_record_milk.added_at > last_record_expense.added_at
                        else last_record_expense
                    )
                elif last_record_milk:
                    last_record_for_display = last_record_milk
                elif last_record_expense:
                    last_record_for_display = last_record_expense

                if last_record_for_display:
                    seller_current_balance = last_record_for_display.total_till_record
                    updated_date = last_record_for_display.added_at

            seller_details.append(
                SellerSummaryDetail(
                    name=seller_name,
                    mobile=seller_mobile,
                    balance=round(
                        -seller_current_balance, 2
                    ),  # Negate balance for display
                    date=updated_date,
                )
            )

        return CustomerSummaryResponse(
            message="Seller details fetched successfully",
            seller_details=seller_details,
            total_sellers_count=total_sellers_count,
            total_you_will_give=round(total_you_will_give_global, 2),
            total_you_will_get=round(total_you_will_get_global, 2),
        )

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Error fetching customer summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Something went wrong: {e}")


@router.get("/get_supplier_summary", response_model=SupplierSummaryResponse)
def get_supplier_summary(
    db: Session = Depends(get_db),
    seller_mobile: str = Depends(get_current_user),  # Current user is the seller
    offset: int = Query(
        0, ge=0, description="Number of items to skip (for pagination)"
    ),
    limit: int = Query(
        20, ge=1, description="Maximum number of items to return (for pagination)"
    ),
):
    try:
        # --- 1. Get the total count of *active* buyers for this seller ---
        # A buyer is a User whose mobile is in Customer.added_under for this seller_mobile
        total_buyers_count = (
            db.query(User)
            .join(Customer, User.mobile == Customer.added_under)
            .filter(
                Customer.mobile == seller_mobile,
                Customer.is_deleted == 0,
                User.is_deleted == 0,
            )
            .count()
        )

        # --- 2. Calculate global totals (total_you_will_give, total_you_will_get) for the supplier ---
        # This involves finding the latest 'total_till_record' for each buyer from the seller's perspective.

        # Subquery to get relevant milk records for this seller
        milk_sub = (
            select(
                MilkRecord.buyer_mobile,  # We need buyer_mobile here
                MilkRecord.total_till_record,
                MilkRecord.added_at,
            )
            .where(
                and_(
                    MilkRecord.seller_mobile == seller_mobile,
                    MilkRecord.is_deleted == 0,
                )
            )
            .cte("milk_sub")
        )

        # Subquery to get relevant expense records for this seller
        expense_sub = (
            select(
                ExpenseRecord.buyer_mobile,  # We need buyer_mobile here
                ExpenseRecord.total_till_record,
                ExpenseRecord.added_at,
            )
            .where(
                and_(
                    ExpenseRecord.seller_mobile == seller_mobile,
                    ExpenseRecord.is_deleted == 0,
                )
            )
            .cte("expense_sub")
        )

        # Union of milk and expense records for all relevant buyers of this seller
        union_all_records = (
            milk_sub.select().union_all(expense_sub.select()).alias("union_all_records")
        )

        # Use a window function (ROW_NUMBER) to find the latest record per buyer
        latest_balance_per_buyer = (
            db.query(
                union_all_records.c.buyer_mobile,
                union_all_records.c.total_till_record,
                union_all_records.c.added_at,
            )
            .add_columns(
                func.row_number()
                .over(
                    partition_by=union_all_records.c.buyer_mobile,
                    order_by=union_all_records.c.added_at.desc(),
                )
                .label("rn")
            )
            .cte("latest_balance_per_buyer")
        )

        # Now, join with User and Customer to ensure we only sum for active buyers
        # associated with this seller, and aggregate the global totals.
        # The balance is from the *buyer's* perspective in total_till_record.
        # From the seller's perspective:
        #   - If buyer's total_till_record > 0, it means buyer owes seller. (Seller will GET)
        #   - If buyer's total_till_record < 0, it means seller owes buyer. (Seller will GIVE)
        global_totals_query = (
            db.query(
                # total_you_will_give (supplier gives to buyer): when buyer's balance is negative (supplier owes buyer)
                func.sum(
                    case(
                        (
                            latest_balance_per_buyer.c.total_till_record < 0,
                            func.abs(latest_balance_per_buyer.c.total_till_record),
                        ),
                        else_=0,
                    )
                ).label("total_give"),
                # total_you_will_get (supplier gets from buyer): when buyer's balance is positive (buyer owes supplier)
                func.sum(
                    case(
                        (
                            latest_balance_per_buyer.c.total_till_record > 0,
                            latest_balance_per_buyer.c.total_till_record,
                        ),
                        else_=0,
                    )
                ).label("total_get"),
            )
            .join(
                User,
                and_(
                    latest_balance_per_buyer.c.buyer_mobile == User.mobile,
                    User.is_deleted == 0,
                ),
            )
            .join(
                Customer,
                and_(
                    latest_balance_per_buyer.c.buyer_mobile == Customer.added_under,
                    Customer.mobile
                    == seller_mobile,  # Ensure this customer is added by this seller
                    Customer.is_deleted == 0,
                ),
            )
            .filter(latest_balance_per_buyer.c.rn == 1)
        )

        global_sums = global_totals_query.first()
        total_you_will_give_global = (
            global_sums.total_give if global_sums.total_give is not None else 0.0
        )
        total_you_will_get_global = (
            global_sums.total_get if global_sums.total_get is not None else 0.0
        )

        # --- 3. Fetch paginated buyer details for the response list ---
        buyer_details = []

        # Fetch paginated User (buyer) objects who have added this seller
        paginated_buyers_only = (
            db.query(User)
            .join(Customer, User.mobile == Customer.added_under)
            .filter(
                Customer.mobile == seller_mobile,
                Customer.is_deleted == 0,
                User.is_deleted == 0,
            )
            .order_by(Customer.added_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        for buyer_user in paginated_buyers_only:
            buyer_mobile = buyer_user.mobile
            buyer_name = buyer_user.name

            # Fetch the last milk record for this specific buyer and seller
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

            # Fetch the last expense record for this specific buyer and seller
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

            buyer_current_balance = 0.0
            updated_date: Optional[datetime] = None

            if last_record_milk is None and last_record_expense is None:
                pass  # balance and date remain 0/None
            else:
                last_record_for_display = None
                if last_record_milk and last_record_expense:
                    last_record_for_display = (
                        last_record_milk
                        if last_record_milk.added_at > last_record_expense.added_at
                        else last_record_expense
                    )
                elif last_record_milk:
                    last_record_for_display = last_record_milk
                elif last_record_expense:
                    last_record_for_display = last_record_expense

                if last_record_for_display:
                    buyer_current_balance = last_record_for_display.total_till_record
                    updated_date = last_record_for_display.added_at

            buyer_details.append(
                BuyerSummaryDetail(
                    name=buyer_name,
                    mobile=buyer_mobile,
                    balance=round(
                        buyer_current_balance, 2
                    ),  # Balance as is from buyer's record (seller's perspective)
                    date=updated_date,
                )
            )

        return SupplierSummaryResponse(
            message="Buyer details fetched successfully",
            buyer_details=buyer_details,
            total_buyers_count=total_buyers_count,
            total_you_will_give=round(total_you_will_give_global, 2),
            total_you_will_get=round(total_you_will_get_global, 2),
        )

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Error fetching supplier summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Something went wrong: {e}")


@router.get("/total_record_date_range")
def get_total_records(
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
    request: GetTotalDateBasisRecordRequest = Depends(),
    shift: Optional[str] = Query(
        None, description="Optional filter for shift ('M' for Morning, 'E' for Evening)"
    ),
):

    if request.start_date > request.end_date:
        raise HTTPException(
            status_code=400,  # Bad Request
            detail="start_date cannot be after end_date.",
        )

    try:
        # Optimized: Calculate total milk quantity and amount in a single query
        adjusted_start_date = datetime.combine(request.start_date, time.min)
        adjusted_end_date = datetime.combine(request.end_date, time.max)

        # Query for records within the specified date range (or all if no dates)
        milk_query = db.query(MilkRecord).filter(
            MilkRecord.buyer_mobile == buyer_mobile,
            MilkRecord.is_deleted == 0,
        )
        if adjusted_start_date:
            milk_query = milk_query.filter(MilkRecord.added_at >= adjusted_start_date)
        if adjusted_end_date:
            milk_query = milk_query.filter(MilkRecord.added_at <= adjusted_end_date)
        if shift:
            if shift.upper() not in ["M", "E"]:
                raise HTTPException(
                    status_code=400, detail="Invalid shift value. Must be 'M' or 'E'."
                )
            milk_query = milk_query.filter(MilkRecord.shift == shift.upper())
        milk_records = milk_query.all()

        expense_query = db.query(ExpenseRecord).filter(
            ExpenseRecord.buyer_mobile == buyer_mobile,
            ExpenseRecord.is_deleted == 0,
        )
        if adjusted_start_date:
            expense_query = expense_query.filter(
                ExpenseRecord.added_at >= adjusted_start_date
            )
        if adjusted_end_date:
            expense_query = expense_query.filter(
                ExpenseRecord.added_at <= adjusted_end_date
            )
        expense_records = expense_query.all()

        # Combine and sort all records by added_at (descending for display)
        all_records_for_response = []
        total_milk_quantity_period = 0.0
        total_milk_amount_period = 0.0
        total_expense_amount_period = 0.0

        for record in milk_records:
            milk_amount = (
                record.quantity * record.rate if record.rate is not None else 0.0
            )
            total_milk_quantity_period += record.quantity
            total_milk_amount_period += milk_amount
            all_records_for_response.append(
                {
                    "type": "milk",
                    "record_obj": record,
                    "amount": milk_amount,  # Storing calculated amount for consistency if needed later
                }
            )
        for record in expense_records:
            total_expense_amount_period += (
                record.amount
            )  # Expense amounts are already signed (negative for deductions)
            all_records_for_response.append(
                {"type": "expense", "record_obj": record, "amount": record.amount}
            )

        # Sort the combined records by 'added_at' in descending order
        all_records_for_response.sort(
            key=lambda x: x["record_obj"].added_at, reverse=True
        )

        # Prepare the final list of records for the response
        processed_records_list = []
        for entry in all_records_for_response:
            if entry["type"] == "milk":
                processed_records_list.append(
                    MilkRecordResponse(
                        id=entry["record_obj"].id,
                        added_at=entry["record_obj"].added_at,
                        custom_date=entry["record_obj"].custom_date,
                        buyer_mobile=entry["record_obj"].buyer_mobile,
                        seller_mobile=entry["record_obj"].seller_mobile,
                        quantity=entry["record_obj"].quantity,
                        fat=entry["record_obj"].fat,
                        snf=entry["record_obj"].snf,
                        rate=entry["record_obj"].rate,
                        amount=round(entry["amount"], 2),
                        shift=entry[
                            "record_obj"
                        ].shift.value,  # Assuming shift is an Enum with .value
                        milk_detail=entry["record_obj"].milk_detail,
                        is_deleted=entry["record_obj"].is_deleted,
                    )
                )
            else:  # type == "expense"
                processed_records_list.append(
                    ExpenseRecordResponse(
                        expense_id=entry["record_obj"].expense_id,
                        added_at=entry["record_obj"].added_at,
                        custom_date=entry["record_obj"].custom_date,
                        buyer_mobile=entry["record_obj"].buyer_mobile,
                        seller_mobile=entry["record_obj"].seller_mobile,
                        amount=entry["record_obj"].amount,
                        expense_detail=entry["record_obj"].expense_detail,
                        is_deleted=entry["record_obj"].is_deleted,
                    )
                )

        total_entries_count = len(processed_records_list)

        return TotalRecordsSimplifiedResponse(
            records=processed_records_list,
            total_milk_quantity=round(total_milk_quantity_period, 2),
            total_milk_amount=round(total_milk_amount_period, 2),
            total_expense_amount=round(total_expense_amount_period, 2),
            total_entries_count=total_entries_count,
        )

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Error fetching total records: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve records: {e}")


# @router.get('/customer_record_date_range')
# def customer_record_date_range(
#     db: Session = Depends(get_db),
#     buyer_mobile: str = Depends(get_current_user),
#     request: GetCustomersDateBasisRecordRequest = Depends(),
#     shift: Optional[str] = Query(None, description="Optional filter for shift ('M' for Morning, 'E' for Evening)"),
# ):
#     if not request.start_date or not request.end_date:
#         raise HTTPException(
#             status_code=400, # Bad Request
#             detail="Both start_date and end_date are required."
#         )

#     if request.start_date > request.end_date:
#         raise HTTPException(
#             status_code=400, # Bad Request
#             detail="start_date cannot be after end_date."
#         )

#     try:
#         # Optimized: Calculate total milk quantity and amount in a single query
#         adjusted_end_date = datetime.combine(request.end_date, time.max)

#         milk_summary_query = db.query(
#             func.sum(MilkRecord.quantity).label("total_quantity"),
#             func.sum(MilkRecord.quantity * MilkRecord.rate).label("total_amount")
#         ).filter(
#             MilkRecord.buyer_mobile == buyer_mobile,
#             MilkRecord.is_deleted == False, # Use False for boolean
#             MilkRecord.custom_date >= request.start_date,
#             MilkRecord.custom_date <= adjusted_end_date,
#             MilkRecord.seller_mobile == request.seller_mobile
#         )

#         # Add optional filter for shift
#         if shift:
#             if shift.upper() not in ['M', 'E']:
#                 raise HTTPException(
#                     status_code=400,
#                     detail="Invalid shift value. Must be 'M' or 'E'."
#                 )
#             milk_summary_query = milk_summary_query.filter(MilkRecord.shift == shift.upper())


#         milk_summary_result = milk_summary_query.first() # Returns a Row or None

#         if milk_summary_result:
#             # If sum results in None (e.g., no records or all values are NULL), default to 0.0
#             total_milk_quantity = milk_summary_result.total_quantity or 0.0
#             total_milk_amount = (milk_summary_result.total_amount or 0.0)*(-1)
#         else:
#             # If no rows match, .first() is None, so both are 0.
#             total_milk_quantity = 0.0
#             total_milk_amount = 0.0


#         # Calculate total expense amount (still a separate query as it's a different table)
#         # Assuming ExpenseRecord has an 'amount' field for its value
#         total_expense_amount = (
#             db.query(func.sum(ExpenseRecord.amount).label("total_expense"))
#             .filter(
#                 ExpenseRecord.buyer_mobile == buyer_mobile,
#                 ExpenseRecord.is_deleted == False,
#                 ExpenseRecord.custom_date >= request.start_date,
#                 ExpenseRecord.custom_date <= adjusted_end_date,
#                 ExpenseRecord.seller_mobile == request.seller_mobile
#             )
#             .scalar() # Gets the first column of the first row, or None
#         )

#         data = {
#             "total_milk_quantity": total_milk_quantity, # Already defaulted to 0.0 if None
#             "total_milk_amount": total_milk_amount,     # Already defaulted to 0.0 if None
#             "total_expense_amount": (total_expense_amount or 0.0)*(-1) # Handle None if no records
#         }
#         return data
#     except Exception as e:
#         logger.error(f"Error: {e}")
#         raise HTTPException(status_code=404, detail="Something went wrong")


from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageTemplate,
    Frame,
    PageBreak,
    KeepTogether,
)  # Import PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from io import BytesIO
from reportlab.lib.units import inch  # Import inch
from reportlab.pdfbase import pdfmetrics


@router.get("/generate_milk_report", response_class=Response)
def generate_milk_report(
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
    request: GetCustomersDateBasisRecordRequest = Depends(),
):
    try:
        logger.info(
            f"Generating milk report for seller: {request.seller_mobile} under buyer: {buyer_mobile}"
        )

        seller_data = (
            db.query(Customer)
            .filter(
                Customer.mobile == request.seller_mobile,
                Customer.added_under == buyer_mobile,
                Customer.is_deleted == 0,
            )
            .first()
        )

        buyer_data = (
            db.query(User)
            .filter(User.mobile == buyer_mobile, User.is_deleted == 0)
            .first()
        )

        if not buyer_data:
            raise HTTPException(status_code=404, detail="Buyer not found")
        else:
            buyer_name = buyer_data.name.title()

        if not seller_data:
            raise HTTPException(status_code=404, detail="Seller not found")
        # milk records
        query_milk = db.query(MilkRecord).filter(
            MilkRecord.seller_mobile == request.seller_mobile,
            MilkRecord.is_deleted == False,
        )
        if request.start_date:
            adjusted_start_date_time = datetime.combine(request.start_date, time.min)
            query_milk = query_milk.filter(
                MilkRecord.added_at >= adjusted_start_date_time
            )
        if request.end_date:
            adjusted_end_date_time = datetime.combine(request.end_date, time.max)
            query_milk = query_milk.filter(
                MilkRecord.added_at <= adjusted_end_date_time
            )
        milk_records = query_milk.order_by(MilkRecord.added_at.asc()).all()

        # expense records
        query_expense = db.query(ExpenseRecord).filter(
            ExpenseRecord.seller_mobile == request.seller_mobile,
            ExpenseRecord.is_deleted == False,
        )
        if request.start_date:
            adjusted_start_date_time = datetime.combine(request.start_date, time.min)
            query_expense = query_expense.filter(
                ExpenseRecord.added_at >= adjusted_start_date_time
            )
        if request.end_date:
            adjusted_end_date_time = datetime.combine(request.end_date, time.max)
            query_expense = query_expense.filter(
                ExpenseRecord.added_at <= adjusted_end_date_time
            )
        expense_records = query_expense.order_by(ExpenseRecord.added_at.asc()).all()

        # Combine all records and sort them by added_at ascending
        all_records_in_period = sorted(
            milk_records + expense_records, key=lambda x: x.added_at
        )

        opening_balance = 0
        if all_records_in_period:
            first_record = all_records_in_period[0]

            # Calculate transaction amount for the first record
            if isinstance(first_record, MilkRecord):
                first_transaction_amount = (
                    (first_record.quantity * first_record.rate)
                    if first_record.rate is not None
                    else 0
                )
            elif isinstance(first_record, ExpenseRecord):
                first_transaction_amount = first_record.amount
            else:
                first_transaction_amount = 0  # Should not happen if only MilkRecord and ExpenseRecord are combined

            # Calculate the running total after the first record
            opening_balance = first_record.total_till_record - first_transaction_amount
        else:
            raise HTTPException(
                status_code=404, detail="No records found for given date range"
            )

        # Calculate totals for the current report period (for summary)
        total_milk_quantity = sum(record.quantity for record in milk_records)
        total_milk_amount = sum(
            (record.quantity * record.rate) if record.rate is not None else 0
            for record in milk_records
        )
        total_expense_amount = sum(
            record.amount for record in expense_records
        )  # sum of potentially negative amounts
        total_net_amount = total_milk_amount + total_expense_amount

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=letter, title="Milk Record", topMargin=40, bottomMargin=20
        )
        styles = getSampleStyleSheet()

        # Define font names with fallbacks
        header_font = (
            "NotoSans-Bold"
            if "NotoSans-Bold" in pdfmetrics.getRegisteredFontNames()
            else "Helvetica-Bold"
        )
        normal_font = (
            "NotoSans"
            if "NotoSans" in pdfmetrics.getRegisteredFontNames()
            else "Helvetica"
        )

        centered_style = ParagraphStyle(
            name="Centered", parent=styles["h1"], alignment=1, fontName=header_font
        )
        left_aligned_style = ParagraphStyle(
            name="LeftAligned",
            parent=styles["Normal"],
            alignment=0,
            fontName=header_font,
        )
        centered_left_aligned_style = ParagraphStyle(
            name="CenteredLeftAligned",
            parent=left_aligned_style,
            alignment=1,
            fontName=header_font,
        )
        normal_text_style = ParagraphStyle(
            name="NormalText", parent=styles["Normal"], fontName=normal_font
        )
        bold_normal_text_style = ParagraphStyle(
            name="BoldNormalText", parent=styles["Normal"], fontName=header_font
        )

        story = []

        header = Paragraph("Aapka DudhBahi", centered_style)
        story.append(header)
        story.append(Spacer(1, 18))

        payment_message = ""
        if total_net_amount < 0:
            payment_message = f"{-total_net_amount:.2f} ({seller_data.name.title()} pays to {buyer_name})"  # Display positive value for who pays whom
        elif total_net_amount > 0:
            payment_message = f"{total_net_amount:.2f} ({buyer_name} pays to {seller_data.name.title()})"
        else:
            payment_message = "No net payment due for this period."

        # Format opening_balance for display
        opening_balance_message = ""
        if opening_balance < 0:
            opening_balance_message = (
                f"{-opening_balance:.2f} ({seller_data.name.title()} owes {buyer_name})"
            )
        elif opening_balance > 0:
            opening_balance_message = (
                f"{opening_balance:.2f} ({buyer_name} owes {seller_data.name.title()})"
            )
        else:
            opening_balance_message = "0.00 (Balance is zero)"

        info_table_data = [
            ["Name:", seller_data.name.title()],
            ["Mobile No.:", seller_data.mobile],
            ["Download Date:", date.today().strftime("%d-%m-%Y")],
            # ["Opening Balance (Before Period):", Paragraph(opening_balance_message, bold_normal_text_style)],
            ["Total Milk Quantity(L/Kg) in Period:", f"{total_milk_quantity:.2f}"],
            ["Total Milk Amount in Period:", f"{total_milk_amount:.2f}"],
            ["Total Expense Amount in Period:", f"{total_expense_amount:.2f}"],
            [
                "Net Amount (Milk + Expense) for Period:",
                Paragraph(payment_message, bold_normal_text_style),
            ],
        ]
        info_table = Table(
            info_table_data, colWidths=[2 * doc.width / 4.0, 2 * doc.width / 4.0]
        )
        info_table.setStyle(
            TableStyle(
                [
                    ("ALIGN", (0, 0), (0, -1), "LEFT"),
                    ("ALIGN", (1, 0), (1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (0, -1), header_font),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                ]
            )
        )
        story.append(info_table)
        story.append(Spacer(1, 18))

        # Adjust date range display based on whether dates are provided
        date_range_text = "All Records"
        if request.start_date and request.end_date:
            start_date_str = request.start_date.strftime("%d-%m-%Y")
            end_date_str = request.end_date.strftime("%d-%m-%Y")
            date_range_text = (
                f"Detailed Records for: {start_date_str} to {end_date_str}"
            )
        elif request.start_date:
            start_date_str = request.start_date.strftime("%d-%m-%Y")
            date_range_text = f"Detailed Records from: {start_date_str}"
        elif request.end_date:
            end_date_str = request.end_date.strftime("%d-%m-%Y")
            date_range_text = f"Detailed Records till: {end_date_str}"

        date_range_paragraph = Paragraph(date_range_text, centered_left_aligned_style)
        story.append(date_range_paragraph)
        story.append(Spacer(1, 12))

        # --- NEW: Function to prepare combined records for display with running total ---
        def prepare_combined_records_for_display(records, initial_balance):
            current_running_balance = initial_balance
            table_rows = []

            for record in records:
                if isinstance(record, MilkRecord):
                    transaction_amount = (
                        (record.quantity * record.rate)
                        if record.rate is not None
                        else 0
                    )
                    current_running_balance = record.total_till_record
                    shift = record.shift.value
                    quantity = record.quantity
                    rate = f"{record.rate:.2f}"
                    table_rows.append(
                        [
                            record.custom_date.strftime("%d-%m-%Y"),  # Changed to HH:MM
                            "Milk",
                            shift,
                            quantity,
                            rate,
                            f"{transaction_amount:.2f}",
                            f"{current_running_balance:.2f}",
                        ]
                    )
                elif isinstance(record, ExpenseRecord):
                    transaction_amount = (
                        record.amount
                    )  # Amount is already signed (negative for expenses)
                    current_running_balance = (
                        record.total_till_record
                    )  # Add directly as amount is signed
                    shift = "-"
                    quantity = "-"
                    rate = "-"
                    table_rows.append(
                        [
                            record.custom_date.strftime("%d-%m-%Y"),  # Changed to HH:MM
                            "Expense",
                            shift,
                            quantity,
                            rate,
                            f"{transaction_amount:.2f}",  # Display amount as is (will show negative sign if present)
                            f"{current_running_balance:.2f}",
                        ]
                    )
            return table_rows, current_running_balance

        # Prepare combined table data and get the final running balance
        combined_table_header = [
            ["Date", "Type", "Shift", "Quantity", "Rate", "Amount", "Running Total"]
        ]
        combined_records_data, final_running_balance = (
            prepare_combined_records_for_display(all_records_in_period, opening_balance)
        )

        combined_table_style = TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.grey),  # Green header
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), header_font),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                (
                    "BACKGROUND",
                    (0, 1),
                    (-1, -1),
                    colors.HexColor("#F8F8F8"),
                ),  # Light background for rows
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("FONTNAME", (0, 1), (-1, -1), normal_font),
            ]
        )

        if combined_records_data:
            combined_table = Table(
                combined_table_header + combined_records_data,
                colWidths=[
                    2 * doc.width / 9.0,
                    doc.width / 9.0,
                    doc.width / 9.0,
                    doc.width / 9.0,
                    doc.width / 9.0,
                    doc.width / 9.0,
                    2 * doc.width / 9.0,
                ],
            )
            combined_table.setStyle(combined_table_style)
            story.append(combined_table)
        else:
            story.append(
                Paragraph(
                    "No milk or expense records found for this period.",
                    normal_text_style,
                )
            )

        story.append(Spacer(1, 24))

        # --- Display Final Remaining Balance ---
        final_balance_message = ""
        if final_running_balance < 0:
            final_balance_message = f"{-final_running_balance:.2f} ({seller_data.name.title()} owes {buyer_name})"
        elif final_running_balance > 0:
            final_balance_message = f"{final_running_balance:.2f} ({buyer_name} owes {seller_data.name.title()})"
        else:
            final_balance_message = "0.00 (Final balance is zero)"

        # --- END Final Remaining Balance ---

        story.append(Spacer(1, 18))

        end_table_data = [
            [
                "Opening Balance (Before Period):",
                Paragraph(opening_balance_message, bold_normal_text_style),
            ],
            ["Total Milk Amount in Period:", f"{total_milk_amount:.2f}"],
            ["Total Expense Amount in Period:", f"{total_expense_amount:.2f}"],
            [
                "Net Amount (Milk + Expense) for Period:",
                Paragraph(payment_message, bold_normal_text_style),
            ],
            [
                "Final Remaining Balance: (After Period):",
                Paragraph(final_balance_message, bold_normal_text_style),
            ],
        ]
        end_table = Table(
            end_table_data, colWidths=[2 * doc.width / 4.0, 2 * doc.width / 4.0]
        )
        end_table.setStyle(
            TableStyle(
                [
                    ("ALIGN", (0, 0), (0, -1), "LEFT"),
                    ("ALIGN", (1, 0), (1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (0, -1), header_font),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                ]
            )
        )
        story.append(end_table)

        doc.build(story)
        pdf_content = buffer.getvalue()
        buffer.close()

        headers = {
            "Content-Disposition": f'attachment; filename="milk_and_expense_report_{seller_data.name}.pdf"',
            "Content-Type": "application/pdf",
        }

        return Response(
            content=pdf_content, headers=headers, media_type="application/pdf"
        )

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Error generating PDF report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate PDF report")
