"""
Pydantic models for the Transaction Analyst agent.

Location: backend_python/smartpay_ai/agents/transaction_analyst/models.py
Purpose: Input/output schemas for spending analysis.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CategoryBreakdown(BaseModel):
    """Breakdown of spending by category."""
    category: str
    amount: float
    percentage: float
    transaction_count: int


class SpendingInsight(BaseModel):
    """Individual spending insight."""
    type: str  # "warning", "tip", "achievement", "anomaly"
    title: str
    description: str
    impact: str  # "high", "medium", "low"


class BudgetRecommendation(BaseModel):
    """Budget recommendation for a category."""
    category: str
    current_spending: float
    recommended_budget: float
    reasoning: str


class AnalysisRequest(BaseModel):
    """Input for transaction analysis."""
    query: str
    user_id: str
    period: Optional[str] = "month"  # "week", "month", "quarter", "year"
    category: Optional[str] = None  # Filter by category
    context: Optional[Dict[str, Any]] = None


class AnalysisResponse(BaseModel):
    """Output from transaction analysis."""
    summary: str
    total_spent: float
    total_income: float
    net_balance: float
    period: str
    category_breakdown: List[CategoryBreakdown] = Field(default_factory=list)
    insights: List[SpendingInsight] = Field(default_factory=list)
    recommendations: List[BudgetRecommendation] = Field(default_factory=list)
    top_merchants: List[Dict[str, Any]] = Field(default_factory=list)
    spending_trend: str  # "increasing", "decreasing", "stable"
    vs_last_period: Optional[float] = None  # Percentage change
