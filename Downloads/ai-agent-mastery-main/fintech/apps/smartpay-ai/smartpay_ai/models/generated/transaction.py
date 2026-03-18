"""
Generated Pydantic models from JSON Schema
Generated at: 2026-03-18T12:10:23.831325
@generated DO NOT EDIT MANUALLY
"""

from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field


from typing import Literal
from pydantic import BaseModel, Field


class Transaction(BaseModel):
    """
    Transaction
    SmartPay transaction record
    
    @generated Generated from JSON Schema - DO NOT EDIT MANUALLY
    """

    id: str = Field(..., description="Unique transaction identifier")
    wallet_id: str = Field(..., description="Wallet involved in transaction")
    type: Literal["voucher_redeem", "send", "receive", "cash_out", "bill_pay", "airtime", "loan_disbursement", "loan_repayment", "add_money", "group_contribution", "group_withdrawal", "transfer_out", "transfer_in", "payment", "redemption", "fee", "load", "refund"] = Field(..., description="Transaction type")
    amount: float = Field(..., description="Transaction amount")
    balance_after: Optional[float] = Field(None, description="Account balance after transaction")
    reference_type: Optional[str] = Field(None, description="Type of reference (e.g., invoice, order)")
    reference_id: Optional[str] = Field(None, description="External reference identifier")
    reference: Optional[str] = Field(None, description="Human-readable reference")
    description: Optional[str] = Field(None, description="Transaction description")
    status: Optional[Literal["success", "pending", "failed", "completed"]] = Field(None, description="Transaction status")
    created_at: str = Field(..., description="Transaction timestamp")
