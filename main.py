from fastapi import FastAPI, HTTPException, Depends, Body
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from database import User, AuthUser, get_db, Customer, MilkRecord, ExpenseRecord, RateList, Subscription, SubscriptionPlan  # Import DB session & User model
from typing import Optional, List
from datetime import datetime, timedelta, date
import random
from jose import jwt
from auth import get_current_user
from sqlalchemy import case
import pytz
import os
from dotenv import load_dotenv

# Load environment variables from .env file if available
load_dotenv()
time_zone = os.getenv("TZ", "Asia/Kolkata")
    
# Get the current time in the time zone specified in the environment variable
local_timezone = pytz.timezone(time_zone)


app = FastAPI()

# # Dependency to get DB session
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# Secret key & algorithm for JWT
SECRET_KEY = "thisisthebestsecretkeythekey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60*24*30*12*10 #10years

# Function to generate JWT Token
def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Pydantic model for Signup request
class SignupRequest(BaseModel):
    mobile: str = Field(..., pattern="^[0-9]{10}$", example="9876543210")
    name: str
    referral_code: Optional[str] = None

# Pydantic model for Login
class OtpRequest(BaseModel):
    mobile: str = Field(..., pattern="^[0-9]{10}$", example="9876543210")

class LoginRequest(BaseModel):
    mobile: str = Field(..., pattern="^[0-9]{10}$", example="9876543210")
    otp: str = Field(..., pattern="^[0-9]{6}$", example="987654")

class AddCustomerRequest(BaseModel):
    mobile: str = Field(..., pattern="^[0-9]{10}$", example="9876543210")
    name: str

class SubscriptionRequest(BaseModel):
    plan_id: str
    

# Signup API using MySQL
@app.post("/signup")
def signup(user: SignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        User.mobile == user.mobile
    ).first()

    if existing_user:
        if existing_user.is_deleted == 1:
            # If the user exists and is deleted, you can reactivate the user if needed
            existing_user.is_deleted = 0  # Reactivate user
            existing_user.name = user.name
            existing_user.referral_code=user.referral_code
            # existing_user.registered_at=datetime.utcnow()
            db.commit()
            db.refresh(existing_user)
            return {
                "message": "User reactivated successfully!",
                "mobile": existing_user.mobile
            }
        else:
            raise HTTPException(status_code=400, detail="User with this mobile number already exists")
    


    # Create new user
    new_user = User(
        mobile=user.mobile,
        name=user.name,
        referral_code=user.referral_code,
        # registered_at=datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully!",
        "mobile": new_user.mobile
    }

@app.post("/send_login_otp")
def send_login_otp(user: OtpRequest, db: Session = Depends(get_db)):
    local_time = datetime.now(local_timezone)
    # Check if user already exists
    existing_user = db.query(User).filter(User.mobile == user.mobile, User.is_deleted ==0).first()
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found, Please check your mobile number or sign up if you don't have an account.")
    
# Generate a new OTP
    new_otp = random.randint(100000, 999999)
    expire_time = local_time + timedelta(minutes=5)

    # Check if the user already has a login entry
    login_entry = db.query(AuthUser).filter(AuthUser.mobile == user.mobile).first()

    if login_entry:
        # Update existing login details
        login_entry.otp = new_otp
        login_entry.expire_at = expire_time
    else:
        # Create new login entry
        login_entry = AuthUser(
            mobile=user.mobile,
            otp=new_otp,
            expire_at=expire_time,
        )
        db.add(login_entry)

    db.commit()
    db.refresh(login_entry)

    return {
        "message": "OTP sent successfully!",
        "mobile": user.mobile
    }

@app.post("/login")
def login(user: LoginRequest, db: Session = Depends(get_db)):
    local_time = datetime.now(local_timezone).replace(tzinfo=None)
    requested_otp = db.query(AuthUser).filter(AuthUser.mobile == user.mobile).first()
    if not requested_otp:
        raise HTTPException(status_code=404, detail="User not found, Please request OTP from registered mobile number.")
    
    print(requested_otp.expire_at)
    print(local_time)

    if requested_otp.otp == user.otp and requested_otp.expire_at >= local_time:
        # ✅ Ensure "sub" is included in the token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.mobile}, expires_delta=access_token_expires
        )

        return {
            "message": "User logged in successfully",
            "mobile": user.mobile,
            "access_token": access_token
        }
    else:
        raise HTTPException(status_code=401, detail="Entered OTP is wrong or expired.")


