from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class AddMilkRecordRequest(BaseModel):
    seller_mobile: str = Field(..., pattern="^[0-9]{10}$")
    quantity: float
    fat: float = None
    snf: float = None
    rate: float
    shift: str = Field(None, pattern="^(M|E)$")
    custom_date: date = None
    milk_detail: Optional[str] = Field(None, max_length=256)


class AddExpenseRecordRequest(BaseModel):
    seller_mobile: str = Field(..., pattern="^[0-9]{10}$")
    amount: float
    expense_detail: Optional[str] = Field(None, max_length=256)
    transaction_type: str = Field(..., pattern="^(GAVE|GOT)$")
    custom_date: date = None


class GetTransactionsSellerRequest(BaseModel):
    buyer_mobile: str = Field(
        ..., pattern="^[0-9]{10}$", description="10-digit buyer mobile number"
    )


class GetTransactionsRequest(BaseModel):
    seller_mobile: str = Field(
        ..., pattern="^[0-9]{10}$", description="10-digit seller mobile number"
    )

class GetTotalDateBasisRecordRequest(BaseModel):
    start_date: date = None
    end_date: date = None

class GetCustomersDateBasisRecordRequest(BaseModel):
    start_date: date = None
    end_date: date = None
    seller_mobile: str = Field(
        ..., pattern="^[0-9]{10}$", description="10-digit seller mobile number"
    )