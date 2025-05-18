from pydantic import BaseModel, Field
from typing import Optional


class SignupRequest(BaseModel):
    mobile: str = Field(..., pattern="^[0-9]{10}$", example="9876543210")
    name: str
    referral_code: Optional[str] = None


class OtpRequest(BaseModel):
    mobile: str = Field(..., pattern="^[0-9]{10}$", example="9876543210")


class LoginRequest(BaseModel):
    mobile: str = Field(..., pattern="^[0-9]{10}$", example="9876543210")
    otp: str = Field(..., pattern="^[0-9]{6}$", example="987654")
