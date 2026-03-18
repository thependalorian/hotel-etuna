"""
Bill Assistant agent: Pydantic AI agent and run_bill_assistant.

Location: backend_python/smartpay_ai/agents/bill_assistant/agent.py
Purpose: Help users manage bills and avoid late fees.

REFACTORED: Now uses BaseAgent to eliminate boilerplate duplication.
"""

import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional

from pydantic_ai import Agent, RunContext

from smartpay_ai.agents.base_agent import BaseAgent, BaseAgentDeps
from smartpay_ai.providers import get_llm_model

from .models import BillAssistanceResponse, BillReminder, SplitBill, PaymentRecommendation
from .prompts import BILL_ASSISTANT_SYSTEM_PROMPT
from . import tools

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------

@dataclass
class BillAssistantDeps(BaseAgentDeps):
    """Dependencies injected into the Bill Assistant agent."""
    pass  # All common fields inherited from BaseAgentDeps


# ---------------------------------------------------------------------------
# Bill Assistant Agent Implementation
# ---------------------------------------------------------------------------

class BillAssistantAgent(BaseAgent[BillAssistantDeps, BillAssistanceResponse]):
    """
    Bill Assistant agent using BaseAgent for DRY compliance.
    
    Eliminates ~100 lines of boilerplate by inheriting common patterns
    from BaseAgent.
    """
    
    def __init__(self):
        super().__init__(
            agent_name="bill_assistant",
            deps_type=BillAssistantDeps,
            output_type=BillAssistanceResponse,
            system_prompt=BILL_ASSISTANT_SYSTEM_PROMPT,
        )
    
    def _register_tools(self, agent: Agent) -> None:
        """Register bill management tools."""
        agent.tool(self._get_upcoming_bills)
        agent.tool(self._get_overdue_bills)
        agent.tool(self._get_split_bills)
        agent.tool(self._identify_recurring_bills)
        agent.tool(self._suggest_payment_schedule)
    
    def get_default_response(self, error_message: str) -> BillAssistanceResponse:
        """Return a safe default bill assistance response."""
        return BillAssistanceResponse(
            summary=error_message,
            total_due=0.0,
        )
    
    # -----------------------------------------------------------------------
    # Tool Implementations
    # -----------------------------------------------------------------------
    
    async def _get_upcoming_bills(
        self,
        ctx: RunContext[BillAssistantDeps],
        days_ahead: int = 30,
    ) -> str:
        """Retrieve bills due in the next N days."""
        bills = await tools.get_upcoming_bills(
            user_id=ctx.deps.user_id,
            days_ahead=days_ahead,
            db_pool=ctx.deps.db_pool,
        )
        
        if not bills:
            return f"No bills due in the next {days_ahead} days. You're all clear!"
        
        total = await tools.calculate_total_due(bills)
        
        summary = [f"You have {len(bills)} upcoming bills (total: N${total:.2f}):"]
        for i, bill in enumerate(bills[:10], 1):  # Show top 10
            name = bill.get("name", "Unnamed Bill")
            amount = float(bill.get("amount", 0))
            due_date = bill.get("due_date", "")
            days_left = await tools.calculate_days_until_due(due_date)
            priority = bill.get("priority", "medium")
            
            priority_icon = "🔴" if priority == "high" else "🟡" if priority == "medium" else "🟢"
            summary.append(
                f"{i}. {priority_icon} {name}: N${amount:.2f} due in {days_left} days ({due_date})"
            )
        
        return "\n".join(summary)
    
    async def _get_overdue_bills(self, ctx: RunContext[BillAssistantDeps]) -> str:
        """Retrieve overdue bills that need immediate attention."""
        bills = await tools.get_overdue_bills(
            user_id=ctx.deps.user_id,
            db_pool=ctx.deps.db_pool,
        )
        
        if not bills:
            return "No overdue bills. Great job staying on top of payments!"
        
        total = await tools.calculate_total_due(bills)
        
        summary = [f"🚨 You have {len(bills)} overdue bills (total: N${total:.2f}):"]
        for i, bill in enumerate(bills, 1):
            name = bill.get("name", "Unnamed Bill")
            amount = float(bill.get("amount", 0))
            due_date = bill.get("due_date", "")
            days_overdue = abs(await tools.calculate_days_until_due(due_date))
            
            summary.append(
                f"{i}. {name}: N${amount:.2f} ({days_overdue} days overdue since {due_date})"
            )
        
        summary.append("\n⚠ Pay these immediately to avoid late fees and service disruption!")
        
        return "\n".join(summary)
    
    async def _get_split_bills(
        self,
        ctx: RunContext[BillAssistantDeps],
        group_id: Optional[str] = None,
    ) -> str:
        """Retrieve split bills and payment status."""
        split_bills = await tools.get_split_bills(
            user_id=ctx.deps.user_id,
            group_id=group_id,
            db_pool=ctx.deps.db_pool,
        )
        
        if not split_bills:
            return "No active split bills. Create one to share costs with friends!"
        
        summary_data = await tools.get_split_bill_summary(split_bills, ctx.deps.user_id)
        
        summary = [
            f"You have {summary_data['active_splits']} active split bills:",
            f"• You owe: N${summary_data['you_owe']:.2f}",
            f"• Owed to you: N${summary_data['owed_to_you']:.2f}",
            f"• Net balance: N${summary_data['net_balance']:+.2f}",
            "\nDetails:"
        ]
        
        for i, split in enumerate(split_bills[:5], 1):  # Show top 5
            bill_name = split.get("bill_name", "Unnamed Split")
            total = float(split.get("total_amount", 0))
            status = split.get("status", "pending")
            group_name = split.get("group_name", "No Group")
            
            summary.append(
                f"{i}. {bill_name} - N${total:.2f} ({status}) - Group: {group_name}"
            )
        
        return "\n".join(summary)
    
    async def _identify_recurring_bills(self, ctx: RunContext[BillAssistantDeps]) -> str:
        """Find recurring bills that could be automated."""
        recurring = await tools.identify_recurring_bills(
            user_id=ctx.deps.user_id,
            db_pool=ctx.deps.db_pool,
        )
        
        if not recurring:
            return "No recurring bill patterns detected yet. Bills will be analyzed over time."
        
        summary = [f"Found {len(recurring)} recurring bills:"]
        for i, bill in enumerate(recurring, 1):
            name = bill.get("name", "Unnamed")
            avg_amount = bill.get("avg_amount", 0)
            frequency = bill.get("frequency", "monthly")
            
            summary.append(
                f"{i}. {name}: ~N${avg_amount:.2f} ({frequency}) - Consider setting up auto-pay"
            )
        
        return "\n".join(summary)
    
    async def _suggest_payment_schedule(
        self,
        ctx: RunContext[BillAssistantDeps],
        monthly_income: float,
        payday: int = 25,
    ) -> str:
        """Suggest optimal payment schedule based on cash flow."""
        bills = await tools.get_upcoming_bills(
            user_id=ctx.deps.user_id,
            days_ahead=30,
            db_pool=ctx.deps.db_pool,
        )
        
        schedule_data = await tools.suggest_payment_schedule(bills, monthly_income, payday)
        
        if not schedule_data.get("schedule"):
            return schedule_data.get("message", "No bills to schedule")
        
        summary = [
            f"Recommended Payment Schedule (Payday: {payday}th):",
            f"Total Due: N${schedule_data['total_due']:.2f}",
            f"Monthly Income: N${monthly_income:.2f}",
            f"Status: {'✓ Affordable' if schedule_data['affordable'] else '⚠ High Bill Load'}",
            "\nSchedule:"
        ]
        
        for phase in schedule_data["schedule"]:
            date_range = phase["date_range"]
            total = phase["total"]
            reason = phase["reason"]
            bills_list = ", ".join(phase["bills"][:3])
            if len(phase["bills"]) > 3:
                bills_list += f" (+{len(phase["bills"]) - 3} more)"
            
            summary.append(f"\n{date_range}: N${total:.2f}")
            summary.append(f"  Bills: {bills_list}")
            summary.append(f"  Why: {reason}")
        
        return "\n".join(summary)