@app.post("/add_customer")
def add_customer(
    customer: AddCustomerRequest, 
    db: Session = Depends(get_db), 
    current_mobile: str = Depends(get_current_user)  # ✅ Require authentication
):
    local_time = datetime.now(local_timezone).replace(tzinfo=None)
    existing_customer = db.query(Customer).filter(
        Customer.mobile == customer.mobile, 
        Customer.added_under == current_mobile
    ).first()

    if existing_customer:
        if existing_customer.is_deleted ==1:
            existing_customer.is_deleted = 0  # Reactivate user
            existing_customer.name = customer.name
            existing_customer.added_at = local_time
            db.commit()
            db.refresh(existing_customer)
            return {
                "message": "Customer added again successfully!",
                "added_by": current_mobile
            }
        raise HTTPException(status_code=400, detail="Customer is already registered.")

    customer_entry = Customer(
        mobile=customer.mobile,
        name=customer.name,
        added_under=current_mobile  # Authenticated user is adding this customer
    )

    db.add(customer_entry)
    db.commit()
    db.refresh(customer_entry)

    return {
        "message": "Customer added successfully!",
        "added_by": current_mobile
    }



class AddMilkRecordRequest(BaseModel):
    seller_mobile: str = Field(..., pattern="^[0-9]{10}$")
    quantity: float
    fat: float = None
    snf: float = None
    rate: float
    shift: str = Field(None, pattern="^(M|E)$")  # ✅ Optional, auto-populated if missing
    custom_date: date = None  # ✅ Optional, auto-populated if missing
    milk_detail: Optional[str] = Field(None, max_length=256)

