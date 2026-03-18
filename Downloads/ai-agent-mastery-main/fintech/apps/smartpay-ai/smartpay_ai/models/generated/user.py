"""
Generated Pydantic models from JSON Schema
Generated at: 2026-03-18T12:10:23.829210
@generated DO NOT EDIT MANUALLY
"""

from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field


from typing import Literal
from pydantic import BaseModel, Field


class User(BaseModel):
    """
    User
    SmartPay user account representation
    
    @generated Generated from JSON Schema - DO NOT EDIT MANUALLY
    """

    id: str = Field(..., description="Unique user identifier")
    phone: str = Field(..., description="User phone number (Namibian format)")
    email: Optional[str] = Field(None, description="User email address")
    first_name: Optional[str] = Field(None, description="User's first name")
    last_name: Optional[str] = Field(None, description="User's last name")
    full_name: Optional[str] = Field(None, description="User's full name")
    photo_url: Optional[str] = Field(None, description="URL to user's profile photo")
    pin_hash: Optional[str] = Field(None, description="Hashed PIN for authentication")
    pin_salt: Optional[str] = Field(None, description="Salt used for PIN hashing")
    last_proof_of_life: Optional[str] = Field(None, description="Last proof of life verification timestamp")
    proof_of_life_due_date: Optional[str] = Field(None, description="Next proof of life due date")
    wallet_status: Literal["active", "inactive", "suspended", "closed"] = Field(..., description="Current wallet status")
    fineract_client_id: Optional[int] = Field(None, description="Fineract integration client ID")
    created_at: str = Field(..., description="Account creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")
