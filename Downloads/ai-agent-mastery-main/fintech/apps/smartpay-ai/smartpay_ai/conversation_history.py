"""
AI Copilot conversation history management with user isolation.

Location: backend_python/smartpay_ai/conversation_history.py
Purpose: Store, retrieve, and manage user-specific conversation history for personalized AI interactions.
         Implements automatic context management, summarization, and cleanup.
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from smartpay_ai.db_utils import get_db_pool

logger = logging.getLogger(__name__)


def _valid_user_id(user_id: str) -> bool:
    """Return True if user_id is a valid UUID string (required for DB; users.id is UUID)."""
    if not user_id or not isinstance(user_id, str):
        return False
    try:
        UUID(user_id)
        return True
    except (ValueError, TypeError):
        return False


async def store_message(
    user_id: str,
    role: str,  # 'user' | 'assistant' | 'system'
    content: str,
    *,
    thread_id: Optional[str] = None,
    conversation_type: str = "chat",
    intent: Optional[str] = None,
    sentiment: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    response_time_ms: Optional[int] = None,
    model_used: Optional[str] = None,
    tokens_used: Optional[int] = None,
) -> str:
    """
    Store a conversation message with full context.
    Returns the message ID.
    
    Args:
        user_id: User UUID
        role: 'user', 'assistant', or 'system'
        content: Message text
        thread_id: Optional thread/session ID for grouping
        conversation_type: 'chat', 'support', 'financial_advice', 'tutorial'
        intent: Detected intent (e.g., 'send_money', 'check_balance')
        sentiment: User sentiment ('positive', 'neutral', 'negative', 'frustrated')
        metadata: Additional context (tool calls, action results, etc.)
        response_time_ms: Assistant response latency
        model_used: LLM model name
        tokens_used: Token consumption
    """
    pool = await get_db_pool()

    if not _valid_user_id(user_id):
        logger.debug("Skipping store_message: user_id not a valid UUID (e.g. anonymous/curl).")
        return "anonymous"

    row = await pool.fetchrow(
        """
        INSERT INTO ai_conversation_history (
            user_id, thread_id, role, content, metadata,
            conversation_type, intent, sentiment,
            response_time_ms, model_used, tokens_used
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
        """,
        UUID(user_id) if isinstance(user_id, str) else user_id,
        thread_id,
        role,
        content,
        metadata or {},
        conversation_type,
        intent,
        sentiment,
        response_time_ms,
        model_used,
        tokens_used,
    )
    
    # Update user preferences interaction tracking (only for valid user_id)
    await pool.execute(
        """
        INSERT INTO ai_user_preferences (user_id, last_interaction_at, total_interactions)
        VALUES ($1, NOW(), 1)
        ON CONFLICT (user_id) DO UPDATE SET
            last_interaction_at = NOW(),
            total_interactions = ai_user_preferences.total_interactions + 1
        """,
        UUID(user_id) if isinstance(user_id, str) else user_id,
    )
    
    return str(row["id"])


async def get_conversation_context(
    user_id: str,
    *,
    limit: int = 10,
    thread_id: Optional[str] = None,
    conversation_type: Optional[str] = None,
    include_system: bool = False,
) -> List[Dict[str, Any]]:
    """
    Retrieve recent conversation history for context injection.
    Returns messages in chronological order (oldest first).
    
    Args:
        user_id: User UUID
        limit: Maximum messages to retrieve
        thread_id: Filter by specific thread
        conversation_type: Filter by conversation type
        include_system: Include system messages in context
    
    Returns:
        List of messages with role, content, timestamp, metadata
    """
    if not _valid_user_id(user_id):
        return []
    pool = await get_db_pool()
    
    conditions = ["user_id = $1"]
    params: List[Any] = [UUID(user_id) if isinstance(user_id, str) else user_id]
    param_idx = 2
    
    if thread_id:
        conditions.append(f"thread_id = ${param_idx}")
        params.append(thread_id)
        param_idx += 1
    
    if conversation_type:
        conditions.append(f"conversation_type = ${param_idx}")
        params.append(conversation_type)
        param_idx += 1
    
    if not include_system:
        conditions.append("role != 'system'")
    
    where_clause = " AND ".join(conditions)
    
    rows = await pool.fetch(
        f"""
        SELECT id, role, content, metadata, intent, sentiment, created_at
        FROM ai_conversation_history
        WHERE {where_clause}
        ORDER BY created_at DESC
        LIMIT ${param_idx}
        """,
        *params,
        limit,
    )
    
    # Reverse to chronological order (oldest first)
    messages = [
        {
            "id": str(r["id"]),
            "role": r["role"],
            "content": r["content"],
            "metadata": dict(r["metadata"]) if r["metadata"] else {},
            "intent": r["intent"],
            "sentiment": r["sentiment"],
            "timestamp": r["created_at"].isoformat(),
        }
        for r in reversed(rows)
    ]
    
    return messages


async def get_user_preferences(user_id: str) -> Dict[str, Any]:
    """
    Fetch user's AI Copilot preferences.
    Creates default preferences if none exist.
    """
    if not _valid_user_id(user_id):
        return {}
    pool = await get_db_pool()
    
    row = await pool.fetchrow(
        """
        INSERT INTO ai_user_preferences (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
        RETURNING 
            preferred_name, communication_style, language_preference,
            proactive_tips, spending_alerts, tutorial_mode, voice_enabled,
            conversation_retention_days, auto_summarize_after_messages,
            share_analytics, store_conversation, onboarding_completed,
            last_interaction_at, total_interactions
        """,
        UUID(user_id) if isinstance(user_id, str) else user_id,
    )
    
    return {
        "preferred_name": row["preferred_name"],
        "communication_style": row["communication_style"],
        "language_preference": row["language_preference"],
        "proactive_tips": row["proactive_tips"],
        "spending_alerts": row["spending_alerts"],
        "tutorial_mode": row["tutorial_mode"],
        "voice_enabled": row["voice_enabled"],
        "conversation_retention_days": row["conversation_retention_days"],
        "auto_summarize_after_messages": row["auto_summarize_after_messages"],
        "share_analytics": row["share_analytics"],
        "store_conversation": row["store_conversation"],
        "onboarding_completed": row["onboarding_completed"],
        "last_interaction_at": row["last_interaction_at"].isoformat() if row["last_interaction_at"] else None,
        "total_interactions": row["total_interactions"],
    }


async def update_user_preferences(user_id: str, **preferences) -> None:
    """
    Update user's AI Copilot preferences.
    
    Allowed fields:
        - preferred_name, communication_style, language_preference
        - proactive_tips, spending_alerts, tutorial_mode, voice_enabled
        - conversation_retention_days, auto_summarize_after_messages
        - share_analytics, store_conversation, onboarding_completed
    """
    pool = await get_db_pool()
    
    # Build SET clause dynamically
    allowed_fields = {
        "preferred_name", "communication_style", "language_preference",
        "proactive_tips", "spending_alerts", "tutorial_mode", "voice_enabled",
        "conversation_retention_days", "auto_summarize_after_messages",
        "share_analytics", "store_conversation", "onboarding_completed",
    }
    
    updates = {k: v for k, v in preferences.items() if k in allowed_fields}
    if not updates:
        return
    
    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates.keys()))
    params = [UUID(user_id) if isinstance(user_id, str) else user_id] + list(updates.values())
    
    await pool.execute(
        f"""
        INSERT INTO ai_user_preferences (user_id, {', '.join(updates.keys())})
        VALUES ($1, {', '.join(f'${i+2}' for i in range(len(updates)))})
        ON CONFLICT (user_id) DO UPDATE SET {set_clause}
        """,
        *params,
    )


async def record_feedback(message_id: str, rating: int, flagged: bool = False) -> None:
    """
    Record user feedback on an AI response.
    
    Args:
        message_id: Message UUID
        rating: 1-5 star rating
        flagged: Whether to flag for review
    """
    pool = await get_db_pool()
    
    await pool.execute(
        """
        UPDATE ai_conversation_history
        SET user_feedback = $2, flagged = $3
        WHERE id = $1
        """,
        UUID(message_id) if isinstance(message_id, str) else message_id,
        rating,
        flagged,
    )


async def format_conversation_for_llm(
    user_id: str,
    *,
    limit: int = 10,
    thread_id: Optional[str] = None,
    include_metadata: bool = False,
) -> str:
    """
    Format conversation history for LLM context injection.
    Returns a formatted string suitable for appending to system/user prompts.
    
    Format:
        [Previous Conversation]
        User: How do I send money?
        Assistant: To send money with Smartpay...
        User: What about fees?
        Assistant: Transaction fees are...
    """
    messages = await get_conversation_context(
        user_id,
        limit=limit,
        thread_id=thread_id,
        include_system=False,
    )
    
    if not messages:
        return ""
    
    lines = ["[Previous Conversation]"]
    for msg in messages:
        role_label = "User" if msg["role"] == "user" else "Assistant"
        lines.append(f"{role_label}: {msg['content']}")
        
        if include_metadata and msg.get("intent"):
            lines.append(f"  [Intent: {msg['intent']}]")
    
    return "\n".join(lines)
