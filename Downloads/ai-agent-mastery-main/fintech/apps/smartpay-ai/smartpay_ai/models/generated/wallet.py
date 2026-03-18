"""
Generated Pydantic models from JSON Schema
Generated at: 2026-03-18T12:10:23.830879
@generated DO NOT EDIT MANUALLY
"""

from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field


from typing import Literal
from pydantic import BaseModel, Field


class Wallet(BaseModel):
    """
    Wallet
    SmartPay wallet (main, savings, or grant)
    
    @generated Generated from JSON Schema - DO NOT EDIT MANUALLY
    """

    id: str = Field(..., description="Unique wallet identifier")
    user_id: str = Field(..., description="Owner user ID")
    name: str = Field(..., description="Wallet display name")
    type: Literal["main", "savings", "grant"] = Field(..., description="Wallet type")
    balance: float = Field(..., description="Current wallet balance")
    currency: Literal["NAD"] = Field(..., description="Currency code (always NAD)")
    is_primary: Optional[bool] = Field(None, description="Whether this is the primary wallet")
    fineract_savings_account_id: Optional[int] = Field(None, description="Fineract integration account ID")
    created_at: str = Field(..., description="Wallet creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")
