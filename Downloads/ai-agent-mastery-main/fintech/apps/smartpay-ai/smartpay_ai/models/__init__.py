"""
SmartPay AI Models Package

This package contains all Pydantic models used in the SmartPay AI backend.

Core models (User, Transaction, Wallet, etc.) are generated from JSON Schema
in the `generated/` subdirectory to maintain single source of truth with the
TypeScript backend.

Agent-specific models are defined in their respective agent model files.
"""

# Re-export generated core models
from .generated import (
    User,
    Transaction,
    Wallet,
    SendMoneyRequest,
    CashOutRequest,
    P2PTransaction,
    ApiResponse,
    TransactionResult,
    PaginatedResponse,
    ApiError,
    ValidationError,
    ErrorResponse,
)

__all__ = [
    # Core domain models
    "User",
    "Transaction",
    "Wallet",
    # Payment requests
    "SendMoneyRequest",
    "CashOutRequest",
    "P2PTransaction",
    # Response types
    "ApiResponse",
    "TransactionResult",
    "PaginatedResponse",
    # Error types
    "ApiError",
    "ValidationError",
    "ErrorResponse",
]
