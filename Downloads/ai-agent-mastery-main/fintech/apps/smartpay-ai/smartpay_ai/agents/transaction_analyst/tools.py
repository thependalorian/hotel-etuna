"""
Tools for the Transaction Analyst agent.

Location: backend_python/smartpay_ai/agents/transaction_analyst/tools.py
Purpose: Transaction data retrieval and analysis utilities.
"""

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


async def get_transactions(
    user_id: str,
    period: str = "month",
    category: Optional[str] = None,
    db_pool: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieve user transactions for analysis period.
    
    Args:
        user_id: User ID
        period: "week", "month", "quarter", "year"
        category: Optional category filter
        db_pool: Database connection pool
    
    Returns:
        List of transaction dictionaries
    
    NOTE: Migrated to use TransactionRepository for reusable query patterns.
    See: smartpay_ai/repositories/transaction_repository.py
    """
    if not db_pool:
        logger.warning("No database pool provided, returning empty transactions")
        return []
    
    # Calculate date range
    period_map = {
        "week": 7,
        "month": 30,
        "quarter": 90,
        "year": 365,
    }
    days = period_map.get(period, 30)
    
    try:
        from smartpay_ai.repositories import TransactionRepository
        
        txn_repo = TransactionRepository(db_pool)
        
        # Use repository method (eliminates duplicate query)
        return await txn_repo.get_transactions_by_user(
            user_id=user_id,
            period_days=days,
            category=category
        )
    except Exception as e:
        logger.exception(f"Failed to fetch transactions: {e}")
        return []


async def calculate_category_totals(
    transactions: List[Dict[str, Any]]
) -> Dict[str, Dict[str, Any]]:
    """
    Calculate totals by category.
    
    Args:
        transactions: List of transaction dictionaries
    
    Returns:
        Dict mapping category to {amount, count, percentage}
    """
    category_data: Dict[str, Dict[str, Any]] = {}
    total = 0.0
    
    for txn in transactions:
        if txn.get("type") == "debit":
            category = txn.get("category", "Other")
            amount = abs(float(txn.get("amount", 0)))
            
            if category not in category_data:
                category_data[category] = {"amount": 0.0, "count": 0}
            
            category_data[category]["amount"] += amount
            category_data[category]["count"] += 1
            total += amount
    
    # Calculate percentages
    for category, data in category_data.items():
        data["percentage"] = (data["amount"] / total * 100) if total > 0 else 0.0
    
    return category_data


async def detect_anomalies(
    transactions: List[Dict[str, Any]],
    threshold_multiplier: float = 2.0,
) -> List[Dict[str, Any]]:
    """
    Detect anomalous transactions (unusually high amounts).
    
    Args:
        transactions: List of transaction dictionaries
        threshold_multiplier: How many standard deviations above average
    
    Returns:
        List of anomalous transactions with reason
    """
    if not transactions:
        return []
    
    # Calculate average by category
    category_averages: Dict[str, float] = {}
    category_counts: Dict[str, int] = {}
    
    for txn in transactions:
        if txn.get("type") == "debit":
            category = txn.get("category", "Other")
            amount = abs(float(txn.get("amount", 0)))
            
            if category not in category_averages:
                category_averages[category] = 0.0
                category_counts[category] = 0
            
            category_averages[category] += amount
            category_counts[category] += 1
    
    for category in category_averages:
        if category_counts[category] > 0:
            category_averages[category] /= category_counts[category]
    
    # Find anomalies
    anomalies = []
    for txn in transactions:
        if txn.get("type") == "debit":
            category = txn.get("category", "Other")
            amount = abs(float(txn.get("amount", 0)))
            avg = category_averages.get(category, 0)
            
            if avg > 0 and amount > (avg * threshold_multiplier):
                anomalies.append({
                    "transaction": txn,
                    "reason": f"Amount N${amount:.2f} is {amount/avg:.1f}x higher than your average {category} spending (N${avg:.2f})",
                    "severity": "high" if amount > (avg * 3) else "medium",
                })
    
    return anomalies


async def generate_budget(
    total_income: float,
    category_spending: Dict[str, float],
) -> Dict[str, float]:
    """
    Generate budget recommendations using 50/30/20 rule.
    
    Args:
        total_income: User's monthly income
        category_spending: Current spending by category
    
    Returns:
        Dict mapping category to recommended budget
    """
    # Define category groups
    needs_categories = {"Food", "Transport", "Bills", "Healthcare", "Education", "Housing"}
    wants_categories = {"Entertainment", "Shopping", "Dining", "Hobbies"}
    savings_categories = {"Savings", "Investment", "Emergency Fund"}
    
    # Calculate recommended allocations (50/30/20 rule)
    needs_budget = total_income * 0.50
    wants_budget = total_income * 0.30
    savings_budget = total_income * 0.20
    
    # Distribute within category groups
    budget = {}
    
    # Needs (split equally among needs categories user is spending on)
    user_needs = [cat for cat in category_spending if cat in needs_categories]
    if user_needs:
        per_need = needs_budget / len(user_needs)
        for cat in user_needs:
            budget[cat] = per_need
    
    # Wants (split equally among wants categories user is spending on)
    user_wants = [cat for cat in category_spending if cat in wants_categories]
    if user_wants:
        per_want = wants_budget / len(user_wants)
        for cat in user_wants:
            budget[cat] = per_want
    
    # Savings (full allocation)
    budget["Savings"] = savings_budget
    
    return budget


async def get_top_merchants(
    user_id: str,
    db_pool: Optional[Any] = None,
    period_days: int = 30,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    Get top merchants by total spending.
    
    Args:
        user_id: User ID
        db_pool: Database connection pool
        period_days: Analysis period
        limit: Number of top merchants to return
    
    Returns:
        List of {merchant, amount, count} sorted by amount
    
    NOTE: Migrated to use TransactionRepository for database-level aggregation.
    This is more efficient than in-memory aggregation of all transactions.
    See: smartpay_ai/repositories/transaction_repository.py
    """
    if not db_pool:
        return []
    
    try:
        from smartpay_ai.repositories import TransactionRepository
        
        txn_repo = TransactionRepository(db_pool)
        
        # Use repository method for efficient database-level aggregation
        merchants = await txn_repo.get_merchant_spending(
            user_id=user_id,
            period_days=period_days,
            limit=limit
        )
        
        # Convert to expected format
        return [
            {
                "merchant": m["merchant"],
                "amount": m["total_amount"],
                "count": m["transaction_count"]
            }
            for m in merchants
        ]
    except Exception as e:
        logger.exception(f"Failed to get top merchants: {e}")
        return []


async def calculate_spending_trend(
    current_total: float,
    previous_total: float,
) -> tuple[str, float]:
    """
    Calculate spending trend compared to previous period.
    
    Args:
        current_total: Total spending in current period
        previous_total: Total spending in previous period
    
    Returns:
        Tuple of (trend, percentage_change)
        trend: "increasing", "decreasing", "stable"
    """
    if previous_total == 0:
        return ("stable", 0.0)
    
    percentage_change = ((current_total - previous_total) / previous_total) * 100
    
    if abs(percentage_change) < 5:
        trend = "stable"
    elif percentage_change > 0:
        trend = "increasing"
    else:
        trend = "decreasing"
    
    return (trend, percentage_change)
