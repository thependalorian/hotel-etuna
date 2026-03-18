"""
Pydantic models for the Savings Advisor agent.

Location: backend_python/smartpay_ai/agents/savings_advisor/models.py
Purpose: Input/output schemas for savings advice and goal tracking.
"""

from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class SavingsGoal(BaseModel):
    """Represents a savings goal."""
    id: Optional[str] = None
    name: str
    target_amount: float
    current_amount: float = 0.0
    deadline: Optional[str] = None  # ISO date string
    priority: str = "medium"  # "low", "medium", "high"
    category: Optional[str] = None  # "emergency", "education", "housing", "travel", "other"
    progress_percentage: float = 0.0
    on_track: bool = True
    monthly_target: Optional[float] = None


class SavingsRecommendation(BaseModel):
    """A specific savings recommendation."""
    type: str  # "goal", "opportunity", "strategy", "investment"
    title: str
    description: str
    potential_savings: Optional[float] = None
    effort: str = "medium"  # "low", "medium", "high"
    priority: str = "medium"  # "low", "medium", "high"


class SavingsTip(BaseModel):
    """Quick savings tip."""
    category: str  # "budgeting", "automation", "cutting_costs", "income"
    tip: str
    impact: str = "medium"  # "low", "medium", "high"


class SavingsRequest(BaseModel):
    """Input for savings advice."""
    query: str
    user_id: str
    goal_id: Optional[str] = None  # Specific goal to focus on
    context: Optional[Dict[str, Any]] = None


class SavingsAdviceResponse(BaseModel):
    """Output from savings advisor."""
    summary: str
    total_savings: float
    monthly_savings_rate: float
    savings_ratio: Optional[float] = None  # Percentage of income
    goals: List[SavingsGoal] = Field(default_factory=list)
    recommendations: List[SavingsRecommendation] = Field(default_factory=list)
    tips: List[SavingsTip] = Field(default_factory=list)
    emergency_fund_status: Optional[Dict[str, Any]] = None
    next_steps: List[str] = Field(default_factory=list)