# ---------------------------------------------------------------------------
# Agent Instance
# ---------------------------------------------------------------------------

_bill_assistant_instance = None

def get_bill_assistant_agent() -> BillAssistantAgent:
    """Get singleton instance of BillAssistantAgent."""
    global _bill_assistant_instance
    if _bill_assistant_instance is None:
        _bill_assistant_instance = BillAssistantAgent()
    return _bill_assistant_instance


# ---------------------------------------------------------------------------
# Public Run Function (Backward Compatible)
# ---------------------------------------------------------------------------

async def run_bill_assistant(
    query: str,
    user_id: str,
    bill_id: Optional[str] = None,
    group_id: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
    db_pool: Optional[Any] = None,
) -> BillAssistanceResponse:
    """
    Run the Bill Assistant agent.
    
    BACKWARD COMPATIBLE: This function maintains the same signature as before
    but now uses the refactored BaseAgent implementation internally.
    
    Args:
        query: User's bill management question
        user_id: User ID
        bill_id: Optional specific bill ID
        group_id: Optional group ID for split bills
        context: Additional context
        db_pool: Database connection pool
    
    Returns:
        BillAssistanceResponse with bill reminders and recommendations
    """
    agent = get_bill_assistant_agent()
    
    # Build dependencies
    deps = BillAssistantDeps(
        user_id=user_id,
        db_pool=db_pool,
    )
    
    # Build context with bill_id and group_id if provided
    full_context = context.copy() if context else {}
    if bill_id:
        full_context["bill_id"] = bill_id
    if group_id:
        full_context["group_id"] = group_id
    
    # Run agent with BaseAgent's standardized error handling
    return await agent.run(query, deps, full_context)
