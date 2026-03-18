"""
Group Manager agent: Pydantic AI agent and run_group_manager.

Location: backend_python/smartpay_ai/agents/group_manager/agent.py
Purpose: Help users create and manage groups for shared expenses.

REFACTORED: Now uses BaseAgent to eliminate boilerplate duplication.
"""

import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional

from pydantic_ai import Agent, RunContext

from smartpay_ai.agents.base_agent import BaseAgent, BaseAgentDeps
from smartpay_ai.providers import get_llm_model

from .models import GroupManagementResponse, GroupInfo, GroupMember, GroupAction
from .prompts import GROUP_MANAGER_SYSTEM_PROMPT
from . import tools

logger = logging.getLogger(__name__)


@dataclass
class GroupManagerDeps(BaseAgentDeps):
    """Dependencies injected into the Group Manager agent."""
    pass


# ---------------------------------------------------------------------------
# Group Manager Agent Implementation
# ---------------------------------------------------------------------------

class GroupManagerAgent(BaseAgent[GroupManagerDeps, GroupManagementResponse]):
    """
    Group Manager agent using BaseAgent for DRY compliance.
    
    Eliminates ~66 lines of boilerplate by inheriting common patterns
    from BaseAgent.
    """
    
    def __init__(self):
        super().__init__(
            agent_name="group_manager",
            deps_type=GroupManagerDeps,
            output_type=GroupManagementResponse,
            system_prompt=GROUP_MANAGER_SYSTEM_PROMPT,
        )
    
    def _register_tools(self, agent: Agent) -> None:
        """Register group management tools."""
        agent.tool(self._get_group_info)
        agent.tool(self._get_group_members)
        agent.tool(self._get_group_transactions)
        agent.tool(self._get_pending_splits)
        agent.tool(self._suggest_split_method)
        agent.tool(self._calculate_settlement)
    
    def get_default_response(self, error_message: str) -> GroupManagementResponse:
        """Return a safe default group management response."""
        return GroupManagementResponse(
            summary=error_message,
        )
    
    # -----------------------------------------------------------------------
    # Tool Implementations
    # -----------------------------------------------------------------------
    
    async def _get_group_info(
        self,
        ctx: RunContext[GroupManagerDeps],
        group_id: str,
    ) -> str:
        """Retrieve detailed information about a group."""
        info = await tools.get_group_info(
            group_id=group_id,
            db_pool=ctx.deps.db_pool,
        )
        
        if not info:
            return f"Group {group_id} not found"
        
        return f"""Group: {info.get('name')}
Type: {info.get('group_type')}
Members: {info.get('member_count')}
Wallet Balance: N${info.get('wallet_balance', 0):.2f}
Total Contributions: N${info.get('total_contributions', 0):.2f}
Total Expenses: N${info.get('total_expenses', 0):.2f}
Description: {info.get('description', 'No description')}
Created: {info.get('created_at', 'Unknown')}
"""
    
    async def _get_group_members(
        self,
        ctx: RunContext[GroupManagerDeps],
        group_id: str,
    ) -> str:
        """List all members of a group with their roles and contributions."""
        members = await tools.get_group_members(
            group_id=group_id,
            db_pool=ctx.deps.db_pool,
        )
        
        if not members:
            return f"No members found for group {group_id}"
        
        summary = [f"Group has {len(members)} members:"]
        for i, member in enumerate(members, 1):
            name = member.get("name", "Unknown")
            role = member.get("role", "member")
            contribution = float(member.get("contribution", 0))
            status = member.get("status", "active")
            
            role_icon = "👑" if role == "admin" else "👤"
            status_icon = "✓" if status == "active" else "⏸" if status == "invited" else "✗"
            
            summary.append(
                f"{i}. {role_icon} {name} ({role}) - N${contribution:.2f} contributed {status_icon}"
            )
        
        return "\n".join(summary)
    
    async def _get_group_transactions(
        self,
        ctx: RunContext[GroupManagerDeps],
        group_id: str,
        limit: int = 10,
    ) -> str:
        """Retrieve recent group transaction history."""
        transactions = await tools.get_group_transactions(
            group_id=group_id,
            limit=limit,
            db_pool=ctx.deps.db_pool,
        )
        
        if not transactions:
            return f"No transactions found for group {group_id}"
        
        summary = [f"Recent {len(transactions)} transactions:"]
        for i, txn in enumerate(transactions, 1):
            amount = float(txn.get("amount", 0))
            txn_type = txn.get("type", "")
            user_name = txn.get("user_name", "Unknown")
            description = txn.get("description", "")
            created = str(txn.get("created_at", ""))[:10]
            
            type_icon = "+" if txn_type == "credit" else "-"
            summary.append(
                f"{i}. {type_icon}N${abs(amount):.2f} by {user_name} - {description} ({created})"
            )
        
        return "\n".join(summary)
    
    async def _get_pending_splits(
        self,
        ctx: RunContext[GroupManagerDeps],
        group_id: str,
    ) -> str:
        """Retrieve pending split bill payments."""
        splits = await tools.get_pending_splits(
            group_id=group_id,
            db_pool=ctx.deps.db_pool,
        )
        
        if not splits:
            return f"No pending split bills for group {group_id}"
        
        summary = [f"Pending split bills:"]
        for i, split in enumerate(splits, 1):
            bill_name = split.get("bill_name", "Unnamed")
            total = float(split.get("total_amount", 0))
            status = split.get("status", "pending")
            participants = split.get("participants", [])
            
            paid_count = sum(1 for p in participants if p.get("paid"))
            total_count = len(participants)
            
            summary.append(
                f"{i}. {bill_name} - N${total:.2f} ({paid_count}/{total_count} paid) - {status}"
            )
            
            unpaid = [p.get("user_name") for p in participants if not p.get("paid")]
            if unpaid:
                summary.append(f"   Waiting for: {', '.join(unpaid)}")
        
        return "\n".join(summary)
    
    async def _suggest_split_method(
        self,
        ctx: RunContext[GroupManagerDeps],
        group_id: str,
        total_amount: float,
    ) -> str:
        """Suggest the best way to split a bill among group members."""
        members = await tools.get_group_members(
            group_id=group_id,
            db_pool=ctx.deps.db_pool,
        )
        
        suggestion = await tools.suggest_split_method(
            total_amount=total_amount,
            members=members,
        )
        
        if suggestion.get("method") == "none":
            return suggestion.get("error", "Cannot suggest split method")
        
        method = suggestion.get("method", "equal")
        member_count = suggestion.get("member_count", 0)
        per_person = suggestion.get("per_person", 0)
        recommendation = suggestion.get("recommendation", "")
        
        return f"""Split Method Suggestion:
Method: {method}
Total Amount: N${total_amount:.2f}
Members: {member_count}
Per Person: N${per_person:.2f}

{recommendation}
"""
    
    async def _calculate_settlement(
        self,
        ctx: RunContext[GroupManagerDeps],
        group_id: str,
    ) -> str:
        """Calculate settlement amount if current user leaves the group."""
        settlement = await tools.calculate_settlement(
            user_id=ctx.deps.user_id,
            group_id=group_id,
            db_pool=ctx.deps.db_pool,
        )
        
        contributed = settlement.get("total_contributed", 0)
        fair_share = settlement.get("fair_share", 0)
        amount = settlement.get("settlement", 0)
        direction = settlement.get("direction", "none")
        message = settlement.get("message", "")
        
        return f"""Settlement Calculation:
You Contributed: N${contributed:.2f}
Your Fair Share of Expenses: N${fair_share:.2f}
Settlement Amount: N${amount:.2f}
Status: {message}

{direction.upper()}: {"No action needed" if direction == "settled" else message}
"""


