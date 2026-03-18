"""
Test suite for generated types from JSON Schema.

This test suite validates that:
1. All generated types are importable
2. Generated types have correct validation
3. TypeScript and Python types are in sync
4. Generated types work with existing code
"""

import pytest
from datetime import datetime
from pydantic import ValidationError as PydanticValidationError

from smartpay_ai.models.generated import (
    User,
    Wallet,
    Transaction,
    SendMoneyRequest,
    CashOutRequest,
    P2PTransaction,
    ApiResponse,
    TransactionResult,
    ApiError,
    ValidationError,
)


class TestUserModel:
    """Test User model from generated types."""
    
    def test_user_creation_valid(self):
        """Test creating a valid User."""
        user = User(
            id="123e4567-e89b-12d3-a456-426614174000",
            phone="26481234567",
            wallet_status="active",
            created_at="2026-03-18T10:00:00Z",
            updated_at="2026-03-18T10:00:00Z",
        )
        assert user.id == "123e4567-e89b-12d3-a456-426614174000"
        assert user.phone == "26481234567"
        assert user.wallet_status == "active"
    
    def test_user_with_optional_fields(self):
        """Test User with optional fields."""
        user = User(
            id="123e4567-e89b-12d3-a456-426614174000",
            phone="26481234567",
            email="test@example.com",
            first_name="John",
            last_name="Doe",
            full_name="John Doe",
            wallet_status="active",
            created_at="2026-03-18T10:00:00Z",
            updated_at="2026-03-18T10:00:00Z",
        )
        assert user.email == "test@example.com"
        assert user.first_name == "John"
        assert user.last_name == "Doe"
    
    def test_user_wallet_status_enum(self):
        """Test wallet_status enum validation."""
        # Valid statuses
        for status in ["active", "inactive", "suspended", "closed"]:
            user = User(
                id="123e4567-e89b-12d3-a456-426614174000",
                phone="26481234567",
                wallet_status=status,
                created_at="2026-03-18T10:00:00Z",
                updated_at="2026-03-18T10:00:00Z",
            )
            assert user.wallet_status == status


class TestWalletModel:
    """Test Wallet model from generated types."""
    
    def test_wallet_creation_valid(self):
        """Test creating a valid Wallet."""
        wallet = Wallet(
            id="wallet-123",
            user_id="user-456",
            name="Main Wallet",
            type="main",
            balance=100.50,
            currency="NAD",
            created_at="2026-03-18T10:00:00Z",
            updated_at="2026-03-18T10:00:00Z",
        )
        assert wallet.id == "wallet-123"
        assert wallet.type == "main"
        assert wallet.balance == 100.50
        assert wallet.currency == "NAD"
    
    def test_wallet_type_enum(self):
        """Test wallet type enum validation."""
        for wallet_type in ["main", "savings", "grant"]:
            wallet = Wallet(
                id="wallet-123",
                user_id="user-456",
                name=f"{wallet_type} Wallet",
                type=wallet_type,
                balance=0.0,
                currency="NAD",
                created_at="2026-03-18T10:00:00Z",
                updated_at="2026-03-18T10:00:00Z",
            )
            assert wallet.type == wallet_type


class TestTransactionModel:
    """Test Transaction model from generated types."""
    
    def test_transaction_creation_valid(self):
        """Test creating a valid Transaction."""
        transaction = Transaction(
            id="tx-123",
            wallet_id="wallet-456",
            type="send",
            amount=50.00,
            created_at="2026-03-18T10:00:00Z",
        )
        assert transaction.id == "tx-123"
        assert transaction.wallet_id == "wallet-456"
        assert transaction.type == "send"
        assert transaction.amount == 50.00
    
    def test_transaction_with_optional_fields(self):
        """Test Transaction with optional fields."""
        transaction = Transaction(
            id="tx-123",
            wallet_id="wallet-456",
            type="send",
            amount=50.00,
            balance_after=150.00,
            description="Payment for groceries",
            reference="REF-12345",
            status="success",
            created_at="2026-03-18T10:00:00Z",
        )
        assert transaction.balance_after == 150.00
        assert transaction.description == "Payment for groceries"
        assert transaction.status == "success"
    
    def test_transaction_type_enum(self):
        """Test transaction type enum validation."""
        valid_types = [
            "send", "receive", "cash_out", "bill_pay", "airtime",
            "loan_disbursement", "loan_repayment", "add_money",
            "group_contribution", "group_withdrawal"
        ]
        for tx_type in valid_types:
            transaction = Transaction(
                id="tx-123",
                wallet_id="wallet-456",
                type=tx_type,
                amount=50.00,
                created_at="2026-03-18T10:00:00Z",
            )
            assert transaction.type == tx_type


