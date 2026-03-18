"""
Tools for the Bill Assistant agent.

Location: backend_python/smartpay_ai/agents/bill_assistant/tools.py
Purpose: Bill tracking and split bill management utilities.
"""

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


async def get_upcoming_bills(
    user_id: str,
    days_ahead: int = 30,
    db_pool: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieve upcoming bills due within specified days.
    
    Args:
        user_id: User ID
        days_ahead: Number of days to look ahead
        db_pool: Database connection pool
    
    Returns:
        List of bill dictionaries
    """
    if not db_pool:
        logger.warning("No database pool provided, returning empty bills")
        return []
    
    try:
        end_date = datetime.now() + timedelta(days=days_ahead)
        
        async with db_pool.acquire() as conn:
            query = """
                SELECT 
                    id, name, amount, due_date, category, status,
                    recurring, priority, created_at
                FROM bills
                WHERE user_id = $1 
                AND due_date BETWEEN NOW() AND $2
                AND status != 'paid'
                ORDER BY due_date ASC, priority DESC
            """
            rows = await conn.fetch(query, user_id, end_date)
            return [dict(row) for row in rows]
    except Exception as e:
        logger.exception(f"Failed to fetch upcoming bills: {e}")
        return []


async def get_overdue_bills(
    user_id: str,
    db_pool: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieve overdue bills (past due date and not paid).
    
    Args:
        user_id: User ID
        db_pool: Database connection pool
    
    Returns:
        List of overdue bill dictionaries
    """
    if not db_pool:
        return []
    
    try:
        async with db_pool.acquire() as conn:
            query = """
                SELECT 
                    id, name, amount, due_date, category, status,
                    recurring, priority, created_at
                FROM bills
                WHERE user_id = $1 
                AND due_date < NOW()
                AND status != 'paid'
                ORDER BY due_date ASC
            """
            rows = await conn.fetch(query, user_id)
            return [dict(row) for row in rows]
    except Exception as e:
        logger.exception(f"Failed to fetch overdue bills: {e}")
        return []


async def get_split_bills(
    user_id: str,
    group_id: Optional[str] = None,
    db_pool: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieve split bills for user or group.
    
    Args:
        user_id: User ID
        group_id: Optional group ID filter
        db_pool: Database connection pool
    
    Returns:
        List of split bill dictionaries
    """
    if not db_pool:
        return []
    
    try:
        async with db_pool.acquire() as conn:
            query = """
                SELECT 
                    sb.id, sb.bill_name, sb.total_amount, sb.group_id,
                    sb.status, sb.created_at, g.name as group_name,
                    (
                        SELECT json_agg(json_build_object(
                            'user_id', sp.user_id,
                            'amount', sp.amount,
                            'paid', sp.paid,
                            'paid_at', sp.paid_at
                        ))
                        FROM split_participants sp
                        WHERE sp.split_id = sb.id
                    ) as participants
                FROM split_bills sb
                LEFT JOIN groups g ON g.id = sb.group_id
                WHERE (sb.created_by = $1 OR sb.id IN (
                    SELECT split_id FROM split_participants WHERE user_id = $1
                ))
            """
            params = [user_id]
            
            if group_id:
                query += " AND sb.group_id = $2"
                params.append(group_id)
            
            query += " ORDER BY sb.created_at DESC"
            
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]
    except Exception as e:
        logger.exception(f"Failed to fetch split bills: {e}")
        return []


async def calculate_total_due(
    bills: List[Dict[str, Any]]
) -> float:
    """
    Calculate total amount due from bill list.
    
    Args:
        bills: List of bill dictionaries
    
    Returns:
        Total amount due
    """
    return sum(float(bill.get("amount", 0)) for bill in bills)


async def identify_recurring_bills(
    user_id: str,
    db_pool: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """
    Identify recurring bills based on pattern analysis.
    
    Args:
        user_id: User ID
        db_pool: Database connection pool
    
    Returns:
        List of recurring bill patterns
    """
    if not db_pool:
        return []
    
    try:
        async with db_pool.acquire() as conn:
            # Find bills with same name/merchant that repeat monthly
            query = """
                SELECT 
                    name,
                    category,
                    AVG(amount) as avg_amount,
                    COUNT(*) as occurrence_count,
                    MAX(due_date) as last_due_date
                FROM bills
                WHERE user_id = $1
                AND created_at >= NOW() - INTERVAL '6 months'
                GROUP BY name, category
                HAVING COUNT(*) >= 3
                ORDER BY occurrence_count DESC
            """
            rows = await conn.fetch(query, user_id)
            
            recurring = []
            for row in rows:
                recurring.append({
                    "name": row["name"],
                    "category": row["category"],
                    "avg_amount": float(row["avg_amount"]),
                    "frequency": "monthly" if row["occurrence_count"] >= 4 else "quarterly",
                    "last_due": row["last_due_date"],
                })
            
            return recurring
    except Exception as e:
        logger.exception(f"Failed to identify recurring bills: {e}")
        return []


async def suggest_payment_schedule(
    bills: List[Dict[str, Any]],
    monthly_income: float,
    payday: int = 25,  # Day of month
) -> Dict[str, Any]:
    """
    Suggest optimal payment schedule based on cash flow.
    
    Args:
        bills: List of upcoming bills
        monthly_income: User's monthly income
        payday: Day of month when user receives salary
    
    Returns:
        Recommended payment schedule
    """
    if not bills:
        return {"schedule": [], "message": "No bills to schedule"}
    
    # Categorize bills by priority
    high_priority = []
    medium_priority = []
    low_priority = []
    
    for bill in bills:
        priority = bill.get("priority", "medium")
        if priority == "high":
            high_priority.append(bill)
        elif priority == "medium":
            medium_priority.append(bill)
        else:
            low_priority.append(bill)
    
    # Calculate total due
    total_due = sum(float(b.get("amount", 0)) for b in bills)
    
    # Build schedule
    schedule = []
    
    # Strategy 1: Pay high priority bills immediately after payday
    if high_priority:
        schedule.append({
            "date_range": f"Day {payday}-{payday+2}",
            "bills": [b["name"] for b in high_priority],
            "total": sum(float(b.get("amount", 0)) for b in high_priority),
            "reason": "Essential bills - pay immediately after salary",
        })
    
    # Strategy 2: Pay medium priority bills mid-month
    if medium_priority:
        schedule.append({
            "date_range": f"Day {(payday+7) % 31}-{(payday+10) % 31}",
            "bills": [b["name"] for b in medium_priority],
            "total": sum(float(b.get("amount", 0)) for b in medium_priority),
            "reason": "Important bills - pay after ensuring essential bills are covered",
        })
    
    # Strategy 3: Pay low priority bills last
    if low_priority:
        schedule.append({
            "date_range": f"Day {(payday+15) % 31}-{(payday+20) % 31}",
            "bills": [b["name"] for b in low_priority],
            "total": sum(float(b.get("amount", 0)) for b in low_priority),
            "reason": "Flexible bills - pay when cash flow allows",
        })
    
    # Check if affordable
    affordable = total_due <= (monthly_income * 0.7)  # Allow 30% buffer
    
    return {
        "schedule": schedule,
        "total_due": total_due,
        "monthly_income": monthly_income,
        "affordable": affordable,
        "message": "Recommended payment schedule based on your payday" if affordable else "⚠ Total bills exceed 70% of income - consider cost reduction",
    }


async def calculate_days_until_due(
    due_date: Any,
) -> int:
    """
    Calculate days until bill due date.
    
    Args:
        due_date: Due date (datetime or string)
    
    Returns:
        Number of days until due (negative if overdue)
    """
    if isinstance(due_date, str):
        try:
            due_date = datetime.fromisoformat(due_date.replace("Z", "+00:00"))
        except:
            return 999  # Unknown date
    
    if not isinstance(due_date, datetime):
        return 999
    
    delta = due_date - datetime.now()
    return delta.days


async def get_split_bill_summary(
    split_bills: List[Dict[str, Any]],
    user_id: str,
) -> Dict[str, Any]:
    """
    Summarize split bill status for user.
    
    Args:
        split_bills: List of split bill dictionaries
        user_id: User ID
    
    Returns:
        Summary dict with amounts owed and owing
    """
    you_owe = 0.0
    owed_to_you = 0.0
    active_splits = 0
    
    for split in split_bills:
        if split.get("status") == "complete":
            continue
        
        active_splits += 1
        participants = split.get("participants", [])
        
        for p in participants:
            if p.get("user_id") == user_id and not p.get("paid"):
                you_owe += float(p.get("amount", 0))
            elif p.get("user_id") != user_id and not p.get("paid"):
                owed_to_you += float(p.get("amount", 0))
    
    return {
        "active_splits": active_splits,
        "you_owe": you_owe,
        "owed_to_you": owed_to_you,
        "net_balance": owed_to_you - you_owe,
    }
