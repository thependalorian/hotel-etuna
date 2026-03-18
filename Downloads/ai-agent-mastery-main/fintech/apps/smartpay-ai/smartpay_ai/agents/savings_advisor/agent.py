"""
Savings Advisor agent: Pydantic AI agent and run_savings_advisor.

Location: backend_python/smartpay_ai/agents/savings_advisor/agent.py
Purpose: Help users set and achieve savings goals.

REFACTORED: Now uses BaseAgent to eliminate boilerplate duplication.
"""

import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional

from pydantic_ai import Agent, RunContext

from smartpay_ai.agents.base_agent import BaseAgent, BaseAgentDeps
from smartpay_ai.providers import get_llm_model

from .models import SavingsAdviceResponse, SavingsGoal, SavingsRecommendation, SavingsTip
from .prompts import SAVINGS_ADVISOR_SYSTEM_PROMPT
from . import tools

logger = logging.getLogger(__name__)


@dataclass
class SavingsAdvisorDeps(BaseAgentDeps):
    """Dependencies injected into the Savings Advisor agent."""
    pass


# ---------------------------------------------------------------------------
# Savings Advisor Agent Implementation
# ---------------------------------------------------------------------------

class SavingsAdvisorAgent(BaseAgent[SavingsAdvisorDeps, SavingsAdviceResponse]):
    """
    Savings Advisor agent using BaseAgent for DRY compliance.
    
    Eliminates ~60 lines of boilerplate by inheriting common patterns
    from BaseAgent.
    """
    
    def __init__(self):
        super().__init__(
            agent_name="savings_advisor",
            deps_type=SavingsAdvisorDeps,
            output_type=SavingsAdviceResponse,
            system_prompt=SAVINGS_ADVISOR_SYSTEM_PROMPT,
        )
    
    def _register_tools(self, agent: Agent) -> None:
        """Register savings advisory tools."""
        agent.tool(self._get_savings_goals)
        agent.tool(self._calculate_savings_rate)
        agent.tool(self._identify_savings_opportunities)
        agent.tool(self._project_goal_completion)
        agent.tool(self._check_emergency_fund)
    
    def get_default_response(self, error_message: str) -> SavingsAdviceResponse:
        """Return a safe default savings advice response."""
        return SavingsAdviceResponse(
            summary=error_message,
            total_savings=0.0,
            monthly_savings_rate=0.0,
        )
    
    # -----------------------------------------------------------------------
    # Tool Implementations
    # -----------------------------------------------------------------------
    
    async def _get_savings_goals(self, ctx: RunContext[SavingsAdvisorDeps]) -> str:
        """Retrieve user's active savings goals with progress."""
        goals = await tools.get_savings_goals(
            user_id=ctx.deps.user_id,
            db_pool=ctx.deps.db_pool,
        )
        
        if not goals:
            return "No active savings goals. Consider setting up an emergency fund first!"
        
        summary = [f"You have {len(goals)} active savings goals:"]
        for i, goal in enumerate(goals, 1):
            name = goal.get("name", "Unnamed Goal")
            target = float(goal.get("target_amount", 0))
            current = float(goal.get("current_amount", 0))
            progress = (current / target * 100) if target > 0 else 0
            summary.append(f"{i}. {name}: N${current:.2f} / N${target:.2f} ({progress:.1f}%)")
        
        return "\n".join(summary)
    
    async def _calculate_savings_rate(
        self,
        ctx: RunContext[SavingsAdvisorDeps],
        period: str = "month",
    ) -> str:
        """Calculate user's savings rate and patterns."""
        metrics = await tools.calculate_savings_rate(
            user_id=ctx.deps.user_id,
            period=period,
            db_pool=ctx.deps.db_pool,
        )
        
        total_saved = metrics.get("total_saved", 0.0)
        monthly_avg = metrics.get("monthly_average", 0.0)
        savings_ratio = metrics.get("savings_ratio", 0.0)
        total_income = metrics.get("total_income", 0.0)
        
        return f"""Savings Analysis for {period}:
- Total Saved: N${total_saved:.2f}
- Monthly Average: N${monthly_avg:.2f}
- Savings Rate: {savings_ratio:.1f}% of income
- Total Income: N${total_income:.2f}
"""
    
    async def _identify_savings_opportunities(self, ctx: RunContext[SavingsAdvisorDeps]) -> str:
        """Find areas where user can save more money."""
        opportunities = await tools.identify_savings_opportunities(
            user_id=ctx.deps.user_id,
            db_pool=ctx.deps.db_pool,
        )
        
        if not opportunities:
            return "Great job! Your spending is well-optimized. Focus on maintaining current savings rate."
        
        summary = [f"Found {len(opportunities)} savings opportunities:"]
        for i, opp in enumerate(opportunities, 1):
            category = opp.get("category", "Unknown")
            current = opp.get("current_spending", 0)
            potential = opp.get("potential_savings", 0)
            suggestion = opp.get("suggestion", "")
            summary.append(
                f"{i}. {category}: Save N${potential:.2f}/month (currently spending N${current:.2f})\n   {suggestion}"
            )
        
        return "\n".join(summary)
    
    async def _project_goal_completion(
        self,
        ctx: RunContext[SavingsAdvisorDeps],
        goal_name: str,
        monthly_savings: float,
    ) -> str:
        """Project when a savings goal will be completed."""
        goals = await tools.get_savings_goals(
            user_id=ctx.deps.user_id,
            db_pool=ctx.deps.db_pool,
        )
        
        matching_goal = next(
            (g for g in goals if goal_name.lower() in g.get("name", "").lower()),
            None
        )
        
        if not matching_goal:
            return f"Goal '{goal_name}' not found"
        
        projection = await tools.project_goal_completion(matching_goal, monthly_savings)
        
        status = projection.get("status", "unknown")
        months = projection.get("months_remaining", 0)
        projected_date = projection.get("projected_date", "")
        on_track = projection.get("on_track", False)
        
        if status == "completed":
            return f"Goal '{goal_name}' is already completed! 🎉"
        
        if status == "no_progress":
            return f"No savings detected for '{goal_name}'. Start saving to see progress!"
        
        track_status = "on track ✓" if on_track else "behind schedule ⚠"
        return f"""Goal Projection for '{goal_name}':
- Estimated Completion: {projected_date[:10]}
- Months Remaining: {months:.1f}
- Status: {track_status}
- Monthly Target: N${projection.get('monthly_target', 0):.2f}
"""
    
    async def _check_emergency_fund(self, ctx: RunContext[SavingsAdvisorDeps]) -> str:
        """Check emergency fund status and adequacy."""
        ef_status = await tools.check_emergency_fund(
            user_id=ctx.deps.user_id,
            db_pool=ctx.deps.db_pool,
        )
        
        status = ef_status.get("status", "unknown")
        current = ef_status.get("current_amount", 0.0)
        target = ef_status.get("target_amount", 0.0)
        months = ef_status.get("months_covered", 0.0)
        percentage = ef_status.get("percentage", 0.0)
        
        status_emoji = {
            "excellent": "🌟",
            "good": "✓",
            "fair": "⚠",
            "critical": "🚨",
            "unknown": "?"
        }.get(status, "?")
        
        return f"""Emergency Fund Status {status_emoji}:
- Current Amount: N${current:.2f}
- Target (6 months expenses): N${target:.2f}
- Coverage: {months:.1f} months ({percentage:.1f}%)
- Status: {status.upper()}

Recommendation: {"You're well-protected!" if status in ["excellent", "good"] else "Keep building your emergency fund—aim for 6 months of expenses"}
"""


