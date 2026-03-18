"""
Analytics SQL Query Library

Location: backend_python/smartpay_ai/analytics/queries/__init__.py
Purpose: Curated collection of high-performance DuckDB analytics queries
"""

from .transaction_queries import TRANSACTION_QUERIES
from .user_queries import USER_QUERIES
from .fraud_queries import FRAUD_QUERIES
from .reporting_queries import REPORTING_QUERIES

__all__ = [
    "TRANSACTION_QUERIES",
    "USER_QUERIES",
    "FRAUD_QUERIES",
    "REPORTING_QUERIES",
]
