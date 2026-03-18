"""
Compliance Integration Tests.

Tests for PSD-1, PSD-6, PSD-11, PSD-12, and FIA compliance features
in the Python backend.

Location: backend_python/smartpay_ai/tests/test_compliance_integration.py
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from smartpay_ai.compliance.validator import ComplianceValidator, KYCTier
from smartpay_ai.compliance.config_sync import ConfigSync


class TestComplianceValidator:
    """Test suite for ComplianceValidator."""

    @pytest.fixture
    def validator(self):
        """Create validator instance for testing."""
        return ComplianceValidator(node_backend_url="http://localhost:3000")

    @pytest.fixture
    def mock_httpx_client(self):
        """Mock httpx AsyncClient."""
        with patch("smartpay_ai.compliance.validator.httpx.AsyncClient") as mock:
            yield mock

    # -------------------------------------------------------------------------
    # PSD-1: Transaction Limit Validation Tests
    # -------------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_validate_transaction_limits_within_basic_tier(self, validator):
        """Test transaction validation for amount within basic tier limits."""
        # Basic tier: max single = N$1,000
        result = await validator.validate_transaction_limits(
            user_id="user123",
            amount=500.0,
            user_tier="basic",
            daily_spent=0.0,
            monthly_spent=0.0,
        )
        
        assert result["allowed"] is True
        assert result["source"] == "python_fallback"

    @pytest.mark.asyncio
    async def test_validate_transaction_limits_exceeds_basic_tier(self, validator):
        """Test transaction validation for amount exceeding basic tier limits."""
        # Basic tier: max single = N$1,000
        result = await validator.validate_transaction_limits(
            user_id="user123",
            amount=1500.0,
            user_tier="basic",
            daily_spent=0.0,
            monthly_spent=0.0,
        )
        
        assert result["allowed"] is False
        assert "exceeds" in result["reason"].lower()
        assert result["source"] == "python_fallback"

    @pytest.mark.asyncio
    async def test_validate_transaction_limits_daily_limit_reached(self, validator):
        """Test transaction validation when daily limit is reached."""
        # Basic tier: max daily = N$5,000
        result = await validator.validate_transaction_limits(
            user_id="user123",
            amount=500.0,
            user_tier="basic",
            daily_spent=4800.0,  # Already spent N$4,800 today
            monthly_spent=10000.0,
        )
        
        assert result["allowed"] is False
        assert "daily" in result["reason"].lower()

    @pytest.mark.asyncio
    async def test_validate_transaction_limits_monthly_limit_reached(self, validator):
        """Test transaction validation when monthly limit is reached."""
        # Basic tier: max monthly = N$20,000
        result = await validator.validate_transaction_limits(
            user_id="user123",
            amount=500.0,
            user_tier="basic",
            daily_spent=1000.0,
            monthly_spent=19800.0,  # Already spent N$19,800 this month
        )
        
        assert result["allowed"] is False
        assert "monthly" in result["reason"].lower()

    @pytest.mark.asyncio
    async def test_validate_transaction_limits_premium_tier(self, validator):
        """Test transaction validation for premium tier with higher limits."""
        # Premium tier: max single = N$50,000
        result = await validator.validate_transaction_limits(
            user_id="user123",
            amount=25000.0,
            user_tier="premium",
            daily_spent=0.0,
            monthly_spent=0.0,
        )
        
        assert result["allowed"] is True

    # -------------------------------------------------------------------------
    # PSD-6: Violation Logging Tests
    # -------------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_log_compliance_violation_success(self, validator, mock_httpx_client):
        """Test successful compliance violation logging."""
        mock_response = AsyncMock()
        mock_response.json.return_value = {"success": True, "violation_id": "vio123"}
        mock_response.raise_for_status = MagicMock()
        
        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        validator.client = mock_client
        
        result = await validator.log_compliance_violation(
            violation_type="transaction_limit_breach",
            psd_reference="PSD-1",
            severity="moderate",
            description="Test violation",
            user_id="user123",
        )
        
        assert result["success"] is True
        assert "violation_id" in result
        mock_client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_log_compliance_violation_failure(self, validator):
        """Test compliance violation logging failure handling."""
        mock_client = AsyncMock()
        mock_client.post.side_effect = Exception("Network error")
        validator.client = mock_client
        
        result = await validator.log_compliance_violation(
            violation_type="test_violation",
            psd_reference="PSD-1",
            severity="minor",
            description="Test",
        )
        
        assert result["success"] is False
        assert "error" in result

    # -------------------------------------------------------------------------
    # PSD-11: Interchange Fee Tests
    # -------------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_estimate_interchange_fee_card_retail_debit(self, validator):
        """Test interchange fee estimation for debit card retail transaction."""
        result = await validator.estimate_interchange_fee(
            transaction_type="card_retail",
            card_type="debit",
            amount=1000.0,
        )
        
        # Use centralized fee structure for test expectations
        from smartpay_ai.config.fee_structure import CARD_RETAIL_RATES, CardType, VAT_RATE
        
        debit_rate = CARD_RETAIL_RATES[CardType.DEBIT].rate  # 0.50%
        expected_interchange = 1000.0 * debit_rate  # N$5.00
        expected_vat = expected_interchange * float(VAT_RATE)  # N$0.75
        expected_total = expected_interchange + expected_vat  # N$5.75
        
        assert result["interchange_amount"] == pytest.approx(expected_interchange, rel=0.01)
        assert result["vat_amount"] == pytest.approx(expected_vat, rel=0.01)
        assert result["total_fee"] == pytest.approx(expected_total, rel=0.01)
        assert result["interchange_rate"] == debit_rate

    @pytest.mark.asyncio
    async def test_estimate_interchange_fee_atm_withdrawal(self, validator):
        """Test interchange fee estimation for ATM withdrawal."""
        result = await validator.estimate_interchange_fee(
            transaction_type="atm_withdrawal",
            amount=1000.0,
        )
        
        # ATM: N$4.00 base + N$0.80 per N$100
        expected_interchange = 4.0 + (1000.0 / 100) * 0.80  # N$12.00
        expected_vat = expected_interchange * 0.15  # N$1.80
        expected_total = expected_interchange + expected_vat  # N$13.80
        
        assert result["interchange_amount"] == pytest.approx(expected_interchange, rel=0.01)
        assert result["vat_amount"] == pytest.approx(expected_vat, rel=0.01)
        assert result["total_fee"] == pytest.approx(expected_total, rel=0.01)

    @pytest.mark.asyncio
    async def test_estimate_interchange_fee_instant_payment(self, validator):
        """Test interchange fee estimation for instant payment."""
        result = await validator.estimate_interchange_fee(
            transaction_type="instant_payment",
            amount=500.0,
        )
        
        # Instant payment: N$1.25 flat fee
        expected_interchange = 1.25
        expected_vat = expected_interchange * 0.15  # N$0.1875
        expected_total = expected_interchange + expected_vat  # N$1.4375
        
        assert result["interchange_amount"] == pytest.approx(expected_interchange, rel=0.01)
        assert result["total_fee"] == pytest.approx(expected_total, rel=0.01)

    # -------------------------------------------------------------------------
    # FIA: Security Alert Tests
    # -------------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_log_security_alert_high_risk(self, validator, mock_httpx_client):
        """Test security alert logging for high-risk transaction."""
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            "success": True,
            "alert_id": "alert123",
            "str_triggered": True,
        }
        mock_response.raise_for_status = MagicMock()
        
        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        validator.client = mock_client
        
        result = await validator.log_security_alert(
            user_id="user123",
            transaction_id="txn456",
            risk_score=0.85,
            risk_level="high",
            risk_factors=[
                {"factor": "high_amount", "description": "Amount exceeds normal pattern"}
            ],
        )
        
        assert result["success"] is True
        assert result["str_triggered"] is True
        mock_client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_check_fia_threshold_str(self, validator):
        """Test FIA threshold check for STR reporting."""
        result = validator.check_fia_threshold(25000.0)
        
        assert result["str_required"] is True
        assert result["ctr_required"] is False

    @pytest.mark.asyncio
    async def test_check_fia_threshold_ctr(self, validator):
        """Test FIA threshold check for CTR reporting."""
        result = validator.check_fia_threshold(60000.0)
        
        assert result["str_required"] is True
        assert result["ctr_required"] is True

    @pytest.mark.asyncio
    async def test_check_fia_threshold_below(self, validator):
        """Test FIA threshold check for amount below thresholds."""
        result = validator.check_fia_threshold(5000.0)
        
        assert result["str_required"] is False
        assert result["ctr_required"] is False

    # -------------------------------------------------------------------------
    # PSD-12: Fraud Threshold Tests
    # -------------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_get_fraud_thresholds_success(self, validator, mock_httpx_client):
        """Test fetching fraud thresholds from Node.js."""
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            "low_threshold": 0.3,
            "medium_threshold": 0.6,
            "high_threshold": 0.9,
        }
        mock_response.raise_for_status = MagicMock()
        
        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        validator.client = mock_client
        
        result = await validator.get_fraud_thresholds()
        
        assert result["low_threshold"] == 0.3
        assert result["medium_threshold"] == 0.6
        assert result["high_threshold"] == 0.9

    @pytest.mark.asyncio
    async def test_get_fraud_thresholds_fallback(self, validator):
        """Test fraud thresholds fallback to defaults on failure."""
        mock_client = AsyncMock()
        mock_client.get.side_effect = Exception("Network error")
        validator.client = mock_client
        
        result = await validator.get_fraud_thresholds()
        
        # Should return default thresholds
        assert result["low_threshold"] == 0.3
        assert result["medium_threshold"] == 0.6
        assert result["high_threshold"] == 1.0


class TestConfigSync:
    """Test suite for ConfigSync."""

    @pytest.fixture
    def config_sync(self):
        """Create ConfigSync instance for testing."""
        return ConfigSync(
            node_backend_url="http://localhost:3000",
            cache_ttl_seconds=300,
        )

    @pytest.mark.asyncio
    async def test_get_fraud_thresholds_cache_hit(self, config_sync):
        """Test fraud thresholds cache hit."""
        # Manually populate cache
        from datetime import datetime, timedelta
        config_sync._fraud_thresholds = {"low_threshold": 0.3}
        config_sync._fraud_thresholds_expires_at = datetime.now() + timedelta(minutes=5)
        
        result = await config_sync.get_fraud_thresholds()
        
        assert result == {"low_threshold": 0.3}

    @pytest.mark.asyncio
    async def test_invalidate_cache(self, config_sync):
        """Test cache invalidation."""
        from datetime import datetime, timedelta
        
        # Populate cache
        config_sync._fraud_thresholds = {"test": "data"}
        config_sync._fraud_thresholds_expires_at = datetime.now() + timedelta(minutes=5)
        
        # Invalidate
        await config_sync.invalidate_cache()
        
        assert config_sync._fraud_thresholds is None
        assert config_sync._fraud_thresholds_expires_at is None

    @pytest.mark.asyncio
    async def test_context_manager(self, config_sync):
        """Test ConfigSync as async context manager."""
        async with config_sync as cs:
            assert cs is config_sync
            # Should have started background refresh
        
        # Should have stopped after context exit
        assert config_sync._running is False


# -------------------------------------------------------------------------
# Integration Tests
# -------------------------------------------------------------------------

class TestSecurityGuardianCompliance:
    """Integration tests for Security Guardian with compliance."""

    @pytest.mark.asyncio
    async def test_security_guardian_blocks_limit_breach(self):
        """Test Security Guardian blocks transaction exceeding PSD-1 limits."""
        from smartpay_ai.agents.security_guardian.agent import run_security_guardian
        
        mock_validator = AsyncMock()
        mock_validator.validate_transaction_limits.return_value = {
            "allowed": False,
            "reason": "Transaction exceeds basic tier limit",
        }
        
        transaction = {
            "id": "txn123",
            "amount": 2000.0,
            "user_tier": "basic",
        }
        
        result = await run_security_guardian(
            query="Assess this transaction",
            user_id="user123",
            context={"transaction": transaction},
            compliance_validator=mock_validator,
        )
        
        assert "BLOCKED" in result.summary
        assert result.is_safe is False

    @pytest.mark.asyncio
    async def test_security_guardian_logs_high_risk_alert(self):
        """Test Security Guardian logs high-risk transactions to FIA system."""
        from smartpay_ai.agents.security_guardian.agent import run_security_guardian
        
        mock_validator = AsyncMock()
        mock_validator.validate_transaction_limits.return_value = {"allowed": True}
        mock_validator.log_security_alert.return_value = {
            "success": True,
            "str_triggered": True,
        }
        mock_validator.check_fia_threshold.return_value = {
            "str_required": True,
            "ctr_required": False,
        }
        
        # Mock ML service to return high risk
        mock_ml = MagicMock()
        mock_ml.predict.return_value = {"risk_score": 0.85}
        
        transaction = {
            "id": "txn123",
            "amount": 25000.0,
            "user_tier": "premium",
        }
        
        result = await run_security_guardian(
            query="Assess this transaction",
            user_id="user123",
            context={"transaction": transaction},
            ml_service=mock_ml,
            compliance_validator=mock_validator,
        )
        
        # Should have logged security alert
        mock_validator.log_security_alert.assert_called()


class TestTransactionAnalystCompliance:
    """Integration tests for Transaction Analyst with fee awareness."""

    @pytest.mark.asyncio
    async def test_transaction_analyst_includes_fees_in_budget(self):
        """Test Transaction Analyst includes PSD-11 fees in budget recommendations."""
        from smartpay_ai.agents.transaction_analyst.agent import run_transaction_analyst
        
        mock_validator = AsyncMock()
        mock_validator.estimate_interchange_fee.return_value = {
            "total_fee": 1.50,
        }
        
        result = await run_transaction_analyst(
            query="Generate budget for N$5000 income",
            user_id="user123",
            compliance_validator=mock_validator,
        )
        
        # Should mention fees in analysis
        assert "fee" in result.summary.lower() or "Fee" in result.summary


# -------------------------------------------------------------------------
# Run Tests
# -------------------------------------------------------------------------

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
