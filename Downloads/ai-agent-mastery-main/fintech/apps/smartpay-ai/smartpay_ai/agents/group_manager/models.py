"""
Pydantic models for the Group Manager agent.

Location: backend_python/smartpay_ai/agents/group_manager/models.py
Purpose: Input/output schemas for group management.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class GroupMember(BaseModel):
    """Group member details."""
    user_id: str
    name: str
    role: str = "member"  # "admin", "member"
    joined_at: Optional[str] = None
    contribution: float = 0.0
    status: str = "active"  # "active", "invited", "removed"


class GroupInfo(BaseModel):
    """Group information."""
    id: str
    name: str
    description: Optional[str] = None
    group_type: str = "general"  # "general", "stokvel", "business", "family", "event"
    wallet_balance: float = 0.0
    member_count: int
    created_by: str
    created_at: Optional[str] = None
    total_contributions: float = 0.0
    total_expenses: float = 0.0


class GroupAction(BaseModel):
    """Recommended or pending group action."""
    action_type: str  # "invite", "remove", "contribute", "split", "withdraw"
    description: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    priority: str = "medium"  # "low", "medium", "high"


class GroupManagementRequest(BaseModel):
    """Input for group management."""
    query: str
    user_id: str
    group_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class GroupManagementResponse(BaseModel):
    """Output from group manager."""
    summary: str
    group_info: Optional[GroupInfo] = None
    members: List[GroupMember] = Field(default_factory=list)
    pending_actions: List[GroupAction] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)