@app.post("/add_milk_record")
def add_milk_record(
    record: AddMilkRecordRequest, 
    db: Session = Depends(get_db), 
    buyer_mobile: str = Depends(get_current_user)  # ✅ Auto-fetch logged-in user
):
    local_time = datetime.now(local_timezone).replace(tzinfo=None)
    customer_info = db.query(Customer).filter(
        Customer.added_under == buyer_mobile,
        Customer.mobile == record.seller_mobile,
        Customer.is_deleted == 0
    ).first()
    if not customer_info:
        raise HTTPException(status_code=404, detail="Entered customer doesn't exist under you")
    
    # ✅ Auto-set custom_date if not provided
    if record.custom_date is None:
        record.custom_date = local_time  # ✅ Set to today's date

    # ✅ Auto-set shift if not provided
    if record.shift is None:
        current_hour = local_time.hour
        if 3 <= current_hour < 15:  # ✅ Morning shift is from 3 AM to 3 PM
            record.shift = "M"
        else:  # ✅ Evening shift is from 3 PM to 3 AM
            record.shift = "E"

    # ✅ Ensure shift value is valid (Extra safety)
    if record.shift not in ["M", "E"]:
        raise HTTPException(status_code=400, detail="Shift must be 'M' (Morning) or 'E' (Evening)")
    
    # ✅ Get the previous milk record for this buyer
    latest_milk_record = db.query(MilkRecord).filter(
        MilkRecord.buyer_mobile == buyer_mobile,
        MilkRecord.seller_mobile == record.seller_mobile,
        MilkRecord.is_deleted == 0
        ).order_by(MilkRecord.added_at.desc()).first()
    
    latest_expense_record = db.query(ExpenseRecord).filter(
        ExpenseRecord.buyer_mobile == buyer_mobile,
        ExpenseRecord.seller_mobile == record.seller_mobile,
        ExpenseRecord.is_deleted == 0
    ).order_by(ExpenseRecord.added_at.desc()).first()

    # Determine which record (milk or expense) has the latest added_at
    latest_record = None
    if latest_milk_record and latest_expense_record:
        # Compare added_at timestamps
        if latest_milk_record.added_at > latest_expense_record.added_at:
            latest_record = latest_milk_record
        else:
            latest_record = latest_expense_record
    elif latest_milk_record:
        latest_record = latest_milk_record
    elif latest_expense_record:
        latest_record = latest_expense_record


    # Calculate the last total_till_record (if available)
    total_till_previous = latest_record.total_till_record if latest_record else 0

    # ✅ Round all float values to 2 decimal places
    quantity = round(record.quantity, 2)
    fat = round(record.fat, 2) if record.fat is not None else None
    snf = round(record.snf, 2) if record.snf is not None else None
    rate = round(record.rate, 2)
    total_till_record = round(total_till_previous + (quantity * rate), 2)  # ✅ Round total value

    new_record = MilkRecord(
        buyer_mobile=buyer_mobile,  # ✅ Auto-set from authentication
        seller_mobile=record.seller_mobile,
        quantity=quantity,  # ✅ Rounded to 2 decimal places
        fat=fat,  # ✅ Rounded if not None
        snf=snf,  # ✅ Rounded if not None
        rate=rate,  # ✅ Rounded to 2 decimal places
        shift=record.shift,  # ✅ Auto-populated if missing
        milk_detail = record.milk_detail,
        total_till_record=total_till_record,  # ✅ Rounded to 2 decimal places
        custom_date=record.custom_date  # ✅ Auto-populated if missing
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    # ✅ After adding a new record, update future `total_till_record` for subsequent records based on the updated total
    #update_total_till_records(db, buyer_mobile, record.custom_date, (quantity * rate))

    return {
        "message": "Milk record added successfully!",
        "buyer_mobile": buyer_mobile,  # ✅ Return buyer mobile for confirmation
        "shift": record.shift,  # ✅ Return shift for confirmation
        "custom_date": record.custom_date  # ✅ Return custom_date for confirmation
    }

class AddExpenseRecordRequest(BaseModel):
    seller_mobile: str = Field(..., pattern="^[0-9]{10}$")
    amount: float
    expense_detail: Optional[str] = Field(None, max_length=256)
    transaction_type: str = Field(..., pattern="^(GAVE|GOT)$")
    custom_date: date = None  # ✅ Optional, auto-populated if missing

@app.post("/add_expense")
def add_expense(
    record: AddExpenseRecordRequest, 
    db: Session = Depends(get_db), 
    buyer_mobile: str = Depends(get_current_user)  # ✅ Auto-fetch logged-in user
):
    local_time = datetime.now(local_timezone).replace(tzinfo=None)
    customer_info = db.query(Customer).filter(
        Customer.added_under == buyer_mobile,
        Customer.mobile == record.seller_mobile,
        Customer.is_deleted ==0
    ).first()
    if not customer_info:
        raise HTTPException(status_code=404, detail="Entered customer doesn't exist under you")

    # ✅ Auto-set custom_date if not provided
    if record.custom_date is None:
        record.custom_date = local_time  # ✅ Use current date & time
    else:
        record.custom_date = datetime.combine(record.custom_date, local_time.time())  # ✅ Merge user date with current time

    # ✅ Adjust the amount based on transaction type
    amount = round(record.amount, 2)  # ✅ Round to 2 decimal places
    if record.transaction_type == "GAVE":
        amount = -amount  # ✅ Convert to negative if user "GAVE"

     # ✅ Get latest `total_till_record`
    previous_record_expense = db.query(ExpenseRecord).filter(
        ExpenseRecord.buyer_mobile == buyer_mobile,
        ExpenseRecord.seller_mobile == record.seller_mobile,
        ExpenseRecord.is_deleted ==0
    ).order_by(ExpenseRecord.added_at.desc()).first()

    previous_record_milk = db.query(MilkRecord).filter(
        MilkRecord.buyer_mobile == buyer_mobile,
        MilkRecord.seller_mobile == record.seller_mobile,
        MilkRecord.is_deleted ==0
    ).order_by(MilkRecord.added_at.desc()).first()

    latest_record = None
    if previous_record_expense and previous_record_milk:
        latest_record = previous_record_expense if previous_record_expense.added_at > previous_record_milk.added_at else previous_record_milk
    else:
        latest_record = previous_record_expense or previous_record_milk  

    total_till_previous = latest_record.total_till_record if latest_record else 0.00
    total_till_record = round(total_till_previous + amount, 2)  # ✅ Accumulate total

    new_expense = ExpenseRecord(
        buyer_mobile=buyer_mobile,  # ✅ Auto-set from authentication
        seller_mobile=record.seller_mobile,
        amount=amount,  # ✅ Stored as positive or negative
        expense_detail=record.expense_detail,
        total_till_record=total_till_record,  # ✅ Running total
        custom_date=record.custom_date
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return {
        "message": "Expense added successfully!",
        "buyer_mobile": buyer_mobile,
        "transaction_type": record.transaction_type,
        "amount": amount,  # ✅ Shows if amount is positive or negative
        "total_till_record": total_till_record,  # ✅ Updated total
        "custom_date": record.custom_date
    }


def update_total_till_records(db: Session, buyer_mobile: str, seller_mobile : str, added_at_date: datetime, diff: float):
    # ✅ Get all transactions after the edited `custom_date`
    future_milk_records = db.query(MilkRecord).filter(
        MilkRecord.buyer_mobile == buyer_mobile,
        MilkRecord.seller_mobile == seller_mobile,
        MilkRecord.is_deleted ==0,
        MilkRecord.added_at > added_at_date
    ).order_by(
        MilkRecord.added_at.asc()  # Then by added_at for final tie-breaker   
    ).all()

    future_expense_records = db.query(ExpenseRecord).filter(
        ExpenseRecord.buyer_mobile == buyer_mobile,
        ExpenseRecord.seller_mobile == seller_mobile,
        ExpenseRecord.is_deleted ==0,
        ExpenseRecord.added_at > added_at_date
    ).order_by(
        ExpenseRecord.added_at.asc()  # Then by added_at for final tie-breaker
        ).all()

    # ✅ Merge & sort all transactions by `custom_date`
    all_future_records = sorted(
        future_milk_records + future_expense_records,
        key=lambda record: (record.added_at)
    )

    # ✅ Adjust `total_till_record` for each record
    for record in all_future_records:
        record.total_till_record = round(record.total_till_record + diff, 2)

    # ✅ Commit changes to database
    db.commit()




#edit records of milk transactions or expenses
@app.put("/edit_transaction")
def edit_transaction(
    record_id: int,
    record_type: str,
    seller_mobile: str,
    updated_data: dict = Body(...),  # ✅ Accepts a flexible input payload
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user)
):
    local_time = datetime.now(local_timezone).replace(tzinfo=None)
    # ✅ Find the record in MilkRecord or ExpenseRecord
    if record_type.lower() == "milk":
        record_for_update = db.query(MilkRecord).filter(
            MilkRecord.id == record_id, 
            MilkRecord.buyer_mobile == buyer_mobile,
            MilkRecord.seller_mobile == seller_mobile,
            MilkRecord.is_deleted ==0).first()
        
        previous_amount=record_for_update.quantity*record_for_update.rate
    else:
        record_for_update = db.query(ExpenseRecord).filter(
            ExpenseRecord.expense_id == record_id, 
            ExpenseRecord.buyer_mobile == buyer_mobile,
            ExpenseRecord.seller_mobile == seller_mobile,
            ExpenseRecord.is_deleted == 0).first()
        previous_amount=record_for_update.amount

    if not record_for_update:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # ✅ Extract `custom_date` and calculate the difference (`diff`)
    added_at_date = record_for_update.added_at

    # ✅ Determine new amount after update
    if record_type.lower() == "milk":
        new_quantity = updated_data.get("quantity", record_for_update.quantity)
        new_rate = updated_data.get("rate", record_for_update.rate)
        new_amount = round(float(new_quantity) * float(new_rate), 2)
    else:
        new_amount = round(float(updated_data.get("amount", record_for_update.amount)), 2)

    diff = new_amount - previous_amount  # ✅ Difference to be adjusted in future records

    # ✅ Update only provided fields
    for key, value in updated_data.items():
        if hasattr(record_for_update, key) and value is not None:
            setattr(record_for_update, key, value)

    record_for_update.updated_at = local_time  # ✅ Update timestamp
    record_for_update.total_till_record = round(record_for_update.total_till_record + diff, 2)
    db.commit()

    # ✅ Update `total_till_record` in subsequent transactions
    update_total_till_records(db, buyer_mobile, seller_mobile, added_at_date, diff)

    #return update_balances(db, buyer_mobile)

    return {"message": "Transaction updated successfully", "updated_record": record_for_update}


#delete records of milk transactions or expenses
@app.delete("/delete_transaction")
def delete_transaction(
    record_id: int,
    record_type : str,
    seller_mobile: str,
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user)
):
    # ✅ Check if record exists in either 
    if record_type.lower() == 'milk':
        record_for_delete = db.query(MilkRecord).filter(
            MilkRecord.id == record_id, 
            MilkRecord.buyer_mobile == buyer_mobile, 
            MilkRecord.seller_mobile == seller_mobile,
            MilkRecord.is_deleted ==0
            ).first()
        # Calculate diff for milk record based on quantity and rate
        diff = record_for_delete.quantity * record_for_delete.rate if record_for_delete else 0
    else:
        record_for_delete = db.query(ExpenseRecord).filter(
            ExpenseRecord.expense_id == record_id, 
            ExpenseRecord.buyer_mobile == buyer_mobile, 
            ExpenseRecord.seller_mobile == seller_mobile,
            ExpenseRecord.is_deleted ==0
            ).first()
                # Calculate diff for expense record (amount)
        diff = record_for_delete.amount if record_for_delete else 0

    if not record_for_delete:
        raise HTTPException(status_code=404, detail="Transaction not found")

    added_at_date = record_for_delete.added_at

    update_total_till_records(db, buyer_mobile, seller_mobile, added_at_date, -diff)
    db.delete(record_for_delete)
    db.commit()

    #return update_balances(db, buyer_mobile)
    return {"message": "Transaction deleted successfully"}



