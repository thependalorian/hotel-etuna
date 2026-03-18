"""
Tools for the Group Manager agent.

Location: backend_python/smartpay_ai/agents/group_manager/tools.py
Purpose: Group operations and member management utilities.
"""

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


async def get_group_info(
    group_id: str,
    db_pool: Optional[Any] = None,
) -> Optional[Dict[str, Any]]:
    """
    Retrieve group information and balance.
    
    Args:
        group_id: Group ID
        db_pool: Database connection pool
    
    Returns:
        Group info dictionary or None
    """
    if not db_pool:
        logger.warning("No database pool provided")
        return None
    
    try:
        async with db_pool.acquire() as conn:
            query = """
                SELECT 
                    g.id, g.name, g.description, g.group_type,
                    g.created_by, g.created_at,
                    COALESCE(w.balance, 0) as wallet_balance,
                    COUNT(DISTINCT gm.user_id) as member_count,
                    COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END), 0) as total_contributions,
                    COALESCE(SUM(CASE WHEN t.type = 'debit' THEN ABS(t.amount) ELSE 0 END), 0) as total_expenses
                FROM groups g
                LEFT JOIN wallets w ON w.group_id = g.id
                LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.status = 'active'
                LEFT JOIN transactions t ON t.group_id = g.id
                WHERE g.id = $1
                GROUP BY g.id, g.name, g.description, g.group_type, g.created_by, g.created_at, w.balance
            """
            row = await conn.fetchrow(query, group_id)
            return dict(row) if row else None
    except Exception as e:
        logger.exception(f"Failed to fetch group info: {e}")
        return None


