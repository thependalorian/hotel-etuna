"""
Spending Analytics Engine using DuckDB

Location: backend_python/smartpay_ai/analytics/spending_analytics.py
Purpose: Aggregate user spending patterns, category analysis, time-series trends, budget variance
Usage: Feeds Transaction Analyst agent with spending insights
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from decimal import Decimal

import duckdb
import pandas as pd

logger = logging.getLogger(__name__)


class SpendingAnalytics:
    """Fast spending analytics using DuckDB for OLAP queries"""

    def __init__(self, db_path: str = ":memory:"):
        """
        Initialize DuckDB connection for analytics
        
        Args:
            db_path: Path to DuckDB database file (default: in-memory)
        """
        self.db_path = db_path
        self.conn = duckdb.connect(db_path)
        self._init_schema()
        logger.info(f"SpendingAnalytics initialized with DuckDB at {db_path}")

    def _init_schema(self):
        """Initialize DuckDB schema for spending analytics"""
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id VARCHAR PRIMARY KEY,
                user_id VARCHAR NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                category VARCHAR,
                merchant VARCHAR,
                merchant_location VARCHAR,
                timestamp TIMESTAMP NOT NULL,
                wallet_id VARCHAR,
                status VARCHAR DEFAULT 'completed',
                device_id VARCHAR,
                ip_address VARCHAR,
                currency VARCHAR DEFAULT 'NAD'
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS user_spending_patterns (
                user_id VARCHAR,
                month DATE,
                total_spending DECIMAL(10,2),
                transaction_count INTEGER,
                top_category VARCHAR,
                avg_transaction DECIMAL(10,2),
                category_distribution JSON,
                PRIMARY KEY (user_id, month)
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS budget_limits (
                user_id VARCHAR,
                category VARCHAR,
                monthly_limit DECIMAL(10,2),
                currency VARCHAR DEFAULT 'NAD',
                PRIMARY KEY (user_id, category)
            )
        """)

        logger.info("DuckDB schema initialized for spending analytics")

    def load_transactions_from_postgres(self, pg_conn_string: str, days_back: int = 90):
        """
        Load transaction data from PostgreSQL into DuckDB for analytics
        
        Args:
            pg_conn_string: PostgreSQL connection string
            days_back: Number of days of historical data to load
        """
        import asyncpg
        import asyncio

        async def _load():
            conn = await asyncpg.connect(pg_conn_string)
            try:
                cutoff_date = datetime.now() - timedelta(days=days_back)
                rows = await conn.fetch("""
                    SELECT 
                        id,
                        user_id,
                        amount,
                        category,
                        merchant,
                        created_at as timestamp,
                        wallet_id,
                        status
                    FROM transactions
                    WHERE created_at >= $1
                    ORDER BY created_at DESC
                """, cutoff_date)

                if rows:
                    df = pd.DataFrame([dict(row) for row in rows])
                    self.conn.execute("DELETE FROM transactions")
                    self.conn.register('transactions_df', df)
                    self.conn.execute("""
                        INSERT INTO transactions 
                        SELECT * FROM transactions_df
                    """)
                    logger.info(f"Loaded {len(rows)} transactions from PostgreSQL")
                else:
                    logger.warning("No transactions found in PostgreSQL")
            finally:
                await conn.close()

        asyncio.run(_load())

    def load_transactions_from_dataframe(self, df: pd.DataFrame):
        """
        Load transactions from pandas DataFrame
        
        Args:
            df: DataFrame with transaction columns
        """
        self.conn.execute("DELETE FROM transactions")
        self.conn.register('transactions_df', df)
        
        # Select columns explicitly to match schema
        self.conn.execute("""
            INSERT INTO transactions 
            (id, user_id, amount, category, merchant, merchant_location, 
             timestamp, wallet_id, status, device_id, ip_address, currency)
            SELECT 
                id, user_id, amount, category, merchant,
                COALESCE(merchant_location, 'unknown') as merchant_location,
                timestamp, wallet_id, status,
                COALESCE(device_id, 'unknown') as device_id,
                COALESCE(ip_address, 'unknown') as ip_address,
                COALESCE(currency, 'NAD') as currency
            FROM transactions_df
        """)
        logger.info(f"Loaded {len(df)} transactions from DataFrame")

    def aggregate_user_spending(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Aggregate spending patterns for a user
        
        Args:
            user_id: User identifier
            days: Number of days to analyze
            
        Returns:
            Dict with spending metrics
        """
        cutoff = datetime.now() - timedelta(days=days)

        result = self.conn.execute("""
            SELECT 
                COUNT(*) as transaction_count,
                SUM(amount) as total_spending,
                AVG(amount) as avg_transaction,
                MIN(amount) as min_transaction,
                MAX(amount) as max_transaction,
                COUNT(DISTINCT category) as unique_categories,
                COUNT(DISTINCT merchant) as unique_merchants
            FROM transactions
            WHERE user_id = ?
              AND timestamp >= ?
              AND status = 'completed'
        """, [user_id, cutoff]).fetchone()

        if not result or result[1] is None:
            return {
                "user_id": user_id,
                "period_days": days,
                "transaction_count": 0,
                "total_spending": 0.0,
                "avg_transaction": 0.0,
                "min_transaction": 0.0,
                "max_transaction": 0.0,
                "unique_categories": 0,
                "unique_merchants": 0
            }

        return {
            "user_id": user_id,
            "period_days": days,
            "transaction_count": result[0],
            "total_spending": float(result[1]),
            "avg_transaction": float(result[2]),
            "min_transaction": float(result[3]),
            "max_transaction": float(result[4]),
            "unique_categories": result[5],
            "unique_merchants": result[6]
        }

    def category_spending_breakdown(self, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """
        Break down spending by category
        
        Args:
            user_id: User identifier
            days: Analysis period
            
        Returns:
            List of category spending breakdown
        """
        cutoff = datetime.now() - timedelta(days=days)

        results = self.conn.execute("""
            SELECT 
                category,
                COUNT(*) as transaction_count,
                SUM(amount) as total_amount,
                AVG(amount) as avg_amount,
                MIN(amount) as min_amount,
                MAX(amount) as max_amount,
                SUM(amount) * 100.0 / (
                    SELECT SUM(amount) 
                    FROM transactions 
                    WHERE user_id = ? AND timestamp >= ? AND status = 'completed'
                ) as percentage
            FROM transactions
            WHERE user_id = ?
              AND timestamp >= ?
              AND status = 'completed'
            GROUP BY category
            ORDER BY total_amount DESC
        """, [user_id, cutoff, user_id, cutoff]).fetchall()

        return [
            {
                "category": row[0] or "uncategorized",
                "transaction_count": row[1],
                "total_amount": float(row[2]),
                "avg_amount": float(row[3]),
                "min_amount": float(row[4]),
                "max_amount": float(row[5]),
                "percentage": float(row[6]) if row[6] else 0.0
            }
            for row in results
        ]

    def time_series_spending(self, user_id: str, days: int = 30, interval: str = "day") -> List[Dict[str, Any]]:
        """
        Generate time-series spending trends
        
        Args:
            user_id: User identifier
            days: Analysis period
            interval: Aggregation interval ('day', 'week', 'month')
            
        Returns:
            Time-series data points
        """
        cutoff = datetime.now() - timedelta(days=days)

        if interval == "day":
            trunc_func = "DATE_TRUNC('day', timestamp)"
        elif interval == "week":
            trunc_func = "DATE_TRUNC('week', timestamp)"
        else:  # month
            trunc_func = "DATE_TRUNC('month', timestamp)"

        results = self.conn.execute(f"""
            SELECT 
                {trunc_func} as period,
                COUNT(*) as transaction_count,
                SUM(amount) as total_amount,
                AVG(amount) as avg_amount
            FROM transactions
            WHERE user_id = ?
              AND timestamp >= ?
              AND status = 'completed'
            GROUP BY period
            ORDER BY period
        """, [user_id, cutoff]).fetchall()

        return [
            {
                "period": row[0].isoformat() if row[0] else None,
                "transaction_count": row[1],
                "total_amount": float(row[2]),
                "avg_amount": float(row[3])
            }
            for row in results
        ]

    def budget_variance_analysis(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Analyze budget variance by category
        
        Args:
            user_id: User identifier
            
        Returns:
            Budget variance by category
        """
        current_month = datetime.now().replace(day=1)

        results = self.conn.execute("""
            WITH monthly_spending AS (
                SELECT 
                    category,
                    SUM(amount) as spent
                FROM transactions
                WHERE user_id = ?
                  AND timestamp >= ?
                  AND status = 'completed'
                GROUP BY category
            )
            SELECT 
                b.category,
                b.monthly_limit,
                COALESCE(ms.spent, 0) as spent,
                b.monthly_limit - COALESCE(ms.spent, 0) as remaining,
                (COALESCE(ms.spent, 0) * 100.0 / b.monthly_limit) as utilization_pct
            FROM budget_limits b
            LEFT JOIN monthly_spending ms ON b.category = ms.category
            WHERE b.user_id = ?
            ORDER BY utilization_pct DESC
        """, [user_id, current_month, user_id]).fetchall()

        return [
            {
                "category": row[0],
                "budget_limit": float(row[1]),
                "spent": float(row[2]),
                "remaining": float(row[3]),
                "utilization_percentage": float(row[4]),
                "status": "exceeded" if row[4] > 100 else "warning" if row[4] > 80 else "normal"
            }
            for row in results
        ]

    def materialize_spending_patterns(self):
        """
        Materialize user spending patterns into summary table for fast agent queries
        """
        self.conn.execute("""
            INSERT OR REPLACE INTO user_spending_patterns
            SELECT 
                user_id,
                DATE_TRUNC('month', timestamp) as month,
                SUM(amount) as total_spending,
                COUNT(*) as transaction_count,
                (
                    SELECT category 
                    FROM transactions t2 
                    WHERE t2.user_id = t1.user_id 
                      AND DATE_TRUNC('month', t2.timestamp) = DATE_TRUNC('month', t1.timestamp)
                    GROUP BY category 
                    ORDER BY SUM(amount) DESC 
                    LIMIT 1
                ) as top_category,
                AVG(amount) as avg_transaction,
                JSON_OBJECT(
                    'categories', 
                    LIST(
                        SELECT JSON_OBJECT(
                            'category', category,
                            'amount', SUM(amount)
                        )
                        FROM transactions t2
                        WHERE t2.user_id = t1.user_id
                          AND DATE_TRUNC('month', t2.timestamp) = DATE_TRUNC('month', t1.timestamp)
                        GROUP BY category
                    )
                ) as category_distribution
            FROM transactions t1
            WHERE status = 'completed'
            GROUP BY user_id, DATE_TRUNC('month', timestamp)
        """)

        count = self.conn.execute("SELECT COUNT(*) FROM user_spending_patterns").fetchone()[0]
        logger.info(f"Materialized {count} user spending patterns")

    def export_insights_for_agent(self, user_id: str) -> Dict[str, Any]:
        """
        Export comprehensive spending insights for Transaction Analyst agent
        
        Args:
            user_id: User identifier
            
        Returns:
            Complete spending analysis for agent consumption
        """
        return {
            "user_id": user_id,
            "overall_metrics": self.aggregate_user_spending(user_id, days=30),
            "category_breakdown": self.category_spending_breakdown(user_id, days=30),
            "time_series": self.time_series_spending(user_id, days=30, interval="day"),
            "budget_variance": self.budget_variance_analysis(user_id),
            "generated_at": datetime.now().isoformat()
        }

    def close(self):
        """Close DuckDB connection"""
        self.conn.close()
        logger.info("SpendingAnalytics connection closed")
