from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.profile import EditProfile
from app.core.security import get_current_user
from app.db.session import get_db
from app.db.models import User, RateList, MilkRecord, ExpenseRecord, Customer
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/profile",
    tags=["profile"],
)


@router.put("/edit")
def edit_profile(
    record: EditProfile,
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
):
    try:
        record_to_change = None

        if record.seller_mobile:
            old_customer_record = (
                db.query(Customer)
                .filter(
                    Customer.mobile == record.seller_mobile,
                    Customer.added_under == buyer_mobile,
                    Customer.is_deleted == 0,
                )
                .first()
            )

            if not old_customer_record:
                raise HTTPException(status_code=404, detail="Customer not found")

            record_to_change = old_customer_record

        else:
            old_own_record = (
                db.query(User)
                .filter(User.mobile == buyer_mobile, User.is_deleted == 0)
                .first()
            )

            if not old_own_record:
                raise HTTPException(status_code=404, detail="User not found")

            record_to_change = old_own_record

        if not record.new_name or record.new_name.strip() == "":
            raise HTTPException(
                status_code=400, detail="New name cannot be empty or whitespace"
            )

        record_to_change.name = record.new_name
        db.commit()
        db.refresh(record_to_change)

        return {
            "message": "Name updated successfully",
            "updated_name": record_to_change.name,
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")


@router.delete("/delete")
def delete_profile(
    db: Session = Depends(get_db), buyer_mobile: str = Depends(get_current_user)
):
    try:
        account_record = (
            db.query(User)
            .filter(User.mobile == buyer_mobile, User.is_deleted == 0)
            .first()
        )

        if not account_record:
            raise HTTPException(status_code=404, detail="User not found")

        account_record.is_deleted = 1

        rate_list_record = (
            db.query(RateList)
            .filter(RateList.buyer_mobile == buyer_mobile, RateList.is_deleted == 0)
            .first()
        )

        if rate_list_record:
            rate_list_record.is_deleted = 1

        all_record_milk = (
            db.query(MilkRecord)
            .filter(MilkRecord.buyer_mobile == buyer_mobile, MilkRecord.is_deleted == 0)
            .all()
        )

        all_record_expense = (
            db.query(ExpenseRecord)
            .filter(
                ExpenseRecord.buyer_mobile == buyer_mobile,
                ExpenseRecord.is_deleted == 0,
            )
            .all()
        )

        all_record_customer = (
            db.query(Customer)
            .filter(Customer.added_under == buyer_mobile, Customer.is_deleted == 0)
            .all()
        )

        for milk_record in all_record_milk:
            milk_record.is_deleted = 1

        for expense_record in all_record_expense:
            expense_record.is_deleted = 1

        for customer_record in all_record_customer:
            customer_record.is_deleted = 1

        db.commit()

        return {
            "message": "User and related milk/expense/customers records deleted successfully"
        }

    except Exception as e:
        logger.error(f"Error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting profile: {str(e)}")


@router.get("/get")
def get_profile(
    db: Session = Depends(get_db), buyer_mobile: str = Depends(get_current_user)
):
    try:
        user_info = (
            db.query(User)
            .filter(User.mobile == buyer_mobile, User.is_deleted == 0)
            .first()
        )

        user_dict = {
            "mobile": user_info.mobile,
            "name": user_info.name,
            "referral_code": user_info.referral_code,
            "is_deleted": user_info.is_deleted,
            "registered_at": user_info.registered_at,
        }

        return user_dict
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")
