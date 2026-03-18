"""
Compliance Validator for Python Backend.

DEPRECATED: This class is deprecated and will be removed in v2.0.0.
Use smartpay_ai.shared.validators functions directly instead.

This class now delegates to smartpay_ai.shared.validators for all operations
while maintaining backward compatibility.

Migration:
    OLD:
        from smartpay_ai.compliance.validator import ComplianceValidator
        validator = ComplianceValidator()
        result = await validator.validate_transaction_limits(...)
    
    NEW:
        from smartpay_ai.shared.validators import validate_transaction_limits
        result = await validate_transaction_limits(...)

For migration guide, see: smartpay_ai/shared/MIGRATION_GUIDE.md

Legacy Features (now delegated to shared validators):
- PSD-1: Transaction limit validation
- PSD-6: Penalty integration and violation logging
- PSD-11: Interchange fee awareness
- FIA: Suspicious transaction monitoring

NOTE: This validator only uses HTTP API calls.
For enhanced validator with database fallback, use:
    smartpay_ai.shared.validators with db_pool parameter

Location: backend_python/smartpay_ai/compliance/validator.py
"""

import logging
import os
import warnings
from typing import Any, Dict, Optional, Tuple

import httpx

# Import shared validators (DRY violation fix - Phase 1)
from smartpay_ai.shared import validators as shared_validators

# Re-export KYCTier for backward compatibility
from smartpay_ai.config.transaction_limits import KYCTier

logger = logging.getLogger(__name__)


