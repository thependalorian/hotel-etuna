"""
LangGraph workflow: build_smartpay_graph and get_compiled_graph (with Postgres checkpointer).

Location: backend_python/smartpay_ai/graph/workflow.py
Purpose: Single place for graph construction and checkpointer lifecycle (DRY).
"""

from contextlib import asynccontextmanager
from typing import Literal

from langgraph.graph import START, END, StateGraph
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from smartpay_ai.graph.state import SmartpayAgentState
from smartpay_ai.agents.copilot.agent import CopilotDeps
from smartpay_ai.graph.nodes import (
    copilot_node,
    guardian_check_node,
    human_approval_node,
    execute_tool_node,
)


def route_after_copilot(state: SmartpayAgentState) -> Literal["guardian_check", "end"]:
    """Route to guardian_check when there is a pending action, else end."""
    if state.get("pending_action"):
        return "guardian_check"
    return "end"


def route_after_guardian(state: SmartpayAgentState) -> Literal["human_approval", "copilot"]:
    """Route to human_approval when no error, else back to copilot with error."""
    if state.get("error_message"):
        return "copilot"
    return "human_approval"


def _add_nodes_and_edges(builder: StateGraph):
    """Add all nodes and edges to the builder (DRY)."""
    builder.add_node("copilot", copilot_node)
    builder.add_node("guardian_check", guardian_check_node)
    builder.add_node("human_approval", human_approval_node)
    builder.add_node("execute_tool", execute_tool_node)
    builder.add_edge(START, "copilot")
    builder.add_conditional_edges(
        "copilot",
        route_after_copilot,
        {"guardian_check": "guardian_check", "end": END},
    )
    builder.add_conditional_edges(
        "guardian_check",
        route_after_guardian,
        {"human_approval": "human_approval", "copilot": "copilot"},
    )
    builder.add_edge("human_approval", "execute_tool")
    builder.add_edge("execute_tool", "copilot")


def build_smartpay_graph():
    """Build and compile the Smartpay Copilot graph without checkpointer (e.g. tests)."""
    builder = StateGraph(SmartpayAgentState, context_schema=CopilotDeps)
    _add_nodes_and_edges(builder)
    return builder.compile()


@asynccontextmanager
async def get_compiled_graph(postgres_uri: str):
    """
    Async context manager: yield a compiled graph with Postgres checkpointer.
    Keep the context open for the app lifetime (e.g. FastAPI lifespan).
    """
    builder = StateGraph(SmartpayAgentState, context_schema=CopilotDeps)
    _add_nodes_and_edges(builder)
    async with AsyncPostgresSaver.from_conn_string(postgres_uri) as checkpointer:
        await checkpointer.setup()
        graph = builder.compile(checkpointer=checkpointer)
        yield graph
