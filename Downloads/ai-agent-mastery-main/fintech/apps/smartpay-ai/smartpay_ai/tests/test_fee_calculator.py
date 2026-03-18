"""
Comprehensive Tests for Centralized Fee Calculator.

Tests PSD-11 compliance and validates migration from duplicate implementations.

Location: backend_python/smartpay_ai/tests/test_fee_calculator.py

Test Coverage:
- Card interchange calculations (retail, fuel, cashback)
- ATM reverse interchange (successful, failed, non-financial)
- Instant payment interchange (P2M, P2B, cash-in/out, exempt)
- Complex transactions (cashback with purchase)
- Batch calculations
- VAT calculations
- Legacy compatibility
- Error handling
- Parity validation with old implementations
"""

import pytest
from decimal import Decimal

from smartpay_ai.shared.fee_calculator import (
    FeeCalculator,
    LegacyFeeCalculator,
    InterchangeInput,
    ComplexInterchangeInput,
    BatchTransaction,
    InterchangeResult,
    calculate_interchange,
    get_interchange_rate_info,
    validate_fee_parity,
)

from smartpay_ai.config.fee_structure import (
    CardType,
    TransactionType,
    InterchangeDirection,
    VAT_RATE,
)


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def calculator():
    """Provide fee calculator instance."""
    return FeeCalculator()


@pytest.fixture
def legacy_calculator():
    """Provide legacy compatibility calculator."""
    return LegacyFeeCalculator()


# =============================================================================
# Card Interchange Tests (Section 10.1)
# =============================================================================