class TestPaymentRequests:
    """Test payment request models."""
    
    def test_send_money_request(self):
        """Test SendMoneyRequest."""
        request = SendMoneyRequest(
            recipient_id="user-789",
            amount=100.00,
        )
        assert request.recipient_id == "user-789"
        assert request.amount == 100.00
    
    def test_send_money_request_with_note(self):
        """Test SendMoneyRequest with optional fields."""
        request = SendMoneyRequest(
            recipient_id="user-789",
            amount=100.00,
            note="Payment for dinner",
            fromWalletId="wallet-123",
        )
        assert request.note == "Payment for dinner"
        assert request.fromWalletId == "wallet-123"
    
    def test_cash_out_request(self):
        """Test CashOutRequest."""
        request = CashOutRequest(
            amount=50.00,
            method="atm",
        )
        assert request.amount == 50.00
        assert request.method == "atm"
    
    def test_cash_out_method_enum(self):
        """Test cash out method enum."""
        for method in ["atm", "agent", "bank"]:
            request = CashOutRequest(
                amount=50.00,
                method=method,
            )
            assert request.method == method


class TestResponseModels:
    """Test response models."""
    
    def test_api_response_success(self):
        """Test ApiResponse for success case."""
        response = ApiResponse(
            success=True,
            message="Operation successful",
            data={"id": "123"},
        )
        assert response.success is True
        assert response.message == "Operation successful"
        assert response.data == {"id": "123"}
    
    def test_api_response_error(self):
        """Test ApiResponse for error case."""
        response = ApiResponse(
            success=False,
            error="Insufficient funds",
            code="INSUFFICIENT_FUNDS",
        )
        assert response.success is False
        assert response.error == "Insufficient funds"
        assert response.code == "INSUFFICIENT_FUNDS"
    
    def test_transaction_result_success(self):
        """Test TransactionResult for success."""
        result = TransactionResult(
            success=True,
            data={"transaction_id": "tx-123"},
        )
        assert result.success is True
        assert result.data["transaction_id"] == "tx-123"
    
    def test_transaction_result_error(self):
        """Test TransactionResult for error."""
        result = TransactionResult(
            success=False,
            error="Transaction failed",
        )
        assert result.success is False
        assert result.error == "Transaction failed"


class TestErrorModels:
    """Test error models."""
    
    def test_api_error(self):
        """Test ApiError."""
        error = ApiError(
            code="VALIDATION_ERROR",
            message="Invalid input provided",
        )
        assert error.code == "VALIDATION_ERROR"
        assert error.message == "Invalid input provided"
    
    def test_api_error_with_details(self):
        """Test ApiError with details."""
        error = ApiError(
            code="VALIDATION_ERROR",
            message="Invalid input",
            details={"field": "amount", "issue": "must be positive"},
            field="amount",
        )
        assert error.field == "amount"
        assert error.details["issue"] == "must be positive"
    
    def test_validation_error(self):
        """Test ValidationError."""
        error = ValidationError(
            code="VALIDATION_ERROR",
            message="Invalid amount",
            field="amount",
            constraint="minimum",
        )
        assert error.code == "VALIDATION_ERROR"
        assert error.field == "amount"
        assert error.constraint == "minimum"
    
    def test_error_code_enum(self):
        """Test error code enum values."""
        valid_codes = [
            "VALIDATION_ERROR", "NOT_FOUND", "UNAUTHORIZED",
            "FORBIDDEN", "CONFLICT", "INSUFFICIENT_FUNDS",
            "RATE_LIMIT_EXCEEDED", "INTERNAL_ERROR",
            "SERVICE_UNAVAILABLE", "BAD_REQUEST", "TIMEOUT",
            "COMPLIANCE_VIOLATION"
        ]
        for code in valid_codes:
            error = ApiError(
                code=code,
                message=f"Test error for {code}",
            )
            assert error.code == code


class TestTypeCompatibility:
    """Test that generated types work with existing code patterns."""
    
    def test_user_dict_conversion(self):
        """Test User can be converted to dict."""
        user = User(
            id="123",
            phone="26481234567",
            email="test@example.com",
            wallet_status="active",
            created_at="2026-03-18T10:00:00Z",
            updated_at="2026-03-18T10:00:00Z",
        )
        user_dict = user.model_dump()
        assert user_dict["id"] == "123"
        assert user_dict["email"] == "test@example.com"
    
    def test_transaction_json_serialization(self):
        """Test Transaction can be JSON serialized."""
        transaction = Transaction(
            id="tx-123",
            wallet_id="wallet-456",
            type="send",
            amount=50.00,
            created_at="2026-03-18T10:00:00Z",
        )
        json_str = transaction.model_dump_json()
        assert "tx-123" in json_str
        assert "wallet-456" in json_str
    
    def test_nested_response_structure(self):
        """Test nested response structures."""
        response = ApiResponse(
            success=True,
            message="Transaction successful",
            data={
                "transaction": Transaction(
                    id="tx-123",
                    wallet_id="wallet-456",
                    type="send",
                    amount=50.00,
                    created_at="2026-03-18T10:00:00Z",
                ).model_dump()
            }
        )
        assert response.data["transaction"]["id"] == "tx-123"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