class GetTransactionsRequest(BaseModel):
    seller_mobile: str = Field(..., pattern="^[0-9]{10}$", description="10-digit seller mobile number")


@app.get("/get_transactions")
def get_transactions(
    db: Session = Depends(get_db), 
    buyer_mobile: str = Depends(get_current_user),
    request: GetTransactionsRequest = Depends()
):
    seller_mobile = request.seller_mobile
    return update_balances(db, buyer_mobile, seller_mobile)



def update_balances(db: Session, buyer_mobile: str, seller_mobile: str):
    transactions = []
    running_balance = 0.00  # ✅ Start with zero balance

    # ✅ Fetch and sort transactions correctly
    milk_records = db.query(MilkRecord).filter(
        MilkRecord.buyer_mobile == buyer_mobile,
        MilkRecord.seller_mobile == seller_mobile,
        MilkRecord.is_deleted ==0
    ).all()

    expense_records = db.query(ExpenseRecord).filter(
        ExpenseRecord.buyer_mobile == buyer_mobile,
        ExpenseRecord.seller_mobile == seller_mobile,
        ExpenseRecord.is_deleted ==0
    ).all()

    all_records = [
        {"type": "milk", "record": record, "amount": record.quantity * record.rate} for record in milk_records
    ] + [
        {"type": "expense", "record": record, "amount": record.amount} for record in expense_records
    ]

    # ✅ Sorting priority: custom_date → shift → added_at
    #all_records.sort(key=lambda x: (x["record"].custom_date, x["record"].shift if "shift" in x["record"].__dict__ else "Z", x["record"].added_at))

    #sorting by added at
    all_records.sort(key=lambda x: (x["record"].added_at))

    # ✅ Calculate and update running balance dynamically
    for entry in all_records:
        if entry["type"] == "milk":
            running_balance += entry["amount"]
        else:
            running_balance += entry["amount"]

        # ✅ Update record's `total_till_record` in the database
        entry["record"].total_till_record = round(running_balance, 2)

        transaction_data = {
            "id": entry["record"].id if entry["type"] == "milk" else entry["record"].expense_id,
            "type": entry["type"],
            "amount": round(entry["amount"], 2),
            "running_balance": round(running_balance, 2),
            "custom_date": entry["record"].custom_date,
            "added_at": entry["record"].added_at,
            "buyer_mobile": entry["record"].buyer_mobile,
            "seller_mobile": entry["record"].seller_mobile,
            "total_till_record": round(entry["record"].total_till_record, 2),
            "updated_at": getattr(entry["record"], "updated_at", None)
        }

        # Dynamically include fields based on type
        if entry["type"] == "milk":
            # Add milk-related fields dynamically
            for field in ["quantity", "fat", "snf", "rate", "milk_detail"]:
                if hasattr(entry["record"], field):
                    transaction_data[field] = getattr(entry["record"], field)
        elif entry["type"] == "expense":
            # Add expense-related fields dynamically
            for field in ["expense_detail"]:
                if hasattr(entry["record"], field):
                    transaction_data[field] = getattr(entry["record"], field)

        # Append the transaction data to the transactions list
        transactions.append(transaction_data)

    # ✅ Commit all changes to update `total_till_record` in the DB
    db.commit()

    return transactions