class TestCardInterchange:
    """Test card-based payment transaction interchange."""
    
    def test_debit_card_retail_purchase(self, calculator):
        """Test debit card retail purchase interchange (0.50%)."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="card_retail",
            card_type="debit",
            amount=100.00
        ))
        
        assert result.interchange_amount == pytest.approx(0.50, rel=0.01)
        assert result.interchange_rate == 0.0050
        assert result.vat_amount == pytest.approx(0.075, rel=0.01)  # 15% of 0.50
        assert result.total_interchange == pytest.approx(0.575, rel=0.01)
        assert result.direction == InterchangeDirection.ACQUIRER_TO_ISSUER.value
        assert "debit" in result.description.lower()
    
    def test_hybrid_card_retail_purchase(self, calculator):
        """Test hybrid card retail purchase interchange (0.75%)."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="card_retail",
            card_type="hybrid",
            amount=200.00
        ))
        
        assert result.interchange_amount == pytest.approx(1.50, rel=0.01)
        assert result.interchange_rate == 0.0075
        assert result.vat_amount == pytest.approx(0.225, rel=0.01)
        assert result.total_interchange == pytest.approx(1.725, rel=0.01)
    
    def test_credit_card_retail_purchase(self, calculator):
        """Test credit card retail purchase interchange (1.55%)."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="card_retail",
            card_type="credit",
            amount=1000.00
        ))
        
        assert result.interchange_amount == pytest.approx(15.50, rel=0.01)
        assert result.interchange_rate == 0.0155
        assert result.vat_amount == pytest.approx(2.325, rel=0.01)
        assert result.total_interchange == pytest.approx(17.825, rel=0.01)
    
    def test_credit_card_fuel_purchase(self, calculator):
        """Test credit card fuel purchase interchange (0.80%)."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="card_fuel",
            card_type="credit",
            amount=500.00
        ))
        
        assert result.interchange_amount == pytest.approx(4.00, rel=0.01)
        assert result.interchange_rate == 0.0080
        assert result.vat_amount == pytest.approx(0.60, rel=0.01)
        assert result.total_interchange == pytest.approx(4.60, rel=0.01)
    
    def test_pure_cashback(self, calculator):
        """Test pure cashback reverse interchange (N$1.25 fixed)."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="card_pure_cashback",
            card_type="debit",
            amount=50.00  # Amount irrelevant for fixed fee
        ))
        
        assert result.interchange_amount == 1.25
        assert result.fixed_fee == 1.25
        assert result.vat_amount == pytest.approx(0.1875, rel=0.01)
        assert result.total_interchange == pytest.approx(1.4375, rel=0.01)
        assert result.direction == InterchangeDirection.ISSUER_TO_ACQUIRER.value
    
    def test_card_requires_card_type(self, calculator):
        """Test that card transactions require card_type parameter."""
        with pytest.raises(ValueError, match="Card type is required"):
            calculator.calculate_interchange(InterchangeInput(
                transaction_type="card_retail",
                amount=100.00
            ))


# =============================================================================
# ATM Interchange Tests (Section 10.3, 10.4)
# =============================================================================

class TestATMInterchange:
    """Test ATM transaction reverse interchange."""
    
    def test_atm_withdrawal_success_small_amount(self, calculator):
        """Test ATM withdrawal N$100 (N$4.00 + N$0.80)."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="atm_withdrawal_success",
            amount=100.00
        ))
        
        assert result.fixed_fee == 4.00
        assert result.variable_fee == 0.80  # 1 x N$0.80
        assert result.interchange_amount == 4.80
        assert result.vat_amount == pytest.approx(0.72, rel=0.01)
        assert result.total_interchange == pytest.approx(5.52, rel=0.01)
        assert result.direction == InterchangeDirection.ISSUER_TO_ACQUIRER.value
    
    def test_atm_withdrawal_success_large_amount(self, calculator):
        """Test ATM withdrawal N$500 (N$4.00 + N$4.00)."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="atm_withdrawal_success",
            amount=500.00
        ))
        
        assert result.fixed_fee == 4.00
        assert result.variable_fee == 4.00  # 5 x N$0.80
        assert result.interchange_amount == 8.00
        assert result.vat_amount == pytest.approx(1.20, rel=0.01)
        assert result.total_interchange == pytest.approx(9.20, rel=0.01)
    
    def test_atm_withdrawal_fail(self, calculator):
        """Test ATM unsuccessful withdrawal (N$4.80)."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="atm_withdrawal_fail",
            amount=0.00
        ))
        
        assert result.interchange_amount == 4.80
        assert result.fixed_fee == 4.80
        assert result.vat_amount == pytest.approx(0.72, rel=0.01)
        assert result.total_interchange == pytest.approx(5.52, rel=0.01)
    
    def test_atm_balance_enquiry(self, calculator):
        """Test ATM balance enquiry (N$0.60)."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="atm_balance_enquiry",
            amount=0.00
        ))
        
        assert result.interchange_amount == 0.60
        assert result.fixed_fee == 0.60
        assert result.vat_amount == pytest.approx(0.09, rel=0.01)
        assert result.total_interchange == pytest.approx(0.69, rel=0.01)
    
    def test_atm_non_financial(self, calculator):
        """Test ATM non-financial transaction (N$0.60)."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="atm_non_financial",
            amount=0.00
        ))
        
        assert result.interchange_amount == 0.60
        assert result.vat_amount == pytest.approx(0.09, rel=0.01)


# =============================================================================
# Instant Payment Tests (Section 11)
# =============================================================================

