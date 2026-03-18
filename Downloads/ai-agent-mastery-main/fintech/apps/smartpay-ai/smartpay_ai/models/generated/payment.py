"""
Generated Pydantic models from JSON Schema
Generated at: 2026-03-18T12:10:23.830530
@generated DO NOT EDIT MANUALLY
"""

from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field


from pydantic import BaseModel, Field


class SendMoneyRequest(BaseModel):
    """
    SendMoneyRequest
    
    @generated Generated from JSON Schema - DO NOT EDIT MANUALLY
    """

    recipient_id: str = Field(..., description="Recipient user ID")
    amount: float = Field(..., description="Payment amount")
    note: Optional[str] = Field(None, description="Optional payment note")
    fromWalletId: Optional[str] = Field(None, description="Source wallet ID")


from typing import Literal
from pydantic import BaseModel, Field


class CashOutRequest(BaseModel):
    """
    CashOutRequest
    
    @generated Generated from JSON Schema - DO NOT EDIT MANUALLY
    """

    amount: float = Field(..., description="Cash out amount")
    method: Literal["atm", "agent", "bank"] = Field(..., description="Cash out method")
    walletId: Optional[str] = Field(None, description="Source wallet ID")


from typing import Literal
from pydantic import BaseModel, Field


class P2PTransaction(BaseModel):
    """
    P2PTransaction
    
    @generated Generated from JSON Schema - DO NOT EDIT MANUALLY
    """

    id: str = Field(..., description="Transaction ID")
    sender_id: str = Field(..., description="Sender user ID")
    recipient_id: str = Field(..., description="Recipient user ID")
    wallet_id: str = Field(..., description="Wallet ID")
    amount: float = Field(..., description="Transaction amount")
    note: Optional[str] = Field(None, description="Transaction note")
    status: Literal["success", "pending", "failed", "completed"] = Field(..., description="Transaction status")
    created_at: str = Field(..., description="Transaction timestamp")