#to get all sellers under a particular buyer
@app.get("/get_seller_summary")
def get_seller_summary(
    db : Session = Depends(get_db),
    buyer_mobile : str = Depends(get_current_user)
):
    seller_details = []

    #fetch all customers
    sellers = db.query(Customer).filter(
        Customer.added_under == buyer_mobile,
        Customer.is_deleted ==0
    ).all()

    #getting details for particular seller
    for seller in sellers:
        seller_mobile = seller.mobile
        seller_name = seller.name
        last_record_milk = db.query(MilkRecord).filter(
            MilkRecord.seller_mobile == seller_mobile, 
            MilkRecord.buyer_mobile==buyer_mobile,
            MilkRecord.is_deleted ==0
        ).order_by(MilkRecord.added_at.desc()).first()

        last_record_expense = db.query(ExpenseRecord).filter(
            ExpenseRecord.seller_mobile == seller_mobile, 
            ExpenseRecord.buyer_mobile==buyer_mobile,
            ExpenseRecord.is_deleted ==0

        ).order_by(ExpenseRecord.added_at.desc()).first()

        # If both records are None, set default values
        if last_record_milk is None and last_record_expense is None:
            seller_balance = 0
            updated_date = None
        else:
            # Use the record with the most recent `added_at`
            if last_record_milk and last_record_expense:
                last_record = last_record_milk if last_record_milk.added_at > last_record_expense.added_at else last_record_expense
            elif last_record_milk:
                last_record = last_record_milk
            else:
                last_record = last_record_expense

            seller_balance = last_record.total_till_record
            updated_date = last_record.added_at

        seller_details.append(
            {
                "name":seller_name,
                "mobile": seller_mobile,
                "balance": seller_balance,
                "date": updated_date
            }
        )
    return {"message": "Seller details fetched successfully", "seller_details": seller_details}


