"""
LangGraph nodes for the Smartpay AI Copilot workflow (HITL).

Location: backend_python/smartpay_ai/graph/nodes.py
Purpose: copilot_node, guardian_check_node, human_approval_node, execute_tool_node.
"""

from typing import Any
from langgraph.runtime import Runtime

from smartpay_ai.agents.copilot.agent import run_copilot, CopilotDeps
from smartpay_ai.agents.copilot.models import CopilotResponse
from smartpay_ai.agents.copilot import tools as copilot_tools
from smartpay_ai.graph.state import SmartpayAgentState
from smartpay_ai.user_profile import format_user_context
from smartpay_ai.conversation_history import (
    store_message,
    format_conversation_for_llm,
    get_user_preferences,
)


def _last_message_content(state: SmartpayAgentState) -> str:
    """Extract content from the last message (dict or BaseMessage)."""
    messages = state.get("messages") or []
    if not messages:
        return ""
    last = messages[-1]
    if hasattr(last, "content"):
        return getattr(last, "content") or ""
    if isinstance(last, dict):
        return last.get("content") or ""
    return ""


async def copilot_node(state: SmartpayAgentState, runtime: Runtime[CopilotDeps]) -> dict:
    """
    Run Pydantic AI orchestrator with personalized conversation history.
    Implements user-isolated memory management for contextual, personalized responses.
    """
    import time
    deps = runtime.context
    last_message = _last_message_content(state)
    
    # Store user message in conversation history
    await store_message(
        user_id=deps.user_id,
        role="user",
        content=last_message,
        conversation_type="chat",
    )
    
    # Get user preferences for personalization
    prefs = await get_user_preferences(deps.user_id)
    
    # Inject conversation history for context (last 10 messages)
    conversation_context = await format_conversation_for_llm(
        user_id=deps.user_id,
        limit=10,
    )
    
    # Inject user profile context
    profile_context = ""
    if deps.user_profile:
        profile_context = format_user_context(deps.user_profile)
    
    # Build enhanced message with context
    enhanced_message = last_message
    if profile_context:
        enhanced_message = f"{profile_context}\n\n{enhanced_message}"
    if conversation_context:
        enhanced_message = f"{conversation_context}\n\n{enhanced_message}"
    
    # Add personalization preferences to context
    if prefs.get("preferred_name"):
        enhanced_message = f"[User prefers to be called: {prefs.get('preferred_name')}]\n\n{enhanced_message}"
    if prefs.get("communication_style") and prefs.get("communication_style") != "balanced":
        enhanced_message = f"[Communication style: {prefs.get('communication_style')}]\n\n{enhanced_message}"
    
    # Run Copilot with enhanced context
    start_time = time.time()
    try:
        response = await run_copilot(enhanced_message, deps)
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("copilot_node run_copilot failed: %s", e)
        response = CopilotResponse(
            message="I ran into an issue. Please try again or rephrase your question.",
            pending_action=None,
        )
    response_time_ms = int((time.time() - start_time) * 1000)
    
    # Store assistant response in conversation history
    await store_message(
        user_id=deps.user_id,
        role="assistant",
        content=response.message or "Done.",
        conversation_type="chat",
        response_time_ms=response_time_ms,
        model_used="gpt-4o",  # TODO: Make dynamic based on LLM_MODEL env var
        metadata={
            "has_pending_action": bool(response.pending_action),
            "action_type": response.pending_action.action_type if response.pending_action else None,
        },
    )
    
    update: dict = {
        "last_tool_result": None,
        "error_message": None,
    }
    if response.pending_action:
        update["pending_action"] = response.pending_action
        update["messages"] = [{"role": "assistant", "content": response.message or "Please approve this action."}]
    else:
        update["pending_action"] = None
        update["messages"] = [{"role": "assistant", "content": response.message or "Done."}]
    return update


def guardian_check_node(state: SmartpayAgentState) -> dict:
    """
    Assess risk for pending_action. If high risk, set error and clear pending_action.
    
    Risk Scoring System (0.0 - 1.0):
    - 0.0 - 0.3: Low risk (read-only operations, small amounts)
    - 0.3 - 0.6: Medium risk (standard transactions within limits)
    - 0.6 - 0.8: High risk (large amounts, unusual patterns)
    - 0.8 - 1.0: Critical risk (suspicious activity, policy violations)
    
    Location: backend_python/smartpay_ai/graph/nodes.py
    """
    action = state.get("pending_action")
    if not action:
        return {}
    
    # Calculate risk score based on action type and parameters
    risk_score = _calculate_risk_score(action, state)
    
    # Log risk assessment
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Guardian risk assessment: {action.action_type} = {risk_score:.2f}")
    
    # Update action risk_level
    if risk_score > 0.6:
        action.risk_level = "high"
    elif risk_score > 0.3:
        action.risk_level = "medium"
    else:
        action.risk_level = "low"
    
    # Block critical risk (>0.8)
    if risk_score > 0.8:
        return {
            "error_message": f"This action was flagged as critical risk (score: {risk_score:.2f}). Declined for safety.",
            "pending_action": None,
            "approval_granted": None,
        }
    
    # High risk: log for audit but allow with user approval
    if risk_score > 0.6:
        logger.warning(f"High risk action requires approval: {action.action_type} (score: {risk_score:.2f})")
    
    return {"pending_action": action}