# ---------------------------------------------------------------------------
# Agent Instance
# ---------------------------------------------------------------------------

_group_manager_instance = None

def get_group_manager_agent() -> GroupManagerAgent:
    """Get singleton instance of GroupManagerAgent."""
    global _group_manager_instance
    if _group_manager_instance is None:
        _group_manager_instance = GroupManagerAgent()
    return _group_manager_instance


# ---------------------------------------------------------------------------
# Public Run Function (Backward Compatible)
# ---------------------------------------------------------------------------

async def run_group_manager(
    query: str,
    user_id: str,
    group_id: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
    db_pool: Optional[Any] = None,
) -> GroupManagementResponse:
    """
    Run the Group Manager agent.
    
    BACKWARD COMPATIBLE: This function maintains the same signature as before
    but now uses the refactored BaseAgent implementation internally.
    
    Args:
        query: User's group management question
        user_id: User ID
        group_id: Optional specific group ID
        context: Additional context
        db_pool: Database connection pool
    
    Returns:
        GroupManagementResponse with group info and recommendations
    """
    agent = get_group_manager_agent()
    
    deps = GroupManagerDeps(
        user_id=user_id,
        db_pool=db_pool,
    )
    
    full_context = context.copy() if context else {}
    if group_id:
        full_context["group_id"] = group_id
    
    return await agent.run(query, deps, full_context)