#to get all buyers under a particular seller
@app.get("/get_buyer_summary")
def get_Buyer_summary(
    db : Session = Depends(get_db),
    seller_mobile : str = Depends(get_current_user)
):
    buyer_details = []

    #fetch all buyers
    buyers = db.query(Customer).filter(
        Customer.mobile == seller_mobile,
        Customer.is_deleted ==0
    ).all()

    #getting details for particular buyer
    for buyer in buyers:
        buyer_mobile = buyer.added_under
        buyer_name = None
        buyer_info = db.query(User).filter(
            User.mobile == buyer_mobile,
            User.is_deleted ==0
        ).first()
        if buyer_info:
            buyer_name = buyer_info.name

        last_record_milk = db.query(MilkRecord).filter(
            MilkRecord.seller_mobile == seller_mobile, 
            MilkRecord.buyer_mobile==buyer_mobile,
            MilkRecord.is_deleted==0
        ).order_by(MilkRecord.added_at.desc()).first()

        last_record_expense = db.query(ExpenseRecord).filter(
            ExpenseRecord.seller_mobile == seller_mobile, 
            ExpenseRecord.buyer_mobile==buyer_mobile,
            ExpenseRecord.is_deleted==0
        ).order_by(ExpenseRecord.added_at.desc()).first()

        # If both records are None, set default values
        if last_record_milk is None and last_record_expense is None:
            buyer_balance = 0
            updated_date = None
        else:
            # Use the record with the most recent `added_at`
            if last_record_milk and last_record_expense:
                last_record = last_record_milk if last_record_milk.added_at > last_record_expense.added_at else last_record_expense
            elif last_record_milk:
                last_record = last_record_milk
            else:
                last_record = last_record_expense

            buyer_balance = last_record.total_till_record
            updated_date = last_record.added_at

        buyer_details.append(
            {
                "name":buyer_name,
                "mobile": buyer_mobile,
                "balance": buyer_balance,
                "date": updated_date
            }
        )
    return {"message": "Buyer details fetched successfully", "buyer_details": buyer_details}


class EditProfile(BaseModel):
    seller_mobile: Optional[str] = Field(None, pattern="^[0-9]{10}$")  # Optional seller_mobile
    new_name: str

#to edit customers name and own name
@app.put("/edit_profile")
def edit_profile(
    record : EditProfile,
    db : Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user)
):
    record_to_change = None

    #if seller number is given then get seller's record
    if record.seller_mobile:
        old_customer_record = db.query(Customer).filter(
            Customer.mobile == record.seller_mobile,
            Customer.added_under == buyer_mobile,
            Customer.is_deleted ==0
        ).first()

        if not old_customer_record:
            raise HTTPException(status_code=404, detail="Customer not found")

        record_to_change = old_customer_record  # Set the record to change to the customers's record


    #if seller number is not given then get own record
    else:
        old_own_record = db.query(User).filter(
            User.mobile == buyer_mobile,
            User.is_deleted==0
        ).first()

        if not old_own_record:
            raise HTTPException(status_code=404, detail="User not found")

        record_to_change = old_own_record  # Set the record to change to the own record

    if not record.new_name or record.new_name.strip() == "":
        raise HTTPException(status_code=400, detail="New name cannot be empty or whitespace")


    record_to_change.name = record.new_name
    db.commit()
    db.refresh(record_to_change)

    return {"message": "Name updated successfully", "updated_name": record_to_change.name}


class DeleteCustomer(BaseModel):
    seller_mobile: str = Field(...,pattern="^[0-9]{10}$")

#to delete customer/seller for particular buyer
@app.delete("/delete_customer")
def delete_customer(
    record : DeleteCustomer,
    db : Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user)
):
    try:
        record_to_delete = None
    
        customer_record = db.query(Customer).filter(
            Customer.mobile == record.seller_mobile,
            Customer.added_under == buyer_mobile,
            Customer.is_deleted==0
        ).first()

        if not customer_record:
            raise HTTPException(status_code=404, detail="Customer not found")

        customer_record.is_deleted = 1

        all_record_milk = db.query(MilkRecord).filter(
            MilkRecord.seller_mobile == record.seller_mobile, 
            MilkRecord.buyer_mobile==buyer_mobile,
            MilkRecord.is_deleted==0
        ).all()

        all_record_expense = db.query(ExpenseRecord).filter(
            ExpenseRecord.seller_mobile == record.seller_mobile, 
            ExpenseRecord.buyer_mobile==buyer_mobile,
            ExpenseRecord.is_deleted==0
        ).all()

        # Set is_deleted to 1 for milk records
        for milk_record in all_record_milk:
            milk_record.is_deleted = 1

        # Set is_deleted to 1 for expense records
        for expense_record in all_record_expense:
            expense_record.is_deleted = 1

        db.commit()

        return {"message": "Customer and related milk/expense records deleted successfully"}
    
    except Exception as e:
        # Rollback in case of any failure
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting profile: {str(e)}")