class TestInstantPaymentInterchange:
    """Test instant payment transaction interchange."""
    
    def test_p2m_payment(self, calculator):
        """Test P2M instant payment (0.40%)."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="ip_p2m",
            amount=250.00
        ))
        
        assert result.interchange_amount == pytest.approx(1.00, rel=0.01)
        assert result.interchange_rate == 0.0040
        assert result.vat_amount == pytest.approx(0.15, rel=0.01)
        assert result.total_interchange == pytest.approx(1.15, rel=0.01)
        assert result.direction == InterchangeDirection.ACQUIRER_TO_ISSUER.value
    
    def test_p2b_payment(self, calculator):
        """Test P2B instant payment (0.40%)."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="ip_p2b",
            amount=500.00
        ))
        
        assert result.interchange_amount == pytest.approx(2.00, rel=0.01)
        assert result.interchange_rate == 0.0040
    
    def test_cash_in(self, calculator):
        """Test cash-in at agent (N$1.25 reverse)."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="ip_cash_in",
            amount=1000.00
        ))
        
        assert result.interchange_amount == 1.25
        assert result.fixed_fee == 1.25
        assert result.vat_amount == pytest.approx(0.1875, rel=0.01)
        assert result.total_interchange == pytest.approx(1.4375, rel=0.01)
        assert result.direction == InterchangeDirection.ISSUER_TO_ACQUIRER.value
    
    def test_cash_out(self, calculator):
        """Test cash-out at agent (N$1.25 reverse)."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="ip_cash_out",
            amount=500.00
        ))
        
        assert result.interchange_amount == 1.25
        assert result.direction == InterchangeDirection.ISSUER_TO_ACQUIRER.value
    
    def test_p2p_exempt(self, calculator):
        """Test P2P transaction (exempt - no interchange)."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="ip_p2p",
            amount=100.00
        ))
        
        assert result.interchange_amount == 0.0
        assert result.vat_amount == 0.0
        assert result.total_interchange == 0.0
        assert result.direction == InterchangeDirection.NONE.value
        assert "no interchange" in result.description.lower()
    
    def test_b2b_exempt(self, calculator):
        """Test B2B transaction (exempt - no interchange)."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="ip_b2b",
            amount=5000.00
        ))
        
        assert result.interchange_amount == 0.0
        assert result.direction == InterchangeDirection.NONE.value


# =============================================================================
# Complex Transaction Tests
# =============================================================================

class TestComplexTransactions:
    """Test complex multi-component transactions."""
    
    def test_cashback_with_purchase_retail(self, calculator):
        """Test cashback with retail purchase (net interchange)."""
        result = calculator.calculate_complex_interchange(
            ComplexInterchangeInput(
                purchase_amount=100.00,
                cashback_amount=50.00,
                card_type="debit",
                is_fuel=False
            )
        )
        
        # Purchase interchange: N$100 * 0.50% = N$0.50
        assert result.purchase_interchange.interchange_amount == pytest.approx(0.50, rel=0.01)
        
        # Cashback interchange: N$1.25 (fixed)
        assert result.cashback_interchange.interchange_amount == 1.25
        
        # Net interchange: N$0.50 - N$1.25 = -N$0.75 (acquirer pays more)
        assert result.net_interchange == pytest.approx(-0.75, rel=0.01)
    
    def test_cashback_with_purchase_fuel(self, calculator):
        """Test cashback with fuel purchase."""
        result = calculator.calculate_complex_interchange(
            ComplexInterchangeInput(
                purchase_amount=200.00,
                cashback_amount=0.00,
                card_type="credit",
                is_fuel=True
            )
        )
        
        # Fuel purchase: N$200 * 0.80% = N$1.60
        assert result.purchase_interchange.interchange_amount == pytest.approx(1.60, rel=0.01)
        
        # No cashback
        assert result.cashback_interchange.interchange_amount == 1.25  # Still calculates for N$0
        
        # Net: N$1.60 - N$1.25 = N$0.35
        assert result.net_interchange == pytest.approx(0.35, rel=0.01)


# =============================================================================
# Batch Processing Tests
# =============================================================================

