"""
Savings Advisor agent: savings goals, recommendations, and progress tracking.

Location: backend_python/smartpay_ai/agents/savings_advisor/
Purpose: Help users set and achieve savings goals with personalized advice.
"""

from .agent import run_savings_advisor, get_savings_advisor_agent
from .models import SavingsRequest, SavingsAdviceResponse

__all__ = [
    "run_savings_advisor",
    "get_savings_advisor_agent",
    "SavingsRequest",
    "SavingsAdviceResponse",
]
