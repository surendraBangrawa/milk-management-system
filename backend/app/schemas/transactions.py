from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import date, datetime
from sqlalchemy.orm import Session


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
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class GetTransactionsRequest(BaseModel):
    seller_mobile: str = Field(
        ..., pattern="^[0-9]{10}$", description="10-digit seller mobile number"
    )
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class GetTotalDateBasisRecordRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class MilkRecordResponse(BaseModel):
    id: int
    added_at: datetime
    custom_date: datetime
    buyer_mobile: str
    seller_mobile: str
    quantity: float
    fat: Optional[float]
    snf: Optional[float]
    rate: Optional[float]
    amount:float
    shift: str
    milk_detail: Optional[str]
    is_deleted: bool

    class Config:
        from_attributes = True # Use from_attributes instead of orm_mode

class ExpenseRecordResponse(BaseModel):
    expense_id: int
    added_at: datetime
    custom_date: datetime
    buyer_mobile: str
    seller_mobile: str
    amount: float
    expense_detail: Optional[str]
    is_deleted: bool

    class Config:
        from_attributes = True # Use from_attributes instead of orm_mode


class TotalRecordsSimplifiedResponse(BaseModel):
    records: List[Union[MilkRecordResponse, ExpenseRecordResponse]]
    total_milk_quantity: float
    total_milk_amount: float
    total_expense_amount: float
    total_entries_count: int


class GetCustomersDateBasisRecordRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    seller_mobile: str = Field(
        ..., pattern="^[0-9]{10}$", description="10-digit seller mobile number"
    )

class SellerSummaryDetail(BaseModel):
    name: str
    mobile: str
    balance: float
    date: Optional[datetime]

class CustomerSummaryResponse(BaseModel):
    message: str
    seller_details: List[SellerSummaryDetail]
    total_sellers_count: int
    total_you_will_give: float
    total_you_will_get: float

class BuyerSummaryDetail(BaseModel):
    name: str
    mobile: str
    balance: float
    date: Optional[datetime]

class SupplierSummaryResponse(BaseModel):
    message: str
    buyer_details: List[BuyerSummaryDetail]
    total_buyers_count: int
    total_you_will_give: float # Supplier (seller) gives to buyer (balance > 0 from seller's perspective)
    total_you_will_get: float  # Supplier (seller) gets from buyer (balance < 0 from seller's perspective)