# ---------------------------------------------------------------------------
# Agent Instance
# ---------------------------------------------------------------------------

_savings_advisor_instance = None

def get_savings_advisor_agent() -> SavingsAdvisorAgent:
    """Get singleton instance of SavingsAdvisorAgent."""
    global _savings_advisor_instance
    if _savings_advisor_instance is None:
        _savings_advisor_instance = SavingsAdvisorAgent()
    return _savings_advisor_instance


# ---------------------------------------------------------------------------
# Public Run Function (Backward Compatible)
# ---------------------------------------------------------------------------

async def run_savings_advisor(
    query: str,
    user_id: str,
    goal_id: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
    db_pool: Optional[Any] = None,
    ml_service: Optional[Any] = None,
) -> SavingsAdviceResponse:
    """
    Run the Savings Advisor agent.
    
    BACKWARD COMPATIBLE: This function maintains the same signature as before
    but now uses the refactored BaseAgent implementation internally.
    
    Args:
        query: User's savings question
        user_id: User ID
        goal_id: Optional specific goal to focus on
        context: Additional context
        db_pool: Database connection pool
        ml_service: ML service for advanced recommendations
    
    Returns:
        SavingsAdviceResponse with goals and recommendations
    """
    agent = get_savings_advisor_agent()
    
    deps = SavingsAdvisorDeps(
        user_id=user_id,
        db_pool=db_pool,
        ml_service=ml_service,
    )
    
    full_context = context.copy() if context else {}
    if goal_id:
        full_context["goal_id"] = goal_id
    
    return await agent.run(query, deps, full_context)
