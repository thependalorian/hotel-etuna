"""
Tools for the Savings Advisor agent.

Location: backend_python/smartpay_ai/agents/savings_advisor/tools.py
Purpose: Savings goal tracking and recommendation utilities.
"""

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


async def get_savings_goals(
    user_id: str,
    db_pool: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieve user's active savings goals.
    
    Args:
        user_id: User ID
        db_pool: Database connection pool
    
    Returns:
        List of savings goal dictionaries
    """
    if not db_pool:
        logger.warning("No database pool provided, returning empty goals")
        return []
    
    try:
        async with db_pool.acquire() as conn:
            query = """
                SELECT 
                    id, name, target_amount, current_amount, deadline,
                    priority, category, created_at
                FROM savings_goals
                WHERE user_id = $1 AND status = 'active'
                ORDER BY priority DESC, deadline ASC
            """
            rows = await conn.fetch(query, user_id)
            return [dict(row) for row in rows]
    except Exception as e:
        logger.exception(f"Failed to fetch savings goals: {e}")
        return []


async def calculate_savings_rate(
    user_id: str,
    period: str = "month",
    db_pool: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Calculate user's savings rate from transaction history.
    
    Args:
        user_id: User ID
        period: Analysis period
        db_pool: Database connection pool
    
    Returns:
        Dict with total_saved, monthly_average, savings_ratio
    """
    if not db_pool:
        return {"total_saved": 0.0, "monthly_average": 0.0, "savings_ratio": 0.0}
    
    period_map = {"week": 7, "month": 30, "quarter": 90, "year": 365}
    days = period_map.get(period, 30)
    start_date = datetime.now() - timedelta(days=days)
    
    try:
        async with db_pool.acquire() as conn:
            # Get savings transactions (transfers to savings wallets)
            savings_query = """
                SELECT COALESCE(SUM(amount), 0) as total_saved
                FROM transactions
                WHERE user_id = $1 
                AND created_at >= $2
                AND (
                    category = 'Savings'
                    OR wallet_id IN (
                        SELECT id FROM wallets 
                        WHERE user_id = $1 AND type = 'savings'
                    )
                )
            """
            savings_row = await conn.fetchrow(savings_query, user_id, start_date)
            total_saved = float(savings_row["total_saved"]) if savings_row else 0.0
            
            # Get total income
            income_query = """
                SELECT COALESCE(SUM(amount), 0) as total_income
                FROM transactions
                WHERE user_id = $1 
                AND created_at >= $2
                AND type = 'credit'
            """
            income_row = await conn.fetchrow(income_query, user_id, start_date)
            total_income = float(income_row["total_income"]) if income_row else 0.0
            
            # Calculate metrics
            months = days / 30
            monthly_average = total_saved / months if months > 0 else 0.0
            savings_ratio = (total_saved / total_income * 100) if total_income > 0 else 0.0
            
            return {
                "total_saved": total_saved,
                "monthly_average": monthly_average,
                "savings_ratio": savings_ratio,
                "total_income": total_income,
            }
    except Exception as e:
        logger.exception(f"Failed to calculate savings rate: {e}")
        return {"total_saved": 0.0, "monthly_average": 0.0, "savings_ratio": 0.0}


async def identify_savings_opportunities(
    user_id: str,
    db_pool: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """
    Identify areas where user can save money.
    
    Args:
        user_id: User ID
        db_pool: Database connection pool
    
    Returns:
        List of savings opportunities with potential_savings
    """
    opportunities = []
    
    if not db_pool:
        return opportunities
    
    try:
        async with db_pool.acquire() as conn:
            # Check for high entertainment spending
            ent_query = """
                SELECT COALESCE(SUM(amount), 0) as total
                FROM transactions
                WHERE user_id = $1 
                AND created_at >= NOW() - INTERVAL '30 days'
                AND category = 'Entertainment'
                AND type = 'debit'
            """
            ent_row = await conn.fetchrow(ent_query, user_id)
            entertainment_spend = abs(float(ent_row["total"])) if ent_row else 0.0
            
            if entertainment_spend > 1000:
                opportunities.append({
                    "category": "Entertainment",
                    "current_spending": entertainment_spend,
                    "potential_savings": entertainment_spend * 0.3,
                    "suggestion": "Reduce entertainment spending by 30% through free activities and home entertainment",
                })
            
            # Check for dining out
            dining_query = """
                SELECT COALESCE(SUM(amount), 0) as total
                FROM transactions
                WHERE user_id = $1 
                AND created_at >= NOW() - INTERVAL '30 days'
                AND category = 'Dining'
                AND type = 'debit'
            """
            dining_row = await conn.fetchrow(dining_query, user_id)
            dining_spend = abs(float(dining_row["total"])) if dining_row else 0.0
            
            if dining_spend > 800:
                opportunities.append({
                    "category": "Dining",
                    "current_spending": dining_spend,
                    "potential_savings": dining_spend * 0.4,
                    "suggestion": "Cook at home 3 more days per week to save 40% on dining costs",
                })
            
            # Check for subscriptions
            sub_query = """
                SELECT COALESCE(COUNT(*), 0) as count, COALESCE(SUM(amount), 0) as total
                FROM transactions
                WHERE user_id = $1 
                AND created_at >= NOW() - INTERVAL '30 days'
                AND description LIKE '%subscription%'
                AND type = 'debit'
            """
            sub_row = await conn.fetchrow(sub_query, user_id)
            subscription_count = int(sub_row["count"]) if sub_row else 0
            subscription_total = abs(float(sub_row["total"])) if sub_row else 0.0
            
            if subscription_count > 3:
                opportunities.append({
                    "category": "Subscriptions",
                    "current_spending": subscription_total,
                    "potential_savings": subscription_total * 0.5,
                    "suggestion": f"Review your {subscription_count} subscriptions and cancel unused ones",
                })
    except Exception as e:
        logger.exception(f"Failed to identify savings opportunities: {e}")
    
    return opportunities


async def project_goal_completion(
    goal: Dict[str, Any],
    monthly_savings: float,
) -> Dict[str, Any]:
    """
    Project when a savings goal will be completed.
    
    Args:
        goal: Savings goal dictionary
        monthly_savings: User's average monthly savings
    
    Returns:
        Dict with projected_date, months_remaining, on_track
    """
    target_amount = float(goal.get("target_amount", 0))
    current_amount = float(goal.get("current_amount", 0))
    deadline_str = goal.get("deadline")
    
    remaining = target_amount - current_amount
    
    if remaining <= 0:
        return {
            "projected_date": datetime.now().isoformat(),
            "months_remaining": 0,
            "on_track": True,
            "status": "completed",
        }
    
    if monthly_savings <= 0:
        return {
            "projected_date": None,
            "months_remaining": None,
            "on_track": False,
            "status": "no_progress",
        }
    
    months_needed = remaining / monthly_savings
    projected_date = datetime.now() + timedelta(days=months_needed * 30)
    
    # Check if on track
    on_track = True
    if deadline_str:
        try:
            deadline = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
            on_track = projected_date <= deadline
        except:
            pass
    
    return {
        "projected_date": projected_date.isoformat(),
        "months_remaining": months_needed,
        "on_track": on_track,
        "status": "on_track" if on_track else "behind",
        "monthly_target": remaining / months_needed if months_needed > 0 else 0,
    }


async def check_emergency_fund(
    user_id: str,
    db_pool: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Check emergency fund adequacy based on monthly expenses.
    
    Args:
        user_id: User ID
        db_pool: Database connection pool
    
    Returns:
        Dict with status, current_amount, target_amount, months_covered
    """
    if not db_pool:
        return {
            "status": "unknown",
            "current_amount": 0.0,
            "target_amount": 0.0,
            "months_covered": 0.0,
        }
    
    try:
        async with db_pool.acquire() as conn:
            # Get emergency fund balance
            ef_query = """
                SELECT COALESCE(SUM(balance), 0) as total
                FROM wallets
                WHERE user_id = $1 
                AND (name ILIKE '%emergency%' OR category = 'emergency')
            """
            ef_row = await conn.fetchrow(ef_query, user_id)
            emergency_fund = float(ef_row["total"]) if ef_row else 0.0
            
            # Calculate average monthly expenses
            expense_query = """
                SELECT COALESCE(AVG(monthly_total), 0) as avg_monthly
                FROM (
                    SELECT 
                        DATE_TRUNC('month', created_at) as month,
                        SUM(ABS(amount)) as monthly_total
                    FROM transactions
                    WHERE user_id = $1 
                    AND type = 'debit'
                    AND created_at >= NOW() - INTERVAL '6 months'
                    GROUP BY DATE_TRUNC('month', created_at)
                ) monthly_expenses
            """
            expense_row = await conn.fetchrow(expense_query, user_id)
            avg_monthly_expense = float(expense_row["avg_monthly"]) if expense_row else 0.0
            
            # Calculate metrics
            target_amount = avg_monthly_expense * 6  # 6 months of expenses
            months_covered = emergency_fund / avg_monthly_expense if avg_monthly_expense > 0 else 0.0
            
            # Determine status
            if months_covered >= 6:
                status = "excellent"
            elif months_covered >= 3:
                status = "good"
            elif months_covered >= 1:
                status = "fair"
            else:
                status = "critical"
            
            return {
                "status": status,
                "current_amount": emergency_fund,
                "target_amount": target_amount,
                "months_covered": months_covered,
                "percentage": (emergency_fund / target_amount * 100) if target_amount > 0 else 0.0,
            }
    except Exception as e:
        logger.exception(f"Failed to check emergency fund: {e}")
        return {
            "status": "unknown",
            "current_amount": 0.0,
            "target_amount": 0.0,
            "months_covered": 0.0,
        }