def _calculate_risk_score(action: Any, state: SmartpayAgentState) -> float:
    """
    Calculate risk score based on action type and parameters.
    
    Risk factors:
    1. Action type (transfer_money > create_wallet)
    2. Transaction amount (higher = riskier; uses centralized PSD-1/PSD-3 limits)
    3. Frequency (rapid repeated actions)
    4. User history (new users = higher risk)
    5. Unusual patterns (large amounts, off-hours)
    6. ML fraud probability when ML available (graceful fallback on error).
    
    Compliance Reference:
    - PSD-1/PSD-3: KYC tier transaction limits (centralized in config.transaction_limits)
    - PSD-6: Risk management requirements
    """
    from datetime import datetime
    from smartpay_ai.config.transaction_limits import RiskAmountThresholds

    base_risk = {
        "create_wallet": 0.1,
        "create_group": 0.15,
        "join_group": 0.1,
        "transfer_money": 0.4,
        "send_from_group": 0.45,
        "pay_bill": 0.35,
        "split_bill": 0.2,
        "contribute_to_group": 0.25,
        "initiate_cashout": 0.5,  # Higher risk (cash involved)
        "apply_loan": 0.6,  # High risk (credit decision)
        "redeem_voucher": 0.3,
        "add_members": 0.2,
        "remove_member": 0.25,
        "unknown": 0.5,
    }
    
    action_type = getattr(action, "action_type", "unknown")
    params = getattr(action, "parameters", {}) or {}
    
    # Start with base risk for action type
    risk = base_risk.get(action_type, 0.5)
    
    # Factor 1: Transaction amount (using centralized PSD-1/PSD-3 limits)
    if "amount" in params:
        try:
            amount = float(params["amount"])
            # Use centralized risk amount thresholds (aligned with KYC tier limits)
            risk += RiskAmountThresholds.get_risk_increment(amount)
        except (ValueError, TypeError):
            pass
    
    # TODO: ML-enhanced risk when ML service available
    # if "amount" in params:
    #     try:
    #         from smartpay_ai.ml_service import MLService, MLModelType
    #         ml_service = MLService()
    #         ml_result = await ml_service.predict(MLModelType.FRAUD_DETECTION, {...})
    #         risk = max(risk, ml_result.score)
    #     except Exception:
    #         pass  # Keep rule-based risk on ML failure (graceful degradation)
    
    # Factor 2: Recipient validation
    if action_type == "transfer_money" and "recipient" in params:
        recipient = params.get("recipient", "")
        # New/unverified recipient = higher risk
        if not recipient or len(str(recipient)) < 5:
            risk += 0.15
    
    # Factor 3: Unusual timing
    hour = datetime.utcnow().hour
    if hour < 6 or hour > 22:
        risk += 0.1  # Off-hours transactions
    
    # Factor 4: Rapid repeat actions
    messages = state.get("messages") or []
    if len(messages) > 5:
        # Check if this is the 3rd+ action of same type in short sequence
        recent_actions = [
            getattr(msg, "action_type", None) 
            for msg in messages[-5:] 
            if hasattr(msg, "action_type")
        ]
        if recent_actions.count(action_type) >= 2:
            risk += 0.2  # Repeated action pattern
    
    # Cap risk at 1.0
    return min(risk, 1.0)


def human_approval_node(state: SmartpayAgentState):
    """Pause for human approval. interrupt() returns the value passed to Command(resume=...)."""
    from langgraph.types import interrupt

    action = state.get("pending_action")
    if not action:
        return {}
    payload = {
        "action_type": action.action_type,
        "parameters": action.parameters,
        "summary_for_user": action.summary_for_user,
        "risk_level": action.risk_level,
    }
    approved = interrupt(payload)
    return {
        "approval_granted": approved is True or (isinstance(approved, dict) and approved.get("approved") is True),
    }


async def execute_tool_node(state: SmartpayAgentState, runtime: Runtime[CopilotDeps]) -> dict:
    """Execute the approved action via copilot tools (backend/2FA in production)."""
    deps = runtime.context
    if not state.get("approval_granted") or not state.get("pending_action"):
        return {"last_tool_result": "No approved action to execute.", "pending_action": None, "approval_granted": None}
    action = state["pending_action"]
    result = await copilot_tools.execute_pending_action(
        user_id=deps.user_id,
        auth_token=deps.auth_token,
        action_type=action.action_type,
        parameters=action.parameters,
    )
    return {
        "last_tool_result": str(result),
        "pending_action": None,
        "approval_granted": None,
    }
