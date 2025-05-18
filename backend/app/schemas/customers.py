from pydantic import BaseModel, Field


class AddCustomerRequest(BaseModel):
    mobile: str = Field(..., pattern="^[0-9]{10}$", example="9876543210")
    name: str


class DeleteCustomer(BaseModel):
    seller_mobile: str = Field(..., pattern="^[0-9]{10}$")
