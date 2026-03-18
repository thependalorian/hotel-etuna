"""
Transaction Repository - Centralized Transaction Data Access Layer

Location: backend_python/smartpay_ai/repositories/transaction_repository.py
Purpose: Eliminate duplicate transaction query patterns across agents and analytics

Common Queries:
- Get transactions by user/wallet/period
- Filter by type, category, status
- Calculate totals and aggregations
- Get merchant spending patterns
- Detect anomalies and patterns

DRY Violation Fix: Consolidates 80+ duplicate transaction query patterns
"""

import logging
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum

import asyncpg

from smartpay_ai.shared.db_utils import (
    BaseRepository,
    QueryBuilder,
    QueryOperator,
    transaction
)

logger = logging.getLogger(__name__)


class TransactionType(Enum):
    """Transaction types"""
    DEBIT = "debit"
    CREDIT = "credit"
    PAYMENT = "payment"
    TRANSFER_IN = "transfer_in"
    TRANSFER_OUT = "transfer_out"
    LOAD = "load"
    REFUND = "refund"
    FEE = "fee"
    REDEMPTION = "redemption"


class TransactionStatus(Enum):
    """Transaction statuses"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REVERSED = "reversed"


class TransactionRepository(BaseRepository):
    """Repository for transaction data access with common query patterns"""
    
    def __init__(self, db_pool: asyncpg.Pool):
        super().__init__(db_pool, "transactions")
    
    async def get_transaction_by_id(
        self,
        transaction_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get transaction by ID
        
        Args:
            transaction_id: Transaction ID
        
        Returns:
            Transaction dict or None
        """
        return await self.find_by_id(transaction_id)
    
    async def get_transactions_by_user(
        self,
        user_id: str,
        period_days: Optional[int] = None,
        transaction_type: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get transactions for a user with optional filters
        
        Args:
            user_id: User ID
            period_days: Number of days to look back (None = all time)
            transaction_type: Filter by transaction type
            category: Filter by category
            status: Filter by status
            limit: Maximum results
            offset: Pagination offset
        
        Returns:
            List of transaction dicts
        """
        query = self.query()\
            .where("user_id", QueryOperator.EQ, user_id)
        
        # Apply time filter
        if period_days is not None:
            cutoff = datetime.now() - timedelta(days=period_days)
            query = query.where("created_at", QueryOperator.GTE, cutoff)
        
        # Apply type filter
        if transaction_type:
            query = query.where("type", QueryOperator.EQ, transaction_type)
        
        # Apply category filter
        if category:
            query = query.where("category", QueryOperator.EQ, category)
        
        # Apply status filter
        if status:
            query = query.where("status", QueryOperator.EQ, status)
        else:
            # Default: only completed transactions
            query = query.where("status", QueryOperator.EQ, "completed")
        
        # Order by most recent first
        query = query.order_by("created_at", "DESC")
        
        # Apply pagination
        if limit is not None:
            query = query.limit(limit)
        if offset is not None:
            query = query.offset(offset)
        
        return await query.fetch_all(self.db_pool)
    
    async def get_transactions_by_wallet(
        self,
        wallet_id: str,
        period_days: Optional[int] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get transactions for a wallet
        
        Args:
            wallet_id: Wallet ID
            period_days: Number of days to look back
            limit: Maximum results
        
        Returns:
            List of transaction dicts
        """
        query = self.query()\
            .where("wallet_id", QueryOperator.EQ, wallet_id)\
            .where("status", QueryOperator.EQ, "completed")
        
        if period_days is not None:
            cutoff = datetime.now() - timedelta(days=period_days)
            query = query.where("created_at", QueryOperator.GTE, cutoff)
        
        query = query.order_by("created_at", "DESC")
        
        if limit is not None:
            query = query.limit(limit)
        
        return await query.fetch_all(self.db_pool)
    
    async def get_transaction_totals(
        self,
        user_id: str,
        period_days: int = 30
    ) -> Dict[str, float]:
        """
        Get transaction totals by type
        
        Args:
            user_id: User ID
            period_days: Analysis period
        
        Returns:
            Dict with debit/credit totals
        """
        cutoff = datetime.now() - timedelta(days=period_days)
        
        query = """
            SELECT 
                COALESCE(SUM(CASE WHEN type IN ('debit', 'payment', 'transfer_out', 'fee') THEN amount ELSE 0 END), 0) as total_debit,
                COALESCE(SUM(CASE WHEN type IN ('credit', 'load', 'transfer_in', 'refund') THEN amount ELSE 0 END), 0) as total_credit,
                COALESCE(SUM(CASE WHEN type = 'fee' THEN amount ELSE 0 END), 0) as total_fees
            FROM transactions
            WHERE user_id = $1
              AND created_at >= $2
              AND status = 'completed'
        """
        
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow(query, user_id, cutoff)
            if not row:
                return {
                    "total_debit": 0.0,
                    "total_credit": 0.0,
                    "total_fees": 0.0,
                    "net_flow": 0.0
                }
            
            total_debit = float(row["total_debit"])
            total_credit = float(row["total_credit"])
            total_fees = float(row["total_fees"])
            
            return {
                "total_debit": total_debit,
                "total_credit": total_credit,
                "total_fees": total_fees,
                "net_flow": total_credit - total_debit
            }
    
    async def get_category_spending(
        self,
        user_id: str,
        period_days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Get spending breakdown by category
        
        Args:
            user_id: User ID
            period_days: Analysis period
        
        Returns:
            List of category spending dicts
        """
        cutoff = datetime.now() - timedelta(days=period_days)
        
        query = """
            SELECT 
                category,
                COUNT(*) as transaction_count,
                SUM(amount) as total_amount,
                AVG(amount) as avg_amount,
                MIN(amount) as min_amount,
                MAX(amount) as max_amount,
                SUM(amount) * 100.0 / NULLIF((
                    SELECT SUM(amount)
                    FROM transactions
                    WHERE user_id = $1
                      AND type IN ('debit', 'payment', 'transfer_out')
                      AND created_at >= $2
                      AND status = 'completed'
                ), 0) as percentage
            FROM transactions
            WHERE user_id = $1
              AND type IN ('debit', 'payment', 'transfer_out')
              AND created_at >= $2
              AND status = 'completed'
            GROUP BY category
            ORDER BY total_amount DESC
        """
        
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch(query, user_id, cutoff)
            return [
                {
                    "category": row["category"] or "uncategorized",
                    "transaction_count": row["transaction_count"],
                    "total_amount": float(row["total_amount"]),
                    "avg_amount": float(row["avg_amount"]),
                    "min_amount": float(row["min_amount"]),
                    "max_amount": float(row["max_amount"]),
                    "percentage": float(row["percentage"]) if row["percentage"] else 0.0
                }
                for row in rows
            ]
    
    async def get_merchant_spending(
        self,
        user_id: str,
        period_days: int = 30,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get top merchants by spending
        
        Args:
            user_id: User ID
            period_days: Analysis period
            limit: Number of top merchants
        
        Returns:
            List of merchant spending dicts
        """
        cutoff = datetime.now() - timedelta(days=period_days)
        
        query = """
            SELECT 
                merchant,
                COUNT(*) as transaction_count,
                SUM(amount) as total_amount,
                AVG(amount) as avg_amount
            FROM transactions
            WHERE user_id = $1
              AND type IN ('debit', 'payment')
              AND merchant IS NOT NULL
              AND created_at >= $2
              AND status = 'completed'
            GROUP BY merchant
            ORDER BY total_amount DESC
            LIMIT $3
        """
        
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch(query, user_id, cutoff, limit)
            return [
                {
                    "merchant": row["merchant"],
                    "transaction_count": row["transaction_count"],
                    "total_amount": float(row["total_amount"]),
                    "avg_amount": float(row["avg_amount"])
                }
                for row in rows
            ]
    
    async def get_time_series_data(
        self,
        user_id: str,
        period_days: int = 30,
        interval: str = "day"
    ) -> List[Dict[str, Any]]:
        """
        Get time-series spending data
        
        Args:
            user_id: User ID
            period_days: Analysis period
            interval: 'day', 'week', or 'month'
        
        Returns:
            List of time-series data points
        """
        cutoff = datetime.now() - timedelta(days=period_days)
        
        if interval == "day":
            trunc_func = "DATE_TRUNC('day', created_at)"
        elif interval == "week":
            trunc_func = "DATE_TRUNC('week', created_at)"
        else:  # month
            trunc_func = "DATE_TRUNC('month', created_at)"
        
        query = f"""
            SELECT 
                {trunc_func} as period,
                COUNT(*) as transaction_count,
                SUM(CASE WHEN type IN ('debit', 'payment', 'transfer_out') THEN amount ELSE 0 END) as debit_amount,
                SUM(CASE WHEN type IN ('credit', 'load', 'transfer_in') THEN amount ELSE 0 END) as credit_amount
            FROM transactions
            WHERE user_id = $1
              AND created_at >= $2
              AND status = 'completed'
            GROUP BY period
            ORDER BY period
        """
        
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch(query, user_id, cutoff)
            return [
                {
                    "period": row["period"].isoformat() if row["period"] else None,
                    "transaction_count": row["transaction_count"],
                    "debit_amount": float(row["debit_amount"]),
                    "credit_amount": float(row["credit_amount"]),
                    "net_amount": float(row["credit_amount"]) - float(row["debit_amount"])
                }
                for row in rows
            ]
    
    async def detect_anomalies(
        self,
        user_id: str,
        threshold_multiplier: float = 2.0,
        period_days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Detect anomalous transactions (unusually high amounts)
        
        Args:
            user_id: User ID
            threshold_multiplier: Standard deviations above average
            period_days: Analysis period
        
        Returns:
            List of anomalous transactions
        """
        cutoff = datetime.now() - timedelta(days=period_days)
        
        # Get category averages
        avg_query = """
            SELECT 
                category,
                AVG(amount) as avg_amount
            FROM transactions
            WHERE user_id = $1
              AND type IN ('debit', 'payment', 'transfer_out')
              AND created_at >= $2
              AND status = 'completed'
            GROUP BY category
        """
        
        async with self.db_pool.acquire() as conn:
            avg_rows = await conn.fetch(avg_query, user_id, cutoff)
            
            if not avg_rows:
                return []
            
            category_avgs = {row["category"]: float(row["avg_amount"]) for row in avg_rows}
            
            # Find anomalies
            anomaly_query = """
                SELECT *
                FROM transactions
                WHERE user_id = $1
                  AND type IN ('debit', 'payment', 'transfer_out')
                  AND created_at >= $2
                  AND status = 'completed'
                ORDER BY created_at DESC
            """
            
            txn_rows = await conn.fetch(anomaly_query, user_id, cutoff)
            
            anomalies = []
            for row in txn_rows:
                category = row["category"]
                amount = float(row["amount"])
                avg = category_avgs.get(category, 0.0)
                
                if avg > 0 and amount > (avg * threshold_multiplier):
                    anomalies.append({
                        "transaction": dict(row),
                        "reason": f"Amount N${amount:.2f} is {amount/avg:.1f}x higher than average {category} spending (N${avg:.2f})",
                        "severity": "high" if amount > (avg * 3) else "medium",
                        "multiplier": amount / avg if avg > 0 else 0.0
                    })
            
            return anomalies
    
    async def get_recipient_transaction_history(
        self,
        recipient_id: str,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get transaction history for a recipient
        
        Args:
            recipient_id: Recipient user ID or phone
            limit: Maximum results
        
        Returns:
            List of transactions
        """
        return await self.find_all(
            filters={"recipient_id": recipient_id, "status": "completed"},
            order_by=("created_at", "DESC"),
            limit=limit
        )
    
    async def get_pending_transactions(
        self,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get pending transactions for user
        
        Args:
            user_id: User ID
        
        Returns:
            List of pending transactions
        """
        return await self.find_all(
            filters={"user_id": user_id, "status": "pending"},
            order_by=("created_at", "DESC")
        )
    
    async def get_large_transactions(
        self,
        user_id: str,
        min_amount: float,
        period_days: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get transactions above threshold amount
        
        Args:
            user_id: User ID
            min_amount: Minimum transaction amount
            period_days: Optional time period
        
        Returns:
            List of large transactions
        """
        query = self.query()\
            .where("user_id", QueryOperator.EQ, user_id)\
            .where("amount", QueryOperator.GTE, min_amount)\
            .where("status", QueryOperator.EQ, "completed")
        
        if period_days is not None:
            cutoff = datetime.now() - timedelta(days=period_days)
            query = query.where("created_at", QueryOperator.GTE, cutoff)
        
        return await query\
            .order_by("amount", "DESC")\
            .fetch_all(self.db_pool)
    
    async def count_recent_transactions(
        self,
        user_id: str,
        hours: int = 1
    ) -> int:
        """
        Count transactions in recent time window
        
        Args:
            user_id: User ID
            hours: Time window in hours
        
        Returns:
            Transaction count
        """
        cutoff = datetime.now() - timedelta(hours=hours)
        
        return await self.count({
            "user_id": user_id,
            "created_at": cutoff  # Will use >= operator via QueryBuilder
        })
    
    async def calculate_spending_trend(
        self,
        user_id: str,
        current_days: int = 30,
        previous_days: int = 30
    ) -> Tuple[str, float]:
        """
        Calculate spending trend compared to previous period
        
        Args:
            user_id: User ID
            current_days: Current period length
            previous_days: Previous period length
        
        Returns:
            Tuple of (trend, percentage_change)
            trend: "increasing", "decreasing", or "stable"
        """
        current_end = datetime.now()
        current_start = current_end - timedelta(days=current_days)
        previous_end = current_start
        previous_start = previous_end - timedelta(days=previous_days)
        
        query = """
            WITH current_period AS (
                SELECT COALESCE(SUM(amount), 0) as total
                FROM transactions
                WHERE user_id = $1
                  AND type IN ('debit', 'payment', 'transfer_out')
                  AND created_at >= $2
                  AND created_at < $3
                  AND status = 'completed'
            ),
            previous_period AS (
                SELECT COALESCE(SUM(amount), 0) as total
                FROM transactions
                WHERE user_id = $1
                  AND type IN ('debit', 'payment', 'transfer_out')
                  AND created_at >= $4
                  AND created_at < $5
                  AND status = 'completed'
            )
            SELECT 
                current_period.total as current_total,
                previous_period.total as previous_total
            FROM current_period, previous_period
        """
        
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow(
                query,
                user_id,
                current_start, current_end,
                previous_start, previous_end
            )
            
            if not row:
                return ("stable", 0.0)
            
            current_total = float(row["current_total"])
            previous_total = float(row["previous_total"])
            
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