class ComplianceValidator:
    """
    DEPRECATED: Use smartpay_ai.shared.validators functions directly.
    
    This class now delegates to shared.validators for backward compatibility.
    Will be removed in v2.0.0
    
    Migration:
        OLD: validator = ComplianceValidator()
             result = await validator.validate_transaction_limits(...)
        
        NEW: from smartpay_ai.shared.validators import validate_transaction_limits
             result = await validate_transaction_limits(...)
    
    Legacy API (delegated to shared validators):
    - PSD-1 transaction limit validation
    - PSD-6 violation logging
    - PSD-11 fee estimation
    - FIA alert generation
    """

    def __init__(
        self,
        node_backend_url: Optional[str] = None,
        timeout: float = 5.0,
    ):
        """
        Initialize compliance validator.
        
        DEPRECATED: This class is deprecated. Use smartpay_ai.shared.validators directly.
        
        Args:
            node_backend_url: Base URL for Node.js backend (defaults to env var)
            timeout: HTTP request timeout in seconds
        """
        warnings.warn(
            "ComplianceValidator is deprecated and will be removed in v2.0.0. "
            "Use smartpay_ai.shared.validators functions directly. "
            "See smartpay_ai/shared/MIGRATION_GUIDE.md for migration instructions.",
            DeprecationWarning,
            stacklevel=2
        )
        
        self.node_backend_url = node_backend_url or os.getenv(
            "NODE_BACKEND_URL", "http://localhost:3000"
        )
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=self.timeout)

    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()

    # -------------------------------------------------------------------------
    # PSD-1: Transaction Limit Validation
    # -------------------------------------------------------------------------

    async def validate_transaction_limits(
        self,
        user_id: str,
        amount: float,
        user_tier: Optional[str] = None,
        daily_spent: Optional[float] = None,
        monthly_spent: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Validate PSD-1/PSD-3 transaction limits.
        
        DEPRECATED: This method delegates to shared.validators.validate_transaction_limits
        
        Args:
            user_id: User ID
            amount: Transaction amount
            user_tier: KYC tier (if known locally)
            daily_spent: Daily spending total (if known locally)
            monthly_spent: Monthly spending total (if known locally)
        
        Returns:
            {
                "allowed": bool,
                "reason": str (if not allowed),
                "remaining_daily": float,
                "remaining_monthly": float,
                "source": "nodejs" | "python_fallback"
            }
        """
        return await shared_validators.validate_transaction_limits(
            user_id=user_id,
            amount=amount,
            user_tier=user_tier,
            daily_spent=daily_spent,
            monthly_spent=monthly_spent,
            http_client=self.client,
            node_backend_url=self.node_backend_url,
        )

    # -------------------------------------------------------------------------
    # PSD-6: Violation Logging
    # -------------------------------------------------------------------------

    async def log_compliance_violation(
        self,
        violation_type: str,
        psd_reference: str,
        severity: str,
        description: str,
        user_id: Optional[str] = None,
        transaction_id: Optional[str] = None,
        remediation_action: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Log compliance violation to Node.js backend.
        
        DEPRECATED: This method delegates to shared.validators.log_compliance_violation
        
        Args:
            violation_type: Type of violation (e.g., "transaction_limit_breach")
            psd_reference: PSD regulation reference (e.g., "PSD-1", "FIA-2012")
            severity: "minor" | "moderate" | "serious" | "critical"
            description: Detailed violation description
            user_id: User ID (if applicable)
            transaction_id: Transaction ID (if applicable)
            remediation_action: Suggested remediation
        
        Returns:
            {"success": bool, "violation_id": str}
        """
        return await shared_validators.log_compliance_violation(
            violation_type=violation_type,
            psd_reference=psd_reference,
            severity=severity,
            description=description,
            user_id=user_id,
            transaction_id=transaction_id,
            remediation_action=remediation_action,
            http_client=self.client,
            node_backend_url=self.node_backend_url,
        )

    # -------------------------------------------------------------------------
    # PSD-11: Interchange Fee Estimation
    # -------------------------------------------------------------------------

    async def estimate_interchange_fee(
        self,
        transaction_type: str,
        card_type: Optional[str] = None,
        amount: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Estimate PSD-11 interchange fees.
        
        DEPRECATED: This method delegates to shared.validators.estimate_interchange_fee
        
        Args:
            transaction_type: "card_retail" | "atm_withdrawal" | "instant_payment"
            card_type: "debit" | "hybrid" | "credit" (for card transactions)
            amount: Transaction amount
        
        Returns:
            {
                "interchange_amount": float,
                "interchange_rate": float,
                "vat_amount": float,
                "total_fee": float,
                "description": str
            }
        """
        return await shared_validators.estimate_interchange_fee(
            transaction_type=transaction_type,
            card_type=card_type,
            amount=amount,
            http_client=self.client,
            node_backend_url=self.node_backend_url,
        )

    # -------------------------------------------------------------------------
    # FIA: Security Alert Logging
    # -------------------------------------------------------------------------

    async def log_security_alert(
        self,
        user_id: str,
        transaction_id: Optional[str],
        risk_score: float,
        risk_level: str,
        risk_factors: list,
        source: str = "security_guardian_ml",
    ) -> Dict[str, Any]:
        """
        Log security alert to transaction_monitoring_alerts table.
        
        DEPRECATED: This method delegates to shared.validators.log_security_alert
        
        Args:
            user_id: User ID
            transaction_id: Transaction ID (if applicable)
            risk_score: ML fraud probability (0-1)
            risk_level: "low" | "medium" | "high"
            risk_factors: List of risk factor details
            source: Alert source identifier
        
        Returns:
            {"success": bool, "alert_id": str, "str_triggered": bool}
        """
        return await shared_validators.log_security_alert(
            user_id=user_id,
            transaction_id=transaction_id,
            risk_score=risk_score,
            risk_level=risk_level,
            risk_factors=risk_factors,
            source=source,
            http_client=self.client,
            node_backend_url=self.node_backend_url,
        )

    # -------------------------------------------------------------------------
    # PSD-12: Fraud Detection Thresholds
    # -------------------------------------------------------------------------

    async def get_fraud_thresholds(self) -> Dict[str, float]:
        """
        Fetch fraud detection thresholds from Node.js KRI config.
        
        DEPRECATED: This method delegates to shared.validators.get_fraud_thresholds
        
        Returns:
            {
                "low_threshold": float,
                "medium_threshold": float,
                "high_threshold": float
            }
        """
        return await shared_validators.get_fraud_thresholds(
            http_client=self.client,
            node_backend_url=self.node_backend_url,
        )

    def check_fia_threshold(self, amount: float) -> Dict[str, bool]:
        """
        Check if transaction meets FIA reporting thresholds.
        
        DEPRECATED: This method delegates to shared.validators.check_fia_threshold
        
        Returns:
            {"str_required": bool, "ctr_required": bool}
        """
        return shared_validators.check_fia_threshold(amount)
