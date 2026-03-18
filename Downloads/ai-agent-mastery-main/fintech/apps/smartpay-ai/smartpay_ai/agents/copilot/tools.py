"""
Copilot agent tools: read-only routing to specialists and write-action execution with actual API calls.

Location: backend_python/smartpay_ai/agents/copilot/tools.py
Purpose: Used by Pydantic AI agent (read-only) and by graph execute_tool_node (write after approval).
         Implements actual HTTP calls to Smartpay Node.js backend API.
"""

import logging
import os
from typing import Any, Dict, List, Optional

import httpx

from smartpay_ai.knowledge_base import retrieve as kb_retrieve

logger = logging.getLogger(__name__)

API_BASE_URL = os.getenv("SMARTPAY_API_BASE_URL", "http://localhost:4000")
API_TIMEOUT = 30.0
MAX_RETRIES = 3


# ---------------------------------------------------------------------------
# Knowledge base (user-isolated: consumer protection, regulation, financial literacy)
# ---------------------------------------------------------------------------

async def search_knowledge_base(query: str, user_id: Optional[str] = None, limit: int = 5) -> str:
    """Search the curated Smartpay knowledge base. Results are user-isolated (global + that user only)."""
    try:
        hits = await kb_retrieve(query, user_id=user_id, limit=limit)
    except Exception as e:
        logger.exception("Knowledge base search failed: %s", e)
        return "The knowledge base is temporarily unavailable. Please try again or ask in a different way."
    if not hits:
        return "No matching articles found. You can ask about fees, complaints, KYC, proof-of-life, regulations, NAMQR, or financial tips."
    parts = []
    for h in hits:
        parts.append(f"[{h['title']}]\n{h['snippet']}")
    return "\n\n---\n\n".join(parts)


# ---------------------------------------------------------------------------
# Read-only specialist routers (stubs – in production call actual agents/APIs)
# ---------------------------------------------------------------------------

