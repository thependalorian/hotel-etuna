"""
Pydantic models for the Bill Assistant agent.

Location: backend_python/smartpay_ai/agents/bill_assistant/models.py
Purpose: Input/output schemas for bill management.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class BillReminder(BaseModel):
    """Upcoming bill reminder."""
    bill_id: str
    name: str
    amount: float
    due_date: str  # ISO date string
    category: str  # "utilities", "rent", "insurance", "subscriptions", "loan", "other"
    status: str = "pending"  # "pending", "paid", "overdue"
    days_until_due: int
    priority: str = "medium"  # "low", "medium", "high"
    recurring: bool = False


class SplitBill(BaseModel):
    """Split bill request details."""
    split_id: str
    bill_name: str
    total_amount: float
    your_share: float
    group_id: Optional[str] = None
    group_name: Optional[str] = None
    participants: List[Dict[str, Any]] = Field(default_factory=list)
    paid_by: List[str] = Field(default_factory=list)
    pending_from: List[str] = Field(default_factory=list)
    status: str = "pending"  # "pending", "partial", "complete"


class PaymentRecommendation(BaseModel):
    """Recommendation for bill payment optimization."""
    type: str  # "timing", "method", "consolidation", "automation"
    title: str
    description: str
    potential_savings: Optional[float] = None
    priority: str = "medium"


class BillAssistanceRequest(BaseModel):
    """Input for bill assistance."""
    query: str
    user_id: str
    bill_id: Optional[str] = None
    group_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class BillAssistanceResponse(BaseModel):
    """Output from bill assistant."""
    summary: str
    upcoming_bills: List[BillReminder] = Field(default_factory=list)
    overdue_bills: List[BillReminder] = Field(default_factory=list)
    split_bills: List[SplitBill] = Field(default_factory=list)
    total_due: float = 0.0
    recommendations: List[PaymentRecommendation] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)