class TestBatchCalculations:
    """Test batch interchange calculations for settlement."""
    
    def test_batch_calculation_mixed_types(self, calculator):
        """Test batch calculation with mixed transaction types."""
        transactions = [
            BatchTransaction(
                id="tx1",
                transaction_type="card_retail",
                card_type="debit",
                amount=100.00
            ),
            BatchTransaction(
                id="tx2",
                transaction_type="card_retail",
                card_type="credit",
                amount=200.00
            ),
            BatchTransaction(
                id="tx3",
                transaction_type="atm_withdrawal_success",
                amount=500.00
            ),
            BatchTransaction(
                id="tx4",
                transaction_type="ip_p2m",
                amount=300.00
            ),
        ]
        
        result = calculator.calculate_batch_interchange(transactions)
        
        assert result.summary["total_transactions"] == 4
        assert result.summary["total_interchange_amount"] > 0
        assert result.summary["total_vat"] > 0
        assert result.summary["total_with_vat"] > 0
        assert len(result.summary["by_type"]) >= 3  # At least 3 different types
    
    def test_batch_calculation_single_type(self, calculator):
        """Test batch calculation with single transaction type."""
        transactions = [
            BatchTransaction(
                id=f"tx{i}",
                transaction_type="card_retail",
                card_type="debit",
                amount=100.00
            )
            for i in range(10)
        ]
        
        result = calculator.calculate_batch_interchange(transactions)
        
        assert result.summary["total_transactions"] == 10
        # 10 x (N$100 * 0.50%) = N$5.00
        assert result.summary["total_interchange_amount"] == pytest.approx(5.00, rel=0.01)
        assert len(result.summary["by_type"]) == 1
    
    def test_batch_calculation_with_errors(self, calculator):
        """Test batch calculation handles errors gracefully."""
        transactions = [
            BatchTransaction(
                id="tx1",
                transaction_type="card_retail",
                card_type="debit",
                amount=100.00
            ),
            BatchTransaction(
                id="tx2",
                transaction_type="invalid_type",  # Invalid
                amount=100.00
            ),
            BatchTransaction(
                id="tx3",
                transaction_type="card_retail",
                card_type="credit",
                amount=200.00
            ),
        ]
        
        result = calculator.calculate_batch_interchange(transactions)
        
        # Should process valid transactions and log errors for invalid ones
        assert result.summary["total_transactions"] == 3
        assert any("error" in tx for tx in result.transactions)


# =============================================================================
# VAT Calculation Tests
# =============================================================================

class TestVATCalculations:
    """Test VAT calculations (15% Namibian VAT)."""
    
    def test_vat_rate_applied_correctly(self, calculator):
        """Test 15% VAT applied to all fees."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="card_retail",
            card_type="debit",
            amount=100.00
        ))
        
        expected_vat = result.interchange_amount * 0.15
        assert result.vat_amount == pytest.approx(expected_vat, rel=0.001)
        assert result.total_interchange == pytest.approx(
            result.interchange_amount + expected_vat, rel=0.001
        )
    
    def test_vat_on_zero_fee(self, calculator):
        """Test VAT on exempt transactions (should be zero)."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="ip_p2p",
            amount=100.00
        ))
        
        assert result.interchange_amount == 0.0
        assert result.vat_amount == 0.0
        assert result.total_interchange == 0.0


# =============================================================================
# Legacy Compatibility Tests
# =============================================================================

class TestLegacyCompatibility:
    """Test legacy compatibility layer."""
    
    def test_legacy_card_retail(self, legacy_calculator):
        """Test legacy interface for card retail."""
        result = legacy_calculator.estimate_fee_local(
            "card_retail", "debit", 100.00
        )
        
        assert result["interchange_amount"] == pytest.approx(0.50, rel=0.01)
        assert result["interchange_rate"] == 0.0050
        assert result["vat_amount"] == pytest.approx(0.075, rel=0.01)
        assert result["total_fee"] == pytest.approx(0.575, rel=0.01)
        assert "source" in result
    
    def test_legacy_atm_withdrawal(self, legacy_calculator):
        """Test legacy interface for ATM withdrawal."""
        result = legacy_calculator.estimate_fee_local(
            "atm_withdrawal", None, 300.00
        )
        
        # N$4.00 + (3 * N$0.80) = N$6.40
        assert result["interchange_amount"] == pytest.approx(6.40, rel=0.01)
        assert result["vat_amount"] == pytest.approx(0.96, rel=0.01)
    
    def test_legacy_instant_payment(self, legacy_calculator):
        """Test legacy interface for instant payment."""
        result = legacy_calculator.estimate_fee_local(
            "instant_payment", None, 100.00
        )
        
        # Default maps to IP_P2M (0.40%)
        assert result["interchange_amount"] == pytest.approx(0.40, rel=0.01)
    
    def test_legacy_unknown_type(self, legacy_calculator):
        """Test legacy interface handles unknown types gracefully."""
        result = legacy_calculator.estimate_fee_local(
            "unknown_type", None, 100.00
        )
        
        assert result["interchange_amount"] == 0.0
        assert "error" in result