async def route_to_security_guardian(query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Route fraud/risk/security queries to the Security Guardian agent.
    
    Uses ML models when available:
    - fraud_detection: Real-time fraud probability
    - credit_scoring: Credit risk assessment
    
    Falls back to rule-based assessment when ML is unavailable (graceful degradation).
    """
    logger.info("Security Guardian called with query: %s", query)
    context = context or {}
    
    try:
        from smartpay_ai.agents.security_guardian import run_security_guardian
        
        response = await run_security_guardian(
            query=query,
            user_id=context.get("user_id", ""),
            transaction_id=context.get("transaction_id"),
            context=context,
            db_pool=context.get("db_pool"),
            ml_service=context.get("ml_service"),
        )
        
        return {
            "agent": "security_guardian",
            "response": response.summary,
            "risk_score": response.risk_score,
            "risk_level": response.risk_level,
            "is_safe": response.is_safe,
            "alerts": [alert.dict() for alert in response.alerts],
            "recommendations": [rec.dict() for rec in response.recommendations],
        }
    except Exception as e:
        logger.exception(f"Security Guardian agent failed: {e}")
        return {"agent": "security_guardian", "response": f"Security analysis for: {query}", "error": str(e)}


async def route_to_transaction_analyst(query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Route spending/transaction analysis to the Transaction Analyst agent.
    
    Uses ML models when available:
    - spending_analysis: Spending pattern analysis and segmentation
    - transaction_classification: Auto-categorize transactions
    
    Falls back to stub response when ML is unavailable or fails (graceful degradation).
    """
    logger.info("Transaction Analyst called with query: %s", query)
    context = context or {}

    try:
        from smartpay_ai.agents.transaction_analyst import run_transaction_analyst
        
        response = await run_transaction_analyst(
            query=query,
            user_id=context.get("user_id", ""),
            period=context.get("period", "month"),
            category=context.get("category"),
            context=context,
            db_pool=context.get("db_pool"),
            ml_service=context.get("ml_service"),
        )
        
        return {
            "agent": "transaction_analyst",
            "response": response.summary,
            "total_spent": response.total_spent,
            "total_income": response.total_income,
            "net_balance": response.net_balance,
            "category_breakdown": [cat.dict() for cat in response.category_breakdown],
            "insights": [insight.dict() for insight in response.insights],
            "recommendations": [rec.dict() for rec in response.recommendations],
        }
    except Exception as e:
        logger.exception(f"Transaction Analyst agent failed: {e}")
        return {"agent": "transaction_analyst", "response": f"Spending analysis for: {query}", "error": str(e)}


async def route_to_savings_advisor(query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Route savings goals and recommendations to the Savings Advisor agent.
    
    Uses ML models when available:
    - savings_recommendations: Personalized savings strategies
    - spending_analysis: Identify savings opportunities
    
    Falls back to rule-based advice when ML is unavailable (graceful degradation).
    """
    logger.info("Savings Advisor called with query: %s", query)
    context = context or {}
    
    try:
        from smartpay_ai.agents.savings_advisor import run_savings_advisor
        
        response = await run_savings_advisor(
            query=query,
            user_id=context.get("user_id", ""),
            goal_id=context.get("goal_id"),
            context=context,
            db_pool=context.get("db_pool"),
            ml_service=context.get("ml_service"),
        )
        
        return {
            "agent": "savings_advisor",
            "response": response.summary,
            "total_savings": response.total_savings,
            "monthly_savings_rate": response.monthly_savings_rate,
            "savings_ratio": response.savings_ratio,
            "goals": [goal.dict() for goal in response.goals],
            "recommendations": [rec.dict() for rec in response.recommendations],
            "tips": [tip.dict() for tip in response.tips],
        }
    except Exception as e:
        logger.exception(f"Savings Advisor agent failed: {e}")
        return {"agent": "savings_advisor", "response": f"Savings advice for: {query}", "error": str(e)}


async def route_to_bill_assistant(query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Route bill reminders and split bill queries to the Bill Assistant agent.
    
    Uses ML models when available:
    - bill_prediction: Predict upcoming bills
    - transaction_classification: Identify recurring bills
    
    Falls back to manual tracking when ML is unavailable (graceful degradation).
    """
    logger.info("Bill Assistant called with query: %s", query)
    context = context or {}
    
    try:
        from smartpay_ai.agents.bill_assistant import run_bill_assistant
        
        response = await run_bill_assistant(
            query=query,
            user_id=context.get("user_id", ""),
            bill_id=context.get("bill_id"),
            group_id=context.get("group_id"),
            context=context,
            db_pool=context.get("db_pool"),
        )
        
        return {
            "agent": "bill_assistant",
            "response": response.summary,
            "upcoming_bills": [bill.dict() for bill in response.upcoming_bills],
            "overdue_bills": [bill.dict() for bill in response.overdue_bills],
            "split_bills": [split.dict() for split in response.split_bills],
            "total_due": response.total_due,
            "recommendations": [rec.dict() for rec in response.recommendations],
        }
    except Exception as e:
        logger.exception(f"Bill Assistant agent failed: {e}")
        return {"agent": "bill_assistant", "response": f"Bill management for: {query}", "error": str(e)}


async def route_to_group_manager(query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Route group creation and management queries to the Group Manager agent.
    
    Handles:
    - Group creation and invitations
    - Split bill management
    - Member management
    - Group wallet operations
    """
    logger.info("Group Manager called with query: %s", query)
    context = context or {}
    
    try:
        from smartpay_ai.agents.group_manager import run_group_manager
        
        response = await run_group_manager(
            query=query,
            user_id=context.get("user_id", ""),
            group_id=context.get("group_id"),
            context=context,
            db_pool=context.get("db_pool"),
        )
        
        return {
            "agent": "group_manager",
            "response": response.summary,
            "group_info": response.group_info.dict() if response.group_info else None,
            "members": [member.dict() for member in response.members],
            "pending_actions": [action.dict() for action in response.pending_actions],
            "recommendations": response.recommendations,
        }
    except Exception as e:
        logger.exception(f"Group Manager agent failed: {e}")
        return {"agent": "group_manager", "response": f"Group management for: {query}", "error": str(e)}


# ---------------------------------------------------------------------------
# HTTP Client Helper
# ---------------------------------------------------------------------------

async def _make_api_request(
    method: str,
    endpoint: str,
    auth_token: str,
    json_data: Optional[Dict[str, Any]] = None,
    params: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Make HTTP request to Smartpay Node.js backend with retries and error handling.
    
    Args:
        method: HTTP method (GET, POST, DELETE, etc.)
        endpoint: API endpoint path (e.g., "/api/v1/mobile/wallets")
        auth_token: Bearer token for authentication
        json_data: JSON payload for POST/PUT requests
        params: Query parameters
        
    Returns:
        Response JSON as dict
        
    Raises:
        Exception on failure after retries
    """
    url = f"{API_BASE_URL}{endpoint}"
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json",
    }
    
    async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
        for attempt in range(MAX_RETRIES):
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=json_data,
                    params=params,
                )
                
                if response.status_code == 401:
                    return {"error": "Authentication failed. Please log in again."}
                
                if response.status_code == 403:
                    return {"error": "Permission denied."}
                
                if response.status_code == 404:
                    return {"error": "Resource not found."}
                
                if response.status_code >= 500:
                    if attempt < MAX_RETRIES - 1:
                        logger.warning(f"Server error (attempt {attempt + 1}/{MAX_RETRIES}): {response.status_code}")
                        continue
                    return {"error": f"Server error: {response.status_code}"}
                
                if response.status_code >= 400:
                    error_msg = response.text
                    try:
                        error_data = response.json()
                        error_msg = error_data.get("message", error_data.get("error", error_msg))
                    except Exception:
                        pass
                    return {"error": error_msg}
                
                try:
                    return response.json()
                except Exception:
                    return {"success": True, "status_code": response.status_code}
                
            except httpx.TimeoutException:
                if attempt < MAX_RETRIES - 1:
                    logger.warning(f"Request timeout (attempt {attempt + 1}/{MAX_RETRIES})")
                    continue
                return {"error": "Request timeout. Please try again."}
            
            except httpx.ConnectError:
                return {"error": "Cannot connect to Smartpay backend. Please check your connection."}
            
            except Exception as e:
                logger.exception(f"API request failed: {e}")
                if attempt < MAX_RETRIES - 1:
                    continue
                return {"error": f"Request failed: {str(e)}"}
    
    return {"error": "Request failed after retries"}


# ---------------------------------------------------------------------------
# Write-action execution (called by graph execute_tool_node after approval)
# ---------------------------------------------------------------------------

async def create_wallet_tool(
    user_id: str,
    auth_token: str,
    name: str,
    wallet_type: str = "savings",
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a new wallet via Smartpay Node backend API."""
    logger.info("Creating wallet: %s (%s) for user %s", name, wallet_type, user_id)
    
    return await _make_api_request(
        method="POST",
        endpoint="/api/v1/mobile/wallets",
        auth_token=auth_token,
        json_data={
            "name": name,
            "type": wallet_type,
            **kwargs,
        },
    )


async def create_group_tool(
    user_id: str,
    auth_token: str,
    name: str,
    description: str = "",
    member_ids: Optional[List[str]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a group via Smartpay Node backend API."""
    logger.info("Creating group: %s for user %s", name, user_id)
    
    return await _make_api_request(
        method="POST",
        endpoint="/api/v1/mobile/groups",
        auth_token=auth_token,
        json_data={
            "name": name,
            "description": description,
            "member_ids": member_ids or [],
            **kwargs,
        },
    )


async def add_group_members_tool(
    user_id: str,
    auth_token: str,
    group_id: str,
    member_ids: List[str],
    **kwargs: Any,
) -> Dict[str, Any]:
    """Add members to a group via Smartpay Node backend API."""
    logger.info("Adding %d members to group %s", len(member_ids), group_id)
    
    return await _make_api_request(
        method="POST",
        endpoint=f"/api/v1/mobile/groups/{group_id}/members",
        auth_token=auth_token,
        json_data={
            "member_ids": member_ids,
            **kwargs,
        },
    )


async def remove_group_member_tool(
    user_id: str,
    auth_token: str,
    group_id: str,
    member_id: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Remove a member from a group via Smartpay Node backend API."""
    logger.info("Removing member %s from group %s", member_id, group_id)
    
    return await _make_api_request(
        method="DELETE",
        endpoint=f"/api/v1/mobile/groups/{group_id}/members/{member_id}",
        auth_token=auth_token,
    )


async def transfer_money_tool(
    user_id: str,
    auth_token: str,
    from_wallet_id: str,
    recipient: str,
    amount: float,
    verification_token: Optional[str] = None,
    note: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Transfer money to recipient via Smartpay Node backend API. Requires 2FA token."""
    logger.info("Transferring N$%s from %s to %s", amount, from_wallet_id, recipient)
    
    if not verification_token:
        return {
            "error": "2FA verification required",
            "requires_2fa": True,
            "message": "Please provide your verification code to complete this transfer",
        }
    
    return await _make_api_request(
        method="POST",
        endpoint="/api/v1/mobile/transactions/send",
        auth_token=auth_token,
        json_data={
            "from_wallet_id": from_wallet_id,
            "recipient": recipient,
            "amount": amount,
            "verification_token": verification_token,
            "note": note,
            **kwargs,
        },
    )


async def pay_bill_tool(
    user_id: str,
    auth_token: str,
    bill_id: str,
    amount: float,
    wallet_id: str,
    verification_token: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Pay a bill via Smartpay Node backend API."""
    logger.info("Paying bill %s amount N$%s from wallet %s", bill_id, amount, wallet_id)
    
    if not verification_token:
        return {
            "error": "2FA verification required",
            "requires_2fa": True,
            "message": "Please provide your verification code to complete this payment",
        }
    
    return await _make_api_request(
        method="POST",
        endpoint="/api/v1/mobile/bills/pay",
        auth_token=auth_token,
        json_data={
            "bill_id": bill_id,
            "amount": amount,
            "wallet_id": wallet_id,
            "verification_token": verification_token,
            **kwargs,
        },
    )


async def split_bill_tool(
    user_id: str,
    auth_token: str,
    group_id: str,
    total_amount: float,
    split_method: str = "equal",
    participant_shares: Optional[Dict[str, float]] = None,
    verification_token: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Create a split bill request in a group via Smartpay Node backend API."""
    logger.info("Creating split bill in group %s: N$%s (%s)", group_id, total_amount, split_method)
    
    return await _make_api_request(
        method="POST",
        endpoint=f"/api/v1/mobile/groups/{group_id}/split",
        auth_token=auth_token,
        json_data={
            "total_amount": total_amount,
            "split_method": split_method,
            "participant_shares": participant_shares,
            "verification_token": verification_token,
            **kwargs,
        },
    )


async def contribute_to_group_tool(
    user_id: str,
    auth_token: str,
    group_id: str,
    amount: float,
    wallet_id: str,
    verification_token: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Contribute money to group wallet via Smartpay Node backend API."""
    logger.info("Contributing N$%s to group %s from wallet %s", amount, group_id, wallet_id)
    
    if not verification_token:
        return {
            "error": "2FA verification required",
            "requires_2fa": True,
            "message": "Please provide your verification code to complete this contribution",
        }
    
    return await _make_api_request(
        method="POST",
        endpoint=f"/api/v1/mobile/groups/{group_id}/contribute",
        auth_token=auth_token,
        json_data={
            "amount": amount,
            "wallet_id": wallet_id,
            "verification_token": verification_token,
            **kwargs,
        },
    )


async def send_from_group_tool(
    user_id: str,
    auth_token: str,
    group_id: str,
    recipient: str,
    amount: float,
    verification_token: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Send money from group wallet via Smartpay Node backend API (requires admin role)."""
    logger.info("Sending N$%s from group %s to %s", amount, group_id, recipient)
    
    if not verification_token:
        return {
            "error": "2FA verification required",
            "requires_2fa": True,
            "message": "Please provide your verification code to complete this transfer",
        }
    
    return await _make_api_request(
        method="POST",
        endpoint=f"/api/v1/mobile/groups/{group_id}/send",
        auth_token=auth_token,
        json_data={
            "recipient": recipient,
            "amount": amount,
            "verification_token": verification_token,
            **kwargs,
        },
    )


async def redeem_voucher_tool(
    user_id: str,
    auth_token: str,
    voucher_code: str,
    target_wallet_id: Optional[str] = None,
    verification_token: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Redeem a voucher to wallet via Smartpay Node backend API."""
    logger.info("Redeeming voucher %s for user %s", voucher_code, user_id)
    
    return await _make_api_request(
        method="POST",
        endpoint="/api/v1/mobile/vouchers/redeem",
        auth_token=auth_token,
        json_data={
            "voucher_code": voucher_code,
            "target_wallet_id": target_wallet_id,
            "verification_token": verification_token,
            **kwargs,
        },
    )


async def apply_loan_tool(
    user_id: str,
    auth_token: str,
    amount: float,
    purpose: Optional[str] = None,
    wallet_id: Optional[str] = None,
    verification_token: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Apply for a loan via Smartpay Node backend API."""
    logger.info("Applying for loan amount N$%s for user %s", amount, user_id)
    
    return await _make_api_request(
        method="POST",
        endpoint="/api/v1/mobile/loans/apply",
        auth_token=auth_token,
        json_data={
            "amount": amount,
            "purpose": purpose,
            "wallet_id": wallet_id,
            "verification_token": verification_token,
            **kwargs,
        },
    )


async def initiate_cashout_tool(
    user_id: str,
    auth_token: str,
    amount: float,
    wallet_id: str,
    agent_location: Optional[str] = None,
    verification_token: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Generate cash-out code for agent redemption (NAMQR) via Smartpay Node backend API."""
    logger.info("Initiating cashout N$%s from wallet %s", amount, wallet_id)
    
    if not verification_token:
        return {
            "error": "2FA verification required",
            "requires_2fa": True,
            "message": "Please provide your verification code to initiate cash-out",
        }
    
    return await _make_api_request(
        method="POST",
        endpoint="/api/v1/mobile/cashout/initiate",
        auth_token=auth_token,
        json_data={
            "amount": amount,
            "wallet_id": wallet_id,
            "agent_location": agent_location,
            "verification_token": verification_token,
            **kwargs,
        },
    )


async def join_group_tool(
    user_id: str,
    auth_token: str,
    group_id: str,
    invitation_code: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Accept group invitation and join group via Smartpay Node backend API."""
    logger.info("User %s joining group %s", user_id, group_id)
    
    return await _make_api_request(
        method="POST",
        endpoint=f"/api/v1/mobile/groups/{group_id}/join",
        auth_token=auth_token,
        json_data={
            "invitation_code": invitation_code,
            **kwargs,
        },
    )


# ---------------------------------------------------------------------------
# Dispatcher for execute_tool_node (DRY: one place mapping action_type → tool)
# ---------------------------------------------------------------------------

ACTION_TOOL_MAP = {
    "create_wallet": create_wallet_tool,
    "create_group": create_group_tool,
    "add_members": add_group_members_tool,
    "remove_member": remove_group_member_tool,
    "transfer_money": transfer_money_tool,
    "pay_bill": pay_bill_tool,
    "split_bill": split_bill_tool,
    "contribute_to_group": contribute_to_group_tool,
    "send_from_group": send_from_group_tool,
    "redeem_voucher": redeem_voucher_tool,
    "apply_loan": apply_loan_tool,
    "initiate_cashout": initiate_cashout_tool,
    "join_group": join_group_tool,
}


async def execute_pending_action(
    user_id: str,
    auth_token: str,
    action_type: str,
    parameters: Dict[str, Any],
) -> Dict[str, Any]:
    """Execute an approved pending action. Used by graph execute_tool_node."""
    fn = ACTION_TOOL_MAP.get(action_type)
    if not fn:
        return {"error": f"Unknown action type: {action_type}"}
    try:
        result = await fn(
            user_id=user_id,
            auth_token=auth_token,
            **{k: v for k, v in parameters.items() if k != "verification_token"},
            verification_token=parameters.get("verification_token"),
        )
        return result
    except Exception as e:
        logger.exception("Execute action %s failed", action_type)
        return {"error": str(e)}
