"""
LangGraph state for the Smartpay AI Copilot workflow (HITL).

Location: backend_python/smartpay_ai/graph/state.py
Purpose: Single state shape; PendingAction imported from copilot models (DRY).
"""

from typing import Annotated, TypedDict

from langgraph.graph.message import add_messages

from smartpay_ai.agents.copilot.models import PendingAction


class SmartpayAgentState(TypedDict):
    """State for the Smartpay Copilot graph."""

    messages: Annotated[list, add_messages]
    pending_action: PendingAction | None
    approval_granted: bool | None
    last_tool_result: str | None
    error_message: str | None
