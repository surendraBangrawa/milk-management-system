# app/schemas/ratelist.py

from pydantic import BaseModel
from typing import List


# Pydantic models for request validation and response serialization
class RateData(BaseModel):
    """Schema for a single rate entry (Fat, SNF, Rate)."""

    fat: float
    snf: float
    rate: float


class RateListRequest(BaseModel):
    """Schema for the request body when storing a rate list."""
    min_fat : float
    max_fat : float
    min_snf : float
    max_snf : float
    rates: List[RateData]  # A list of RateData objects


# You might also define response schemas here if they differ from request schemas
# class RateListResponse(BaseModel):
#     message: str
#     # Add other fields if needed
