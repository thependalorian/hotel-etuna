"""
FastAPI router for the Smartpay AI Copilot chat (HITL).

Location: backend_python/smartpay_ai/api/copilot_endpoint.py
Purpose: POST /chat with thread_id and optional resume; uses graph on app.state.
        Resolves user profile from Node API (Authorization) for Copilot context (DRY).
        Enhanced with security middleware integration (2FA, fraud detection, audit logging).
"""

from typing import Any, List

import logging
from fastapi import APIRouter, Depends, Request, HTTPException
from langgraph.types import Command
import psycopg

from smartpay_ai.agents.copilot.agent import CopilotDeps
from smartpay_ai.agents.copilot.models import ChatRequest, ChatResponse
from smartpay_ai.graph.workflow import get_compiled_graph
from smartpay_ai.user_profile import fetch_user_profile
from smartpay_ai.config.logging import get_audit_logger

router = APIRouter(prefix="/api/smartpay-copilot", tags=["copilot"])
_log = logging.getLogger(__name__)
_audit_logger = get_audit_logger()


def _is_connection_error(exc: BaseException) -> bool:
    """True if the error is a transient Postgres connection/SSL failure (e.g. Neon idle close)."""
    def check(e: BaseException | None) -> bool:
        if e is None:
            return False
        if isinstance(e, psycopg.OperationalError):
            msg = (e.args[0] if e.args else "").lower()
            return "ssl" in msg or "connection" in msg or "closed" in msg or "terminated" in msg
        return check(getattr(e, "__cause__", None))
    return check(exc)


def _messages_to_dicts(messages: List[Any]) -> List[dict[str, Any]]:
    """Convert LangGraph/LangChain message objects to plain dicts for JSON response."""
    out = []
    for m in messages or []:
        if isinstance(m, dict):
            out.append(m)
            continue
        role = getattr(m, "type", None) or type(m).__name__
        if "human" in role.lower() or "user" in role.lower():
            role = "user"
        elif "ai" in role.lower() or "assistant" in role.lower():
            role = "assistant"
        else:
            role = "assistant"
        content = getattr(m, "content", str(m))
        if isinstance(content, list):
            content = " ".join(
                getattr(part, "text", str(part)) for part in content if hasattr(part, "text")
            ) or str(content)
        out.append({"role": role, "content": content})
    return out


async def get_deps(request: Request) -> CopilotDeps:
    """Build CopilotDeps: resolve user from Authorization and fetch profile from Node API (DRY)."""
    auth_header = request.headers.get("Authorization") or ""
    token = auth_header.strip()
    if token.startswith("Bearer "):
        token = token[7:].strip()
    user_profile = await fetch_user_profile(auth_header) if auth_header else None
    user_id = (user_profile.get("id") if user_profile else None) or "user-123"
    if not user_profile and auth_header:
        _log.info(
            "Copilot: no user profile (set SMARTPAY_API_BASE_URL in backend_python/.env and ensure Node API is running)"
        )
    return CopilotDeps(
        user_id=str(user_id),
        auth_token=auth_header,
        user_profile=user_profile,
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request, deps: CopilotDeps = Depends(get_deps)) -> ChatResponse:
    """
    Send a message or resume after human approval. Requires graph on request.app.state.
    
    Security features:
    - 2FA verification for payment operations (via middleware)
    - Fraud detection for financial transactions (via middleware)
    - Audit logging for all copilot interactions
    """
    graph = getattr(request.app.state, "graph", None)
    if graph is None:
        raise HTTPException(
            status_code=503,
            detail="Copilot graph not ready. Ensure lifespan started with DATABASE_URL.",
        )
    
    # Get security context from middleware
    user = getattr(request.state, "user", None)
    twofa_verified = getattr(request.state, "twofa_verified", False)
    fraud_check = getattr(request.state, "fraud_check", None)
    
    # Log copilot interaction
    if user:
        ip_address = request.client.host if request.client else "unknown"
        await _audit_logger.log_event(
            event_type="COPILOT_CHAT_REQUEST",
            user_id=user.get("user_id"),
            event_data={
                "thread_id": req.thread_id,
                "message_preview": req.message[:100] if req.message else "resume",
                "twofa_verified": twofa_verified,
                "fraud_risk_score": fraud_check.get("riskScore") if fraud_check else None
            },
            ip_address=ip_address,
            user_agent=request.headers.get("user-agent")
        )
    
    config: dict[str, Any] = {"configurable": {"thread_id": req.thread_id}}

    async def _invoke():
        if req.resume is not None:
            result = await graph.ainvoke(Command(resume=req.resume), config=config, context=deps)
        else:
            if not req.message:
                raise HTTPException(status_code=400, detail="message required when resume is not set")
            result = await graph.ainvoke(
                {"messages": [{"role": "user", "content": req.message}]},
                config=config,
                context=deps,
            )
        
        # Log copilot response
        if user and result:
            await _audit_logger.log_event(
                event_type="COPILOT_CHAT_RESPONSE",
                user_id=user.get("user_id"),
                event_data={
                    "thread_id": req.thread_id,
                    "status": "interrupt" if "__interrupt__" in result else "ok",
                    "message_count": len(result.get("messages", []))
                },
                ip_address=ip_address,
                user_agent=request.headers.get("user-agent")
            )
        
        return result

    try:
        result = await _invoke()
    except Exception as e:
        if _is_connection_error(e):
            _log.warning("Copilot checkpointer connection error (retrying once): %s", e)
            result = await _invoke()
        else:
            # Log error
            if user:
                ip_address = request.client.host if request.client else "unknown"
                await _audit_logger.log_event(
                    event_type="COPILOT_CHAT_ERROR",
                    user_id=user.get("user_id"),
                    event_data={
                        "thread_id": req.thread_id,
                        "error": str(e)
                    },
                    ip_address=ip_address,
                    severity="ERROR"
                )
            raise

    if "__interrupt__" in result:
        return ChatResponse(
            status="interrupt",
            approval_payload=result["__interrupt__"],
            thread_id=req.thread_id,
        )
    return ChatResponse(
        status="ok",
        messages=_messages_to_dicts(result.get("messages", [])),
        last_tool_result=result.get("last_tool_result"),
        thread_id=req.thread_id,
    )
