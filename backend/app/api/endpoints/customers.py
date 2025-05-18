from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.customers import AddCustomerRequest, DeleteCustomer
from app.db.session import get_db
from app.db.models import Customer, MilkRecord, ExpenseRecord
from app.core.security import get_current_user
from app.core.config import local_timezone
import logging
import datetime

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/customer",
    tags=["customer"],
)


@router.post("/add")
def add_customer(
    customer: AddCustomerRequest,
    db: Session = Depends(get_db),
    current_mobile: str = Depends(get_current_user),
):
    try:
        logger.info(f"In add_customer")
        local_time = datetime.now(local_timezone).replace(tzinfo=None)
        existing_customer = (
            db.query(Customer)
            .filter(
                Customer.mobile == customer.mobile,
                Customer.added_under == current_mobile,
            )
            .first()
        )

        if existing_customer:
            if existing_customer.is_deleted == 1:
                existing_customer.is_deleted = 0
                existing_customer.name = customer.name
                existing_customer.added_at = local_time
                db.commit()
                db.refresh(existing_customer)
                return {
                    "message": "Customer added again successfully!",
                    "added_by": current_mobile,
                }
            raise HTTPException(
                status_code=400, detail="Customer is already registered."
            )

        customer_entry = Customer(
            mobile=customer.mobile,
            name=customer.name,
            added_under=current_mobile,
        )

        db.add(customer_entry)
        db.commit()
        db.refresh(customer_entry)

        return {"message": "Customer added successfully!", "added_by": current_mobile}
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")


@router.delete("/delete")
def delete_customer(
    record: DeleteCustomer,
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
):
    try:
        customer_record = (
            db.query(Customer)
            .filter(
                Customer.mobile == record.seller_mobile,
                Customer.added_under == buyer_mobile,
                Customer.is_deleted == 0,
            )
            .first()
        )

        if not customer_record:
            raise HTTPException(status_code=404, detail="Customer not found")

        customer_record.is_deleted = 1

        all_record_milk = (
            db.query(MilkRecord)
            .filter(
                MilkRecord.seller_mobile == record.seller_mobile,
                MilkRecord.buyer_mobile == buyer_mobile,
                MilkRecord.is_deleted == 0,
            )
            .all()
        )

        all_record_expense = (
            db.query(ExpenseRecord)
            .filter(
                ExpenseRecord.seller_mobile == record.seller_mobile,
                ExpenseRecord.buyer_mobile == buyer_mobile,
                ExpenseRecord.is_deleted == 0,
            )
            .all()
        )

        for milk_record in all_record_milk:
            milk_record.is_deleted = 1

        for expense_record in all_record_expense:
            expense_record.is_deleted = 1

        db.commit()

        return {
            "message": "Customer and related milk/expense records deleted successfully"
        }

    except Exception as e:
        logger.error(f"Error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting profile: {str(e)}")