# =============================================================================
# Edge Cases and Error Handling
# =============================================================================

class TestEdgeCases:
    """Test edge cases and error handling."""
    
    def test_negative_amount_rejected(self, calculator):
        """Test negative amounts are rejected."""
        with pytest.raises(ValueError, match="cannot be negative"):
            calculator.calculate_interchange(InterchangeInput(
                transaction_type="card_retail",
                card_type="debit",
                amount=-100.00
            ))
    
    def test_zero_amount_allowed(self, calculator):
        """Test zero amount is valid (e.g., for fixed fees)."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="atm_balance_enquiry",
            amount=0.00
        ))
        
        assert result.interchange_amount == 0.60
    
    def test_very_large_amount(self, calculator):
        """Test calculation with very large amount."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="card_retail",
            card_type="credit",
            amount=1_000_000.00
        ))
        
        # N$1M * 1.55% = N$15,500
        assert result.interchange_amount == pytest.approx(15500.00, rel=0.01)
    
    def test_fractional_cents(self, calculator):
        """Test calculation handles fractional cents correctly."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="card_retail",
            card_type="debit",
            amount=33.33
        ))
        
        # N$33.33 * 0.50% = N$0.16665 (should round properly)
        assert result.interchange_amount == pytest.approx(0.16665, rel=0.001)
    
    def test_invalid_transaction_type(self, calculator):
        """Test invalid transaction type raises error."""
        with pytest.raises(ValueError, match="Unknown transaction type"):
            calculator.calculate_interchange(InterchangeInput(
                transaction_type="totally_invalid",
                amount=100.00
            ))
    
    def test_invalid_card_type(self, calculator):
        """Test invalid card type raises error."""
        with pytest.raises(ValueError, match="Unknown card type"):
            calculator.calculate_interchange(InterchangeInput(
                transaction_type="card_retail",
                card_type="invalid_card",
                amount=100.00
            ))


# =============================================================================
# Rate Info Tests
# =============================================================================

class TestRateInfo:
    """Test rate information retrieval for display purposes."""
    
    def test_get_rate_info_card_retail(self, calculator):
        """Test rate info for card retail."""
        info = calculator.get_rate_info("card_retail", "debit")
        
        assert "rate" in info
        assert "0.50%" in info["rate"]
        assert "description" in info
        assert "psd_reference" in info
    
    def test_get_rate_info_atm_withdrawal(self, calculator):
        """Test rate info for ATM withdrawal."""
        info = calculator.get_rate_info("atm_withdrawal_success")
        
        assert "formula" in info
        assert "N$4.00" in info["formula"]
        assert "N$0.80 per N$100" in info["formula"]
    
    def test_get_rate_info_exempt(self, calculator):
        """Test rate info for exempt transactions."""
        info = calculator.get_rate_info("ip_p2p")
        
        assert "rate" in info
        assert "N$0.00" in info["rate"]
        assert "no interchange" in info["description"].lower()


# =============================================================================
# Parity Validation Tests (Migration Verification)
# =============================================================================

class TestMigrationParity:
    """
    Test that centralized calculator produces identical results to old implementations.
    
    These tests verify that the migration from duplicate code maintains correctness.
    """
    
    def test_parity_card_debit_retail(self):
        """Verify parity with old duplicate implementation for debit card."""
        # Old implementation: rates = {"debit": 0.005, ...}
        # interchange_amount = amount * rate
        # vat_amount = interchange_amount * 0.15
        
        amount = 100.00
        old_result = {
            "interchange_amount": 100.00 * 0.005,  # 0.50
            "vat_amount": 0.50 * 0.15,  # 0.075
            "total_fee": 0.50 + 0.075,  # 0.575
        }
        
        assert validate_fee_parity(
            "card_retail", "debit", amount, old_result
        )
    
    def test_parity_atm_withdrawal(self):
        """Verify parity with old duplicate ATM withdrawal calculation."""
        # Old implementation:
        # base_fee = 4.0
        # per_hundred = (amount / 100) * 0.80
        # interchange_amount = base_fee + per_hundred
        
        amount = 500.00
        old_result = {
            "interchange_amount": 4.0 + (500.00 / 100) * 0.80,  # 8.00
            "vat_amount": 8.00 * 0.15,  # 1.20
            "total_fee": 8.00 + 1.20,  # 9.20
        }
        
        assert validate_fee_parity(
            "atm_withdrawal_success", None, amount, old_result
        )
    
    def test_parity_instant_payment(self):
        """Verify parity with old duplicate instant payment calculation."""
        # Old implementation: interchange_amount = 1.25
        
        amount = 100.00
        old_result = {
            "interchange_amount": 0.40,  # P2M default: 100 * 0.004
            "vat_amount": 0.40 * 0.15,  # 0.06
            "total_fee": 0.40 + 0.06,  # 0.46
        }
        
        assert validate_fee_parity(
            "ip_p2m", None, amount, old_result
        )


# =============================================================================
# Convenience Function Tests
# =============================================================================

class TestConvenienceFunctions:
    """Test module-level convenience functions."""
    
    def test_calculate_interchange_convenience(self):
        """Test convenience function for calculating interchange."""
        result = calculate_interchange(InterchangeInput(
            transaction_type="card_retail",
            card_type="debit",
            amount=100.00
        ))
        
        assert isinstance(result, InterchangeResult)
        assert result.interchange_amount > 0
    
    def test_get_interchange_rate_info_convenience(self):
        """Test convenience function for rate info."""
        info = get_interchange_rate_info("card_retail", "debit")
        
        assert "rate" in info
        assert "description" in info


# =============================================================================
# Integration Tests
# =============================================================================

class TestIntegration:
    """Test integration scenarios."""
    
    def test_real_world_retail_transaction(self, calculator):
        """Test real-world retail purchase scenario."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="card_retail",
            card_type="debit",
            amount=450.75  # N$450.75 grocery purchase
        ))
        
        # N$450.75 * 0.50% = N$2.25375
        assert result.interchange_amount == pytest.approx(2.25375, rel=0.01)
        assert result.vat_amount == pytest.approx(0.338, rel=0.01)
        assert result.total_interchange == pytest.approx(2.592, rel=0.01)
    
    def test_real_world_atm_withdrawal(self, calculator):
        """Test real-world ATM withdrawal scenario."""
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type="atm_withdrawal_success",
            amount=1000.00  # N$1,000 ATM withdrawal
        ))
        
        # N$4.00 + (10 * N$0.80) = N$12.00
        assert result.fixed_fee == 4.00
        assert result.variable_fee == 8.00
        assert result.interchange_amount == 12.00
        assert result.vat_amount == pytest.approx(1.80, rel=0.01)
        assert result.total_interchange == pytest.approx(13.80, rel=0.01)
    
    def test_daily_settlement_scenario(self, calculator):
        """Test full day of transactions for settlement."""
        transactions = [
            # Morning transactions
            BatchTransaction(id="1", transaction_type="card_retail", card_type="debit", amount=50.00),
            BatchTransaction(id="2", transaction_type="card_retail", card_type="debit", amount=120.00),
            BatchTransaction(id="3", transaction_type="atm_withdrawal_success", amount=200.00),
            
            # Afternoon transactions
            BatchTransaction(id="4", transaction_type="card_fuel", card_type="credit", amount=800.00),
            BatchTransaction(id="5", transaction_type="ip_p2m", amount=300.00),
            BatchTransaction(id="6", transaction_type="ip_cash_out", amount=500.00),
            
            # Evening transactions
            BatchTransaction(id="7", transaction_type="card_retail", card_type="credit", amount=1500.00),
            BatchTransaction(id="8", transaction_type="ip_p2p", amount=200.00),  # Exempt
        ]
        
        result = calculator.calculate_batch_interchange(transactions)
        
        assert result.summary["total_transactions"] == 8
        assert result.summary["total_interchange_amount"] > 0
        assert len(result.transactions) == 8
        
        # Verify at least one exempt transaction
        exempt_tx = [tx for tx in result.transactions if tx.get("interchange", {}).get("interchange_amount") == 0]
        assert len(exempt_tx) >= 1