#to delete buyer account
@app.delete("/delete_account")
def delete_account(
    db : Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user)
):
    try:
        account_record = db.query(User).filter(
            User.mobile == buyer_mobile,
            User.is_deleted ==0
        ).first()

        if not account_record:
            raise HTTPException(status_code=404, detail="User not found")

        account_record.is_deleted = 1

        rate_list_record = db.query(RateList).filter(
            RateList.buyer_mobile == buyer_mobile,
            RateList.is_deleted==0
        ).first()

        if rate_list_record:
            rate_list_record.is_deleted = 1

        all_record_milk = db.query(MilkRecord).filter( 
            MilkRecord.buyer_mobile==buyer_mobile,
            MilkRecord.is_deleted==0
        ).all()

        all_record_expense = db.query(ExpenseRecord).filter( 
            ExpenseRecord.buyer_mobile==buyer_mobile,
            ExpenseRecord.is_deleted==0
        ).all()

        all_record_customer = db.query(Customer).filter(
            Customer.added_under == buyer_mobile,
            Customer.is_deleted==0
        ).all()

        # Set is_deleted to 1 for milk records
        for milk_record in all_record_milk:
            milk_record.is_deleted = 1

        # Set is_deleted to 1 for expense records
        for expense_record in all_record_expense:
            expense_record.is_deleted = 1

        # Set is_deleted to 1 for customer records
        for customer_record in all_record_customer:
            customer_record.is_deleted = 1

        db.commit()

        return {"message": "User and related milk/expense/customers records deleted successfully"}
    
    except Exception as e:
        # Rollback in case of any failure
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting profile: {str(e)}")


# Pydantic models for request validation
class RateData(BaseModel):
    fat: float
    snf: float
    rate: float

class RateListRequest(BaseModel):
    rates: List[RateData]  # A list of RateData objects

