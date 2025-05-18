from pydantic import BaseModel, Field
from typing import Optional


class EditProfile(BaseModel):
    seller_mobile: Optional[str] = Field(None, pattern="^[0-9]{10}$")
    new_name: str