async def get_group_members(
    group_id: str,
    db_pool: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieve all members of a group.
    
    Args:
        group_id: Group ID
        db_pool: Database connection pool
    
    Returns:
        List of member dictionaries
    """
    if not db_pool:
        return []
    
    try:
        async with db_pool.acquire() as conn:
            query = """
                SELECT 
                    gm.user_id, u.name, gm.role, gm.joined_at, gm.status,
                    COALESCE(SUM(t.amount), 0) as contribution
                FROM group_members gm
                JOIN users u ON u.id = gm.user_id
                LEFT JOIN transactions t ON t.user_id = gm.user_id 
                    AND t.group_id = gm.group_id 
                    AND t.type = 'credit'
                WHERE gm.group_id = $1
                GROUP BY gm.user_id, u.name, gm.role, gm.joined_at, gm.status
                ORDER BY gm.role DESC, gm.joined_at ASC
            """
            rows = await conn.fetch(query, group_id)
            return [dict(row) for row in rows]
    except Exception as e:
        logger.exception(f"Failed to fetch group members: {e}")
        return []


async def get_group_transactions(
    group_id: str,
    limit: int = 50,
    db_pool: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieve group transaction history.
    
    Args:
        group_id: Group ID
        limit: Maximum number of transactions
        db_pool: Database connection pool
    
    Returns:
        List of transaction dictionaries
    """
    if not db_pool:
        return []
    
    try:
        async with db_pool.acquire() as conn:
            query = """
                SELECT 
                    t.id, t.amount, t.type, t.description, t.created_at,
                    u.name as user_name
                FROM transactions t
                JOIN users u ON u.id = t.user_id
                WHERE t.group_id = $1
                ORDER BY t.created_at DESC
                LIMIT $2
            """
            rows = await conn.fetch(query, group_id, limit)
            return [dict(row) for row in rows]
    except Exception as e:
        logger.exception(f"Failed to fetch group transactions: {e}")
        return []


async def calculate_member_contributions(
    group_id: str,
    db_pool: Optional[Any] = None,
) -> Dict[str, float]:
    """
    Calculate total contributions by each member.
    
    Args:
        group_id: Group ID
        db_pool: Database connection pool
    
    Returns:
        Dict mapping user_id to total contribution
    """
    if not db_pool:
        return {}
    
    try:
        async with db_pool.acquire() as conn:
            query = """
                SELECT 
                    t.user_id,
                    COALESCE(SUM(t.amount), 0) as total_contribution
                FROM transactions t
                WHERE t.group_id = $1
                AND t.type = 'credit'
                GROUP BY t.user_id
            """
            rows = await conn.fetch(query, group_id)
            return {row["user_id"]: float(row["total_contribution"]) for row in rows}
    except Exception as e:
        logger.exception(f"Failed to calculate contributions: {e}")
        return {}


async def get_pending_splits(
    group_id: str,
    db_pool: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieve pending split bill payments for group.
    
    Args:
        group_id: Group ID
        db_pool: Database connection pool
    
    Returns:
        List of pending split dictionaries
    """
    if not db_pool:
        return []
    
    try:
        async with db_pool.acquire() as conn:
            query = """
                SELECT 
                    sb.id, sb.bill_name, sb.total_amount,
                    sb.created_at, sb.status,
                    json_agg(json_build_object(
                        'user_id', sp.user_id,
                        'user_name', u.name,
                        'amount', sp.amount,
                        'paid', sp.paid
                    )) as participants
                FROM split_bills sb
                JOIN split_participants sp ON sp.split_id = sb.id
                JOIN users u ON u.id = sp.user_id
                WHERE sb.group_id = $1
                AND sb.status != 'complete'
                GROUP BY sb.id
                ORDER BY sb.created_at DESC
            """
            rows = await conn.fetch(query, group_id)
            return [dict(row) for row in rows]
    except Exception as e:
        logger.exception(f"Failed to fetch pending splits: {e}")
        return []


async def suggest_split_method(
    total_amount: float,
    members: List[Dict[str, Any]],
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Suggest appropriate split method based on context.
    
    Args:
        total_amount: Total amount to split
        members: List of member dictionaries
        context: Additional context (purpose, preferences)
    
    Returns:
        Split method recommendation
    """
    member_count = len([m for m in members if m.get("status") == "active"])
    
    if member_count == 0:
        return {
            "method": "none",
            "error": "No active members to split bill",
        }
    
    # Default to equal split
    method = "equal"
    per_person = total_amount / member_count
    
    splits = {}
    for member in members:
        if member.get("status") == "active":
            splits[member["user_id"]] = per_person
    
    # Check context for custom split hints
    if context:
        purpose = context.get("purpose", "").lower()
        
        # Suggest percentage split for rent based on room sizes
        if "rent" in purpose and context.get("room_sizes"):
            method = "percentage"
            # Would calculate based on room sizes
        
        # Suggest custom split for unequal consumption
        elif "groceries" in purpose or "restaurant" in purpose:
            if context.get("consumption_differs"):
                method = "custom"
    
    return {
        "method": method,
        "total_amount": total_amount,
        "member_count": member_count,
        "per_person": per_person if method == "equal" else None,
        "splits": splits,
        "recommendation": f"Split N${total_amount:.2f} equally: N${per_person:.2f} per person" if method == "equal" else f"Use {method} split for fairness",
    }


async def check_member_permissions(
    user_id: str,
    group_id: str,
    required_role: str = "member",
    db_pool: Optional[Any] = None,
) -> bool:
    """
    Check if user has required permissions in group.
    
    Args:
        user_id: User ID
        group_id: Group ID
        required_role: "member" or "admin"
        db_pool: Database connection pool
    
    Returns:
        True if user has required permissions
    """
    if not db_pool:
        return False
    
    try:
        async with db_pool.acquire() as conn:
            query = """
                SELECT role
                FROM group_members
                WHERE user_id = $1 AND group_id = $2 AND status = 'active'
            """
            row = await conn.fetchrow(query, user_id, group_id)
            
            if not row:
                return False
            
            user_role = row["role"]
            
            # Admin has all permissions
            if user_role == "admin":
                return True
            
            # Member only has member permissions
            if required_role == "member" and user_role == "member":
                return True
            
            return False
    except Exception as e:
        logger.exception(f"Failed to check permissions: {e}")
        return False


async def calculate_settlement(
    user_id: str,
    group_id: str,
    db_pool: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Calculate settlement amount when member leaves group.
    
    Args:
        user_id: User ID leaving group
        group_id: Group ID
        db_pool: Database connection pool
    
    Returns:
        Settlement details
    """
    if not db_pool:
        return {
            "total_contributed": 0.0,
            "fair_share": 0.0,
            "settlement": 0.0,
            "direction": "none",
        }
    
    try:
        async with db_pool.acquire() as conn:
            # Get member's total contributions
            contrib_query = """
                SELECT COALESCE(SUM(amount), 0) as total
                FROM transactions
                WHERE user_id = $1 AND group_id = $2 AND type = 'credit'
            """
            contrib_row = await conn.fetchrow(contrib_query, user_id, group_id)
            total_contributed = float(contrib_row["total"]) if contrib_row else 0.0
            
            # Get total group expenses
            expense_query = """
                SELECT COALESCE(SUM(ABS(amount)), 0) as total
                FROM transactions
                WHERE group_id = $1 AND type = 'debit'
            """
            expense_row = await conn.fetchrow(expense_query, group_id)
            total_expenses = float(expense_row["total"]) if expense_row else 0.0
            
            # Get member count
            member_query = """
                SELECT COUNT(*) as count
                FROM group_members
                WHERE group_id = $1 AND status = 'active'
            """
            member_row = await conn.fetchrow(member_query, group_id)
            member_count = int(member_row["count"]) if member_row else 1
            
            # Calculate fair share of expenses
            fair_share = total_expenses / member_count if member_count > 0 else 0.0
            
            # Settlement: What member contributed - their fair share
            settlement = total_contributed - fair_share
            
            # Determine direction
            if abs(settlement) < 1.0:  # Less than N$1 difference
                direction = "settled"
            elif settlement > 0:
                direction = "refund"  # Group owes member
            else:
                direction = "payment"  # Member owes group
            
            return {
                "total_contributed": total_contributed,
                "fair_share": fair_share,
                "settlement": abs(settlement),
                "direction": direction,
                "message": {
                    "settled": "You're all settled up!",
                    "refund": f"Group owes you N${abs(settlement):.2f}",
                    "payment": f"You owe the group N${abs(settlement):.2f}",
                }.get(direction, ""),
            }
    except Exception as e:
        logger.exception(f"Failed to calculate settlement: {e}")
        return {
            "total_contributed": 0.0,
            "fair_share": 0.0,
            "settlement": 0.0,
            "direction": "error",
        }