@app.post("/store_rate_list")
def store_rate_list(
    record: RateListRequest, 
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user)
):
    try:
        get_user = db.query(User).filter(
            User.mobile== buyer_mobile,
            User.is_deleted==0
        ).first()

        if not get_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if the buyer already has an entry
        existing_rate_list = db.query(RateList).filter(
            RateList.buyer_mobile == buyer_mobile
        ).first()

        if existing_rate_list:
            # If the rate list is deleted, reactivate it
            if existing_rate_list.is_deleted == 1:
                existing_rate_list.is_deleted = 0

            # Update the existing rate list with new rates
            existing_rate_list.rates = [rate.dict() for rate in record.rates]

            db.commit()
            db.refresh(existing_rate_list)

            return {"message": "Rate list updated successfully"}

        # Create new RateList entry
        new_rate_list = RateList(
            buyer_mobile=buyer_mobile,
            rates=[rate.dict() for rate in record.rates],
        )

        # Add new rate list to the database
        db.add(new_rate_list)
        db.commit()
        db.refresh(new_rate_list)

        return {"message": "Rate list added successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.delete('/delete_rate_list')
def delete_rate_list(
    db : Session = Depends(get_db),
    buyer_mobile : str = Depends(get_current_user)
):
    rate_list_record = db.query(RateList).filter(
        RateList.buyer_mobile == buyer_mobile,
        RateList.is_deleted==0
    ).first()

    if not rate_list_record:
        raise HTTPException(status_code=404, detail="Rate List not found")
    
    rate_list_record.is_deleted = 1

    db.commit()

    return {"message": "Rate list deleted successfully"}

@app.get('/get_profile')
def get_profile(
    db: Session = Depends(get_db),
    buyer_mobile : str = Depends(get_current_user)
):
    user_info = db.query(User).filter(
        User.mobile == buyer_mobile,
        User.is_deleted==0
    ).first()
    
    user_dict = {
        "mobile": user_info.mobile,
        "name": user_info.name,
        "referral_code": user_info.referral_code,
        "is_deleted": user_info.is_deleted,
        "registered_at": user_info.registered_at
    }
    
    return user_dict

@app.get('/fetch_rate')
def fetch_rate(
    fat: float,
    snf : float,
    db : Session = Depends(get_db),
    buyer_mobile : str = Depends(get_current_user)
):
    rate_list = db.query(RateList).filter(
        RateList.buyer_mobile == buyer_mobile,
        RateList.is_deleted==0
    ).first()

    if not rate_list:
        raise HTTPException(status_code=404, detail="Rate List not found")
    
    matching_rate = None
    for rate in rate_list.rates:
        if rate['fat'] == fat and rate["snf"] == snf:
            matching_rate = rate
            break

    if not matching_rate:
        raise HTTPException(status_code=404, detail="Rate for given Fat and SNF is not found")
    
    return {
        "buyer_mobile": rate_list.buyer_mobile, 
            "fat": fat, 
            "snf": snf, 
            "rate": matching_rate['rate']
        }

@app.post('/take_subscription')
def take_subscription(
    subscription_request: SubscriptionRequest,  # Body parameter
    db : Session = Depends(get_db),
    buyer_mobile : str = Depends(get_current_user)  
):
    local_time = datetime.now(local_timezone).replace(tzinfo=None)
    plan_id = subscription_request.plan_id
    user_info = db.query(User).filter(
        User.mobile == buyer_mobile,
        User.is_deleted==0
    ).first()

    subscription_info = db.query(Subscription).filter(
        Subscription.buyer_mobile == buyer_mobile
    ).order_by(Subscription.end_date.desc()).first()

    subscription_plan_info = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.id == plan_id
    ).first()

    if not subscription_plan_info:
        raise HTTPException(status_code=404, detail="Subscription plan not found")

    if subscription_info:
        if subscription_info.subscription_type.lower() == "partial":
            if subscription_plan_info.access_type.lower() == "partial":
                if subscription_info.end_date < local_time.date():
                    subscription_info.start_date=local_time.date()
                    subscription_info.end_date = local_time.date() + timedelta(days=subscription_plan_info.validity-1)
                else:
                    subscription_info.end_date += timedelta(days=subscription_plan_info.validity)
            else:
                if subscription_info.end_date < local_time.date():
                    start_date=local_time.date()
                    end_date = local_time.date() + timedelta(days=subscription_plan_info.validity-1)
                else:
                    start_date=subscription_info.end_date + timedelta(days=1)
                    end_date = subscription_info.end_date + timedelta(days=subscription_plan_info.validity)

                new_entry = Subscription(
                    buyer_mobile=buyer_mobile,
                    start_date=start_date,
                    end_date=end_date,
                    subscription_type=subscription_plan_info.access_type
                )
                db.add(new_entry)
                db.commit()
                return {"message" : "Subscription added succesfully"}

        else:
            if subscription_plan_info.access_type.lower() == "full":
                if subscription_info.end_date < local_time.date():
                    subscription_info.start_date=local_time.date()
                    subscription_info.end_date = local_time.date() + timedelta(days=subscription_plan_info.validity-1)
                else:
                    subscription_info.end_date += timedelta(days=subscription_plan_info.validity)
            else:
                if subscription_info.end_date < local_time.date():
                    start_date=local_time.date()
                    end_date = local_time.date() + timedelta(days=subscription_plan_info.validity-1)
                else:
                    start_date=subscription_info.end_date + timedelta(days=1)
                    end_date = subscription_info.end_date + timedelta(days=subscription_plan_info.validity)
                    
                new_entry = Subscription(
                    buyer_mobile=buyer_mobile,
                    start_date=start_date,
                    end_date=end_date,
                subscription_type=subscription_plan_info.access_type
        )
                db.add(new_entry)
                db.commit()
                return {"message" : "Subscription added succesfully"}

    else:
        free_trial = user_info.registered_at
        free_trial_end_date = free_trial.date()+ timedelta(days = 30-1)

        if free_trial_end_date < local_time.date():
            start_date = local_time.date()
            end_date = local_time.date() + timedelta(days=subscription_plan_info.validity-1)
            
        else:
            start_date = free_trial_end_date + timedelta(days = 1)
            end_date = start_date + timedelta(days=subscription_plan_info.validity-1)

        new_entry = Subscription(
            buyer_mobile=buyer_mobile,
            start_date=start_date,
            end_date=end_date,
            subscription_type=subscription_plan_info.access_type
        )
        db.add(new_entry)
        db.commit()
        return {"message" : "Subscription added succesfully"}
    
    db.commit()
    return {"message" : "Subscription added succesfully"}

    

@app.get('/check_subscription')
def check_subscription(
    db : Session = Depends(get_db),
    buyer_mobile : str = Depends(get_current_user)
):
    user_info = db.query(User).filter(
        User.mobile == buyer_mobile,
        User.is_deleted == 0
    ).first()

    local_time = datetime.now(local_timezone).replace(tzinfo=None)

    # Calculate days since the user registered
    days_till_now = (local_time - user_info.registered_at).days
    print(user_info.registered_at)

    if days_till_now <= 30:
        return {"message": "User is on free trial"}

    # After 30 days, check the subscription status
    subscription_info = db.query(Subscription).filter(
        Subscription.buyer_mobile == buyer_mobile,
        Subscription.start_date <= local_time.date(),
        Subscription.end_date >= local_time.date()
    ).first()

    if subscription_info:
        subscription_type = subscription_info.subscription_type
        return {"message": "User is on subscription", "subsription_type": subscription_type}

    # If no active subscription found
    raise HTTPException(status_code=404, detail="Subscription is not live")

    