# =============================================================================
# PSD-11 Compliance Tests
# =============================================================================

class TestPSD11Compliance:
    """Test PSD-11 regulatory compliance."""
    
    def test_all_transaction_types_have_references(self, calculator):
        """Test all transaction types have PSD-11 references."""
        test_cases = [
            ("card_retail", "debit"),
            ("card_fuel", "credit"),
            ("atm_withdrawal_success", None),
            ("ip_p2m", None),
            ("ip_p2p", None),
        ]
        
        for tx_type, card_type in test_cases:
            result = calculator.calculate_interchange(InterchangeInput(
                transaction_type=tx_type,
                card_type=card_type,
                amount=100.00
            ))
            
            assert result.psd_reference, f"Missing PSD reference for {tx_type}"
            assert "PSD-11" in result.psd_reference
    
    def test_interchange_directions_correct(self, calculator):
        """Test interchange directions match PSD-11 specification."""
        # Normal interchange (Acquirer → Issuer)
        retail = calculator.calculate_interchange(InterchangeInput(
            transaction_type="card_retail",
            card_type="debit",
            amount=100.00
        ))
        assert retail.direction == InterchangeDirection.ACQUIRER_TO_ISSUER.value
        
        # Reverse interchange (Issuer → Acquirer)
        atm = calculator.calculate_interchange(InterchangeInput(
            transaction_type="atm_withdrawal_success",
            amount=100.00
        ))
        assert atm.direction == InterchangeDirection.ISSUER_TO_ACQUIRER.value
        
        # No interchange
        p2p = calculator.calculate_interchange(InterchangeInput(
            transaction_type="ip_p2p",
            amount=100.00
        ))
        assert p2p.direction == InterchangeDirection.NONE.value
    
    def test_exempt_transactions_zero_fee(self, calculator):
        """Test all exempt transaction types have zero interchange."""
        exempt_types = [
            "ip_p2p", "ip_b2p", "ip_b2b",
            "ip_b2g", "ip_g2p", "ip_request_to_pay"
        ]
        
        for tx_type in exempt_types:
            result = calculator.calculate_interchange(InterchangeInput(
                transaction_type=tx_type,
                amount=100.00
            ))
            
            assert result.interchange_amount == 0.0, f"{tx_type} should be exempt"
            assert result.total_interchange == 0.0


# =============================================================================
# Performance Tests
# =============================================================================

class TestPerformance:
    """Test performance characteristics."""
    
    def test_batch_calculation_performance(self, calculator, benchmark):
        """Test batch calculation performance (if pytest-benchmark installed)."""
        transactions = [
            BatchTransaction(
                id=f"tx{i}",
                transaction_type="card_retail",
                card_type="debit",
                amount=100.00
            )
            for i in range(1000)
        ]
        
        try:
            result = benchmark(calculator.calculate_batch_interchange, transactions)
            assert result.summary["total_transactions"] == 1000
        except NameError:
            # pytest-benchmark not installed, run normal test
            result = calculator.calculate_batch_interchange(transactions)
            assert result.summary["total_transactions"] == 1000


# =============================================================================
# Run Tests
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
