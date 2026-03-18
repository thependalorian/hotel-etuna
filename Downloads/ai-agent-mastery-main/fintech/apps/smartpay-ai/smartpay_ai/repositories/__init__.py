"""
Repository Pattern implementations for Smartpay AI

Location: backend_python/smartpay_ai/repositories/__init__.py
Purpose: Data access layer with centralized, reusable query patterns

Available Repositories:
- UserRepository: User data access (profiles, KYC, authentication)
- TransactionRepository: Transaction queries (history, filtering, aggregation)
- WalletRepository: Wallet balance and operations
- AuditRepository: Compliance and security audit logs
"""

from .user_repository import UserRepository
from .transaction_repository import TransactionRepository

__all__ = [
    "UserRepository",
    "TransactionRepository",
]
