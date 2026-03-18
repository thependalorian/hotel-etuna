"""
Smartpay AI Analytics Module

Location: backend_python/smartpay_ai/analytics/__init__.py
Purpose: DuckDB-powered analytics for user spending, groups, and fraud detection
"""

from .duckdb_manager import DuckDBManager
from .spending_analytics import SpendingAnalytics
from .group_analytics import GroupAnalytics
from .fraud_analytics import FraudAnalytics
from .etl_pipeline import ETLPipeline, run_etl_sync

__all__ = [
    "DuckDBManager",
    "SpendingAnalytics",
    "GroupAnalytics",
    "FraudAnalytics",
    "ETLPipeline",
    "run_etl_sync",
]
