from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import date, datetime
from sqlalchemy.orm import Session


class AddMilkRecordRequest(BaseModel):
    seller_mobile: str = Field(..., pattern="^[0-9]{10}$")
    quantity: float = Field(..., gt=0, le=10000)  # Reasonable limits for milk quantity
    fat: Optional[float] = Field(None, ge=0, le=100)  # Fat percentage 0-100
    snf: Optional[float] = Field(None, ge=0, le=100)  # SNF percentage 0-100
    rate: float = Field(..., gt=0, le=1000)  # Reasonable rate limits
    shift: Optional[str] = Field(None, pattern="^(M|E)$")
    custom_date: Optional[date] = None
    milk_detail: Optional[str] = Field(None, max_length=256)

    @validator("quantity")
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be positive")
        if v > 10000:
            raise ValueError("Quantity cannot exceed 10,000 kg")
        return round(v, 2)

    @validator("fat")
    def validate_fat(cls, v):
        if v is not None:
            if v < 0 or v > 100:
                raise ValueError("Fat percentage must be between 0 and 100")
            return round(v, 2)
        return v

    @validator("snf")
    def validate_snf(cls, v):
        if v is not None:
            if v < 0 or v > 100:
                raise ValueError("SNF percentage must be between 0 and 100")
            return round(v, 2)
        return v

    @validator("rate")
    def validate_rate(cls, v):
        if v <= 0:
            raise ValueError("Rate must be positive")
        if v > 1000:
            raise ValueError("Rate cannot exceed ₹1000")
        return round(v, 2)


class AddExpenseRecordRequest(BaseModel):
    seller_mobile: str = Field(..., pattern="^[0-9]{10}$")
    amount: float = Field(..., gt=-1000000, lt=1000000)  # Reasonable amount limits
    transaction_type: str = Field(..., pattern="^(GAVE|GOT)$")
    expense_detail: Optional[str] = Field(None, max_length=256)
    custom_date: Optional[date] = None

    @validator("amount")
    def validate_amount(cls, v):
        if abs(v) > 1000000:
            raise ValueError("Amount cannot exceed ₹10,00,000")
        return round(v, 2)


class GetTransactionsRequest(BaseModel):
    seller_mobile: str = Field(..., pattern="^[0-9]{10}$")
    offset: int = Field(0, ge=0)
    limit: int = Field(20, ge=1, le=100)


class GetTransactionsSellerRequest(BaseModel):
    buyer_mobile: str = Field(..., pattern="^[0-9]{10}$")
    offset: int = Field(0, ge=0)
    limit: int = Field(20, ge=1, le=100)


class GetTotalDateBasisRecordRequest(BaseModel):
    start_date: date
    end_date: date

    @validator("end_date")
    def validate_date_range(cls, v, values):
        if "start_date" in values and v < values["start_date"]:
            raise ValueError("End date cannot be before start date")
        return v


class GetCustomersDateBasisRecordRequest(BaseModel):
    seller_mobile: str = Field(..., pattern="^[0-9]{10}$")
    start_date: date
    end_date: date

    @validator("end_date")
    def validate_date_range(cls, v, values):
        if "start_date" in values and v < values["start_date"]:
            raise ValueError("End date cannot be before start date")
        return v


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
    amount: float
    shift: str
    milk_detail: Optional[str]
    is_deleted: bool

    class Config:
        from_attributes = True  # Use from_attributes instead of orm_mode


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
        from_attributes = True


class TotalRecordsSimplifiedResponse(BaseModel):
    total_milk_quantity: float
    total_milk_amount: float
    total_expense_amount: float
    net_amount: float
    records: List[Dict[str, Any]]


class CustomerSummaryDetail(BaseModel):
    seller_mobile: str
    seller_name: str
    total_milk_quantity: float
    total_milk_amount: float
    total_expense_amount: float
    net_amount: float
    last_transaction_date: Optional[datetime]


class CustomerSummaryResponse(BaseModel):
    total_customers: int
    total_milk_quantity: float
    total_milk_amount: float
    total_expense_amount: float
    net_amount: float
    customers: List[CustomerSummaryDetail]


class SellerSummaryDetail(BaseModel):
    buyer_mobile: str
    buyer_name: str
    total_milk_quantity: float
    total_milk_amount: float
    total_expense_amount: float
    net_amount: float
    last_transaction_date: Optional[datetime]


class SupplierSummaryResponse(BaseModel):
    total_buyers: int
    total_milk_quantity: float
    total_milk_amount: float
    total_expense_amount: float
    net_amount: float
    buyers: List[SellerSummaryDetail]


class BuyerSummaryDetail(BaseModel):
    seller_mobile: str
    seller_name: str
    total_milk_quantity: float
    total_milk_amount: float
    total_expense_amount: float
    net_amount: float
    last_transaction_date: Optional[datetime]
