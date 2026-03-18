"""
Smartpay AI Copilot (orchestrator) agent: Pydantic AI agent and run_copilot.

Location: backend_python/smartpay_ai/agents/copilot/agent.py
Purpose: Single agent definition; tools delegate to agents/copilot/tools.py (DRY).

REFACTORED: Now uses BaseAgent to eliminate boilerplate duplication.
"""

from dataclasses import dataclass
from typing import Any, Dict, Optional

from pydantic_ai import Agent, RunContext

from smartpay_ai.agents.base_agent import BaseAgent, BaseAgentDeps
from smartpay_ai.providers import get_llm_model
from smartpay_ai.user_profile import format_user_info_response

from .models import CopilotResponse, PendingAction
from .prompts import COPILOT_SYSTEM_PROMPT
from . import tools as copilot_tools


@dataclass
class CopilotDeps(BaseAgentDeps):
    """Dependencies injected into the Copilot agent and graph nodes."""
    auth_token: str = ""
    user_profile: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Copilot Agent Implementation
# ---------------------------------------------------------------------------

class CopilotAgent(BaseAgent[CopilotDeps, CopilotResponse]):
    """
    Copilot agent using BaseAgent for DRY compliance.
    
    Eliminates ~70 lines of boilerplate by inheriting common patterns
    from BaseAgent.
    """
    
    def __init__(self):
        super().__init__(
            agent_name="copilot",
            deps_type=CopilotDeps,
            output_type=CopilotResponse,
            system_prompt=COPILOT_SYSTEM_PROMPT,
        )
    
    def _register_tools(self, agent: Agent) -> None:
        """Register copilot orchestration tools."""
        agent.tool(self._route_to_security_guardian)
        agent.tool(self._route_to_transaction_analyst)
        agent.tool(self._route_to_savings_advisor)
        agent.tool(self._route_to_bill_assistant)
        agent.tool(self._route_to_group_manager)
        agent.tool(self._search_knowledge_base)
        agent.tool(self._get_user_info)
    
    def get_default_response(self, error_message: str) -> CopilotResponse:
        """Return a safe default copilot response."""
        return CopilotResponse(
            message=error_message,
            pending_action=None,
        )
    
    # -----------------------------------------------------------------------
    # Tool Implementations
    # -----------------------------------------------------------------------
    
    async def _route_to_security_guardian(
        self,
        ctx: RunContext[CopilotDeps],
        query: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Route a read-only fraud/risk query to the Security Guardian agent."""
        result = await copilot_tools.route_to_security_guardian(query, context)
        return str(result.get("response", result))
    
    async def _route_to_transaction_analyst(
        self,
        ctx: RunContext[CopilotDeps],
        query: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Route spending/transaction analysis to the Transaction Analyst agent."""
        result = await copilot_tools.route_to_transaction_analyst(query, context)
        return str(result.get("response", result))
    
    async def _route_to_savings_advisor(
        self,
        ctx: RunContext[CopilotDeps],
        query: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Route savings goals and recommendations to the Savings Advisor agent."""
        result = await copilot_tools.route_to_savings_advisor(query, context)
        return str(result.get("response", result))
    
    async def _route_to_bill_assistant(
        self,
        ctx: RunContext[CopilotDeps],
        query: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Route bill reminders and split bill queries to the Bill Assistant agent."""
        result = await copilot_tools.route_to_bill_assistant(query, context)
        return str(result.get("response", result))
    
    async def _route_to_group_manager(
        self,
        ctx: RunContext[CopilotDeps],
        query: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Route group creation and management queries to the Group Manager agent."""
        result = await copilot_tools.route_to_group_manager(query, context)
        return str(result.get("response", result))
    
    async def _search_knowledge_base(
        self,
        ctx: RunContext[CopilotDeps],
        query: str
    ) -> str:
        """Search the curated Smartpay knowledge base (consumer protection, regulation, financial literacy). User-isolated."""
        return await copilot_tools.search_knowledge_base(query, user_id=ctx.deps.user_id, limit=5)
    
    def _get_user_info(self, ctx: RunContext[CopilotDeps]) -> str:
        """Return the current user's profile info (name, phone, SmartpayID, KYC status) for questions like 'What is my name?'."""
        return format_user_info_response(ctx.deps.user_profile if ctx.deps else None)


# ---------------------------------------------------------------------------
# Agent Instance
# ---------------------------------------------------------------------------

_copilot_instance = None

def get_copilot_agent() -> CopilotAgent:
    """Get singleton instance of CopilotAgent."""
    global _copilot_instance
    if _copilot_instance is None:
        _copilot_instance = CopilotAgent()
    return _copilot_instance


# ---------------------------------------------------------------------------
# Public Run Function (Backward Compatible)
# ---------------------------------------------------------------------------

async def run_copilot(user_message: str, deps: CopilotDeps) -> CopilotResponse:
    """
    Run the Copilot agent; used by LangGraph copilot_node.
    
    BACKWARD COMPATIBLE: This function maintains the same signature as before
    but now uses the refactored BaseAgent implementation internally.
    
    Args:
        user_message: User's message to the copilot
        deps: CopilotDeps with user_id, auth_token, and user_profile
    
    Returns:
        CopilotResponse with message and optional pending action
    """
    agent = get_copilot_agent()
    return await agent.run(user_message, deps)
