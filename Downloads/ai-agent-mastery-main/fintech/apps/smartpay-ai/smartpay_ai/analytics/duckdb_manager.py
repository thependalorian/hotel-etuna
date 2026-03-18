"""
DuckDB Analytics Manager

Location: backend_python/smartpay_ai/analytics/duckdb_manager.py
Purpose: Unified interface for all DuckDB analytics operations
Usage: Central manager for transaction, user, fraud, and group analytics
"""

import os
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from decimal import Decimal

import duckdb
import pandas as pd

from .spending_analytics import SpendingAnalytics
from .fraud_analytics import FraudAnalytics
from .group_analytics import GroupAnalytics

logger = logging.getLogger(__name__)


class DuckDBManager:
    """Unified DuckDB analytics manager for all Smartpay analytics"""

    def __init__(self, db_path: Optional[str] = None):
        """
        Initialize DuckDB Manager
        
        Args:
            db_path: Path to DuckDB database file. If None, uses default path.
        """
        if db_path is None:
            # Default path: data/analytics.duckdb
            project_root = Path(__file__).parent.parent.parent
            data_dir = project_root / "data"
            data_dir.mkdir(exist_ok=True)
            db_path = str(data_dir / "analytics.duckdb")
        
        self.db_path = db_path
        self.conn = duckdb.connect(db_path)
        
        # Initialize unified schema first
        self._init_unified_schema()
        
        # Initialize analytics modules with the same connection (skip their schema init)
        self.spending = SpendingAnalytics(db_path)
        self.fraud = FraudAnalytics(db_path)
        self.groups = GroupAnalytics(db_path)
        
        self._init_core_schema()
        
        logger.info(f"DuckDB Manager initialized at {db_path}")

    def _init_unified_schema(self):
        """Initialize unified transaction schema used by all analytics modules"""
        # Unified transactions table with all fields from fraud_analytics (most comprehensive)
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
        
        logger.info("Unified transactions schema initialized")

    def _init_core_schema(self):
        """Initialize core analytics schema"""
        # Create metadata table
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS etl_metadata (
                table_name VARCHAR PRIMARY KEY,
                last_sync_timestamp TIMESTAMP,
                rows_synced BIGINT,
                sync_status VARCHAR,
                error_message VARCHAR
            )
        """)
        
        # Create aggregated analytics tables
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS daily_transaction_summary (
                date DATE,
                total_transactions BIGINT,
                total_volume DECIMAL(15,2),
                avg_transaction DECIMAL(10,2),
                unique_users BIGINT,
                success_rate DECIMAL(5,2),
                PRIMARY KEY (date)
            )
        """)
        
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS user_activity_summary (
                user_id VARCHAR,
                date DATE,
                transaction_count INTEGER,
                total_spent DECIMAL(10,2),
                categories JSON,
                PRIMARY KEY (user_id, date)
            )
        """)
        
        logger.info("Core analytics schema initialized")

    def get_database_info(self) -> Dict[str, Any]:
        """Get DuckDB database information"""
        # Get database size
        db_size = os.path.getsize(self.db_path) if os.path.exists(self.db_path) else 0
        
        # Get table counts
        tables = self.conn.execute("""
            SELECT 
                table_name,
                (SELECT COUNT(*) FROM information_schema.tables t2 
                 WHERE t2.table_name = t.table_name) as row_count
            FROM information_schema.tables t
            WHERE table_schema = 'main'
            ORDER BY table_name
        """).fetchall()
        
        # Get ETL sync status
        etl_status = self.conn.execute("""
            SELECT 
                table_name,
                last_sync_timestamp,
                rows_synced,
                sync_status
            FROM etl_metadata
            ORDER BY last_sync_timestamp DESC
        """).fetchall()
        
        return {
            "database_path": self.db_path,
            "database_size_mb": round(db_size / (1024 * 1024), 2),
            "tables": [
                {"name": table[0], "estimated_rows": table[1]}
                for table in tables
            ],
            "etl_status": [
                {
                    "table": row[0],
                    "last_sync": row[1].isoformat() if row[1] else None,
                    "rows_synced": row[2],
                    "status": row[3]
                }
                for row in etl_status
            ]
        }

    def execute_query(self, query: str, params: Optional[List] = None) -> pd.DataFrame:
        """
        Execute a raw SQL query and return results as DataFrame
        
        Args:
            query: SQL query string
            params: Optional query parameters
            
        Returns:
            Query results as pandas DataFrame
        """
        try:
            if params:
                result = self.conn.execute(query, params).fetchdf()
            else:
                result = self.conn.execute(query).fetchdf()
            return result
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            raise

    def get_transaction_analytics(
        self,
        user_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get comprehensive transaction analytics
        
        Args:
            user_id: Filter by user
            start_date: Start date for analysis
            end_date: End date for analysis
            category: Filter by category
            
        Returns:
            Transaction analytics
        """
        if start_date is None:
            start_date = datetime.now() - timedelta(days=30)
        if end_date is None:
            end_date = datetime.now()
        
        # Build query with filters
        where_clauses = ["timestamp BETWEEN ? AND ?", "status = 'completed'"]
        params = [start_date, end_date]
        
        if user_id:
            where_clauses.append("user_id = ?")
            params.append(user_id)
        
        if category:
            where_clauses.append("category = ?")
            params.append(category)
        
        where_sql = " AND ".join(where_clauses)
        
        # Aggregate metrics
        metrics = self.conn.execute(f"""
            SELECT 
                COUNT(*) as transaction_count,
                SUM(amount) as total_volume,
                AVG(amount) as avg_amount,
                MIN(amount) as min_amount,
                MAX(amount) as max_amount,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT category) as unique_categories,
                COUNT(DISTINCT merchant) as unique_merchants
            FROM transactions
            WHERE {where_sql}
        """, params).fetchone()
        
        # Category breakdown
        category_breakdown = self.conn.execute(f"""
            SELECT 
                category,
                COUNT(*) as count,
                SUM(amount) as total,
                AVG(amount) as avg
            FROM transactions
            WHERE {where_sql}
            GROUP BY category
            ORDER BY total DESC
            LIMIT 10
        """, params).fetchall()
        
        # Time series
        time_series = self.conn.execute(f"""
            SELECT 
                DATE(timestamp) as date,
                COUNT(*) as count,
                SUM(amount) as total
            FROM transactions
            WHERE {where_sql}
            GROUP BY DATE(timestamp)
            ORDER BY date
        """, params).fetchall()
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "filters": {
                "user_id": user_id,
                "category": category
            },
            "metrics": {
                "transaction_count": metrics[0] if metrics else 0,
                "total_volume": float(metrics[1]) if metrics and metrics[1] else 0.0,
                "avg_amount": float(metrics[2]) if metrics and metrics[2] else 0.0,
                "min_amount": float(metrics[3]) if metrics and metrics[3] else 0.0,
                "max_amount": float(metrics[4]) if metrics and metrics[4] else 0.0,
                "unique_users": metrics[5] if metrics else 0,
                "unique_categories": metrics[6] if metrics else 0,
                "unique_merchants": metrics[7] if metrics else 0
            },
            "category_breakdown": [
                {
                    "category": row[0] or "uncategorized",
                    "count": row[1],
                    "total": float(row[2]),
                    "avg": float(row[3])
                }
                for row in category_breakdown
            ],
            "time_series": [
                {
                    "date": row[0].isoformat(),
                    "count": row[1],
                    "total": float(row[2])
                }
                for row in time_series
            ]
        }

    def get_user_analytics(
        self,
        user_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get comprehensive user analytics
        
        Args:
            user_id: User identifier
            days: Number of days to analyze
            
        Returns:
            User analytics including spending, fraud risk, and groups
        """
        return {
            "user_id": user_id,
            "period_days": days,
            "spending": self.spending.export_insights_for_agent(user_id),
            "fraud_risk": self.fraud.export_insights_for_agent(user_id),
            "generated_at": datetime.now().isoformat()
        }

    def get_fraud_analytics(
        self,
        user_id: Optional[str] = None,
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Get fraud analytics and risk patterns
        
        Args:
            user_id: Optional user filter
            days: Analysis period
            
        Returns:
            Fraud analytics
        """
        cutoff = datetime.now() - timedelta(days=days)
        
        # High-risk transactions
        high_risk_query = """
            SELECT 
                fe.transaction_id,
                t.user_id,
                t.amount,
                fe.risk_score,
                fe.flagged_reason,
                fe.timestamp
            FROM fraud_events fe
            JOIN transactions t ON fe.transaction_id = t.id
            WHERE fe.timestamp >= ?
              AND fe.risk_score >= 70
        """
        params = [cutoff]
        
        if user_id:
            high_risk_query += " AND t.user_id = ?"
            params.append(user_id)
        
        high_risk_query += " ORDER BY fe.risk_score DESC LIMIT 50"
        
        high_risk_txns = self.conn.execute(high_risk_query, params).fetchall()
        
        # Fraud statistics
        fraud_stats = self.conn.execute("""
            SELECT 
                COUNT(*) as total_flagged,
                SUM(CASE WHEN is_fraud THEN 1 ELSE 0 END) as confirmed_fraud,
                AVG(risk_score) as avg_risk_score,
                COUNT(CASE WHEN risk_score >= 70 THEN 1 END) as critical_risk_count
            FROM fraud_events
            WHERE timestamp >= ?
        """, [cutoff]).fetchone()
        
        return {
            "period_days": days,
            "user_id_filter": user_id,
            "statistics": {
                "total_flagged": fraud_stats[0] if fraud_stats else 0,
                "confirmed_fraud": fraud_stats[1] if fraud_stats else 0,
                "avg_risk_score": round(float(fraud_stats[2]), 2) if fraud_stats and fraud_stats[2] else 0.0,
                "critical_risk_count": fraud_stats[3] if fraud_stats else 0
            },
            "high_risk_transactions": [
                {
                    "transaction_id": row[0],
                    "user_id": row[1],
                    "amount": float(row[2]),
                    "risk_score": float(row[3]),
                    "reason": row[4],
                    "timestamp": row[5].isoformat() if row[5] else None
                }
                for row in high_risk_txns
            ]
        }

    def get_merchant_analytics(
        self,
        merchant: Optional[str] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get merchant transaction analytics
        
        Args:
            merchant: Optional merchant filter
            days: Analysis period
            
        Returns:
            Merchant analytics
        """
        cutoff = datetime.now() - timedelta(days=days)
        
        if merchant:
            # Specific merchant analysis
            metrics = self.conn.execute("""
                SELECT 
                    COUNT(*) as transaction_count,
                    SUM(amount) as total_volume,
                    AVG(amount) as avg_amount,
                    COUNT(DISTINCT user_id) as unique_customers
                FROM transactions
                WHERE merchant = ?
                  AND timestamp >= ?
                  AND status = 'completed'
            """, [merchant, cutoff]).fetchone()
            
            return {
                "merchant": merchant,
                "period_days": days,
                "transaction_count": metrics[0] if metrics else 0,
                "total_volume": float(metrics[1]) if metrics and metrics[1] else 0.0,
                "avg_transaction": float(metrics[2]) if metrics and metrics[2] else 0.0,
                "unique_customers": metrics[3] if metrics else 0
            }
        else:
            # Top merchants
            top_merchants = self.conn.execute("""
                SELECT 
                    merchant,
                    COUNT(*) as transaction_count,
                    SUM(amount) as total_volume,
                    AVG(amount) as avg_amount,
                    COUNT(DISTINCT user_id) as unique_customers
                FROM transactions
                WHERE timestamp >= ?
                  AND status = 'completed'
                  AND merchant IS NOT NULL
                GROUP BY merchant
                ORDER BY total_volume DESC
                LIMIT 20
            """, [cutoff]).fetchall()
            
            return {
                "period_days": days,
                "top_merchants": [
                    {
                        "merchant": row[0],
                        "transaction_count": row[1],
                        "total_volume": float(row[2]),
                        "avg_transaction": float(row[3]),
                        "unique_customers": row[4]
                    }
                    for row in top_merchants
                ]
            }

    def get_trend_analytics(
        self,
        metric: str = "volume",
        interval: str = "day",
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get trend analytics with configurable metrics and intervals
        
        Args:
            metric: Metric to track ('volume', 'count', 'users')
            interval: Time interval ('hour', 'day', 'week', 'month')
            days: Analysis period
            
        Returns:
            Trend data
        """
        cutoff = datetime.now() - timedelta(days=days)
        
        # Map interval to DuckDB truncation function
        trunc_map = {
            "hour": "DATE_TRUNC('hour', timestamp)",
            "day": "DATE_TRUNC('day', timestamp)",
            "week": "DATE_TRUNC('week', timestamp)",
            "month": "DATE_TRUNC('month', timestamp)"
        }
        
        trunc_func = trunc_map.get(interval, "DATE_TRUNC('day', timestamp)")
        
        # Map metric to SQL expression
        metric_map = {
            "volume": "SUM(amount)",
            "count": "COUNT(*)",
            "users": "COUNT(DISTINCT user_id)",
            "avg_amount": "AVG(amount)"
        }
        
        metric_expr = metric_map.get(metric, "SUM(amount)")
        
        results = self.conn.execute(f"""
            SELECT 
                {trunc_func} as period,
                {metric_expr} as value
            FROM transactions
            WHERE timestamp >= ?
              AND status = 'completed'
            GROUP BY period
            ORDER BY period
        """, [cutoff]).fetchall()
        
        return {
            "metric": metric,
            "interval": interval,
            "period_days": days,
            "data_points": [
                {
                    "period": row[0].isoformat() if row[0] else None,
                    "value": float(row[1]) if row[1] else 0.0
                }
                for row in results
            ]
        }

    def materialize_daily_summaries(self):
        """Materialize daily summaries for fast dashboard queries"""
        self.conn.execute("""
            INSERT OR REPLACE INTO daily_transaction_summary
            SELECT 
                DATE(timestamp) as date,
                COUNT(*) as total_transactions,
                SUM(amount) as total_volume,
                AVG(amount) as avg_transaction,
                COUNT(DISTINCT user_id) as unique_users,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
            FROM transactions
            WHERE DATE(timestamp) >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY DATE(timestamp)
        """)
        
        count = self.conn.execute("""
            SELECT COUNT(*) FROM daily_transaction_summary
        """).fetchone()[0]
        
        logger.info(f"Materialized {count} daily summaries")
        
        return {"materialized_days": count}

    def vacuum_and_optimize(self):
        """Optimize DuckDB database"""
        self.conn.execute("CHECKPOINT")
        logger.info("DuckDB database optimized")

    def close(self):
        """Close all connections"""
        self.spending.close()
        self.fraud.close()
        self.groups.close()
        self.conn.close()
        logger.info("DuckDB Manager closed")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
