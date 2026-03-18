"""
Compliance Validator Service - Enhanced with Direct Database Persistence.

DEPRECATED: This class is deprecated and will be removed in v2.0.0.
Use smartpay_ai.shared.validators functions directly instead.

This class now delegates to smartpay_ai.shared.validators for all operations
while maintaining backward compatibility.

Migration:
    OLD:
        from smartpay_ai.services.compliance_validator import ComplianceValidator
        validator = ComplianceValidator()
        result = await validator.validate_transaction_limits(...)
    
    NEW:
        from smartpay_ai.shared.validators import validate_transaction_limits
        result = await validate_transaction_limits(
            user_id="...",
            amount=5000.0,
            db_pool=db_pool,  # For database fallback support
        )

For migration guide, see: smartpay_ai/shared/MIGRATION_GUIDE.md

Legacy Features (now delegated to shared validators):
- PSD-1: Transaction limit validation (primary: Node.js, fallback: Python)
- PSD-6: Violation logging (primary: Node.js, fallback: PostgreSQL direct)
- PSD-11: Interchange fee estimation
- PSD-12: Dynamic fraud thresholds
- FIA: Security alert persistence (with database fallback)

Location: backend_python/smartpay_ai/services/compliance_validator.py
"""

import logging
import os
import warnings
from typing import Any, Dict, Optional
from datetime import datetime

import httpx
import asyncpg

# Import shared validators (DRY violation fix - Phase 1)
from smartpay_ai.shared import validators as shared_validators

logger = logging.getLogger(__name__)


class ComplianceValidator:
    """
    DEPRECATED: Use smartpay_ai.shared.validators functions directly.
    
    This class now delegates to shared.validators for backward compatibility.
    Will be removed in v2.0.0
    
    Migration:
        OLD: validator = ComplianceValidator(db_connection_string="...")
             result = await validator.validate_transaction_limits(...)
        
        NEW: from smartpay_ai.shared.validators import validate_transaction_limits
             result = await validate_transaction_limits(
                 user_id="...",
                 amount=5000.0,
                 db_pool=db_pool,  # Pass pool directly for fallback support
             )
    
    Legacy Features (delegated to shared validators):
    - Dual-mode operation (HTTP API + direct DB)
    - Automatic fallback on Node.js unavailability
    - Database connection pooling
    - Comprehensive error handling
    - Audit trail for all compliance actions
    """

    def __init__(
        self,
        node_backend_url: Optional[str] = None,
        db_connection_string: Optional[str] = None,
        timeout: float = 5.0,
    ):
        """
        Initialize compliance validator.
        
        DEPRECATED: This class is deprecated. Use smartpay_ai.shared.validators directly.
        
        Args:
            node_backend_url: Base URL for Node.js backend
            db_connection_string: PostgreSQL connection string for direct access
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
            "NODE_BACKEND_URL", "http://localhost:4000"
        )
        self.db_connection_string = db_connection_string or os.getenv(
            "DATABASE_URL", ""
        )
        self.timeout = timeout
        self.http_client = httpx.AsyncClient(timeout=self.timeout)
        self.db_pool: Optional[asyncpg.Pool] = None
        
        # Track fallback usage for monitoring
        self.fallback_count = 0
        self.api_call_count = 0

    async def initialize_db_pool(self):
        """Initialize PostgreSQL connection pool for fallback mode."""
        if not self.db_connection_string:
            logger.warning("No database connection string provided - direct DB persistence disabled")
            return
        
        try:
            self.db_pool = await asyncpg.create_pool(
                self.db_connection_string,
                min_size=1,
                max_size=5,
                command_timeout=10,
            )
            logger.info("Database connection pool initialized for compliance validator")
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {e}")
            self.db_pool = None

    async def close(self):
        """Close HTTP client and database pool."""
        await self.http_client.aclose()
        if self.db_pool:
            await self.db_pool.close()

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
            user_tier: KYC tier (for fallback)
            daily_spent: Daily spending (for fallback)
            monthly_spent: Monthly spending (for fallback)
        
        Returns:
            {
                "allowed": bool,
                "reason": str,
                "remaining_daily": float,
                "remaining_monthly": float,
                "source": "nodejs" | "python_fallback"
            }
        """
        self.api_call_count += 1
        result = await shared_validators.validate_transaction_limits(
            user_id=user_id,
            amount=amount,
            user_tier=user_tier,
            daily_spent=daily_spent,
            monthly_spent=monthly_spent,
            http_client=self.http_client,
            node_backend_url=self.node_backend_url,
        )
        
        if result.get("source") == "python_fallback":
            self.fallback_count += 1
        
        return result

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
        Log compliance violation.
        
        DEPRECATED: This method delegates to shared.validators.log_compliance_violation
        
        Args:
            violation_type: Type of violation
            psd_reference: PSD regulation reference
            severity: "minor" | "moderate" | "serious" | "critical"
            description: Detailed description
            user_id: User ID (optional)
            transaction_id: Transaction ID (optional)
            remediation_action: Suggested remediation
        
        Returns:
            {"success": bool, "violation_id": str}
        """
        self.api_call_count += 1
        
        result = await shared_validators.log_compliance_violation(
            violation_type=violation_type,
            psd_reference=psd_reference,
            severity=severity,
            description=description,
            user_id=user_id,
            transaction_id=transaction_id,
            remediation_action=remediation_action,
            http_client=self.http_client,
            node_backend_url=self.node_backend_url,
            db_pool=self.db_pool,
        )
        
        if result.get("source") in ("database_fallback", "python_fallback"):
            self.fallback_count += 1
        
        return result

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
            transaction_type: Transaction type
            card_type: Card type (for card transactions)
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
        self.api_call_count += 1
        
        result = await shared_validators.estimate_interchange_fee(
            transaction_type=transaction_type,
            card_type=card_type,
            amount=amount,
            http_client=self.http_client,
            node_backend_url=self.node_backend_url,
        )
        
        if result.get("source") == "python_fallback":
            self.fallback_count += 1
        
        return result

    # -------------------------------------------------------------------------
    # FIA: Security Alert Logging (WITH DATABASE FALLBACK)
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
        Log security alert with database fallback.
        
        DEPRECATED: This method delegates to shared.validators.log_security_alert
        
        Args:
            user_id: User ID
            transaction_id: Transaction ID (if applicable)
            risk_score: ML fraud probability (0-1)
            risk_level: "low" | "medium" | "high" | "critical"
            risk_factors: List of risk factor details
            source: Alert source identifier
        
        Returns:
            {"success": bool, "alert_id": str, "str_triggered": bool}
        """
        self.api_call_count += 1
        
        result = await shared_validators.log_security_alert(
            user_id=user_id,
            transaction_id=transaction_id,
            risk_score=risk_score,
            risk_level=risk_level,
            risk_factors=risk_factors,
            source=source,
            http_client=self.http_client,
            node_backend_url=self.node_backend_url,
            db_pool=self.db_pool,
        )
        
        if result.get("source") in ("database_fallback", "python_fallback"):
            self.fallback_count += 1
        
        return result

    def check_fia_threshold(self, amount: float) -> Dict[str, bool]:
        """
        Check if transaction meets FIA reporting thresholds.
        
        DEPRECATED: This method delegates to shared.validators.check_fia_threshold
        
        Returns:
            {"str_required": bool, "ctr_required": bool}
        """
        return shared_validators.check_fia_threshold(amount)
    
    def get_fallback_stats(self) -> Dict[str, Any]:
        """
        Get statistics on fallback usage for monitoring.
        
        Note: This method is NOT deprecated as it tracks class-specific metrics.
        """
        return {
            "total_api_calls": self.api_call_count,
            "fallback_count": self.fallback_count,
            "fallback_rate": (
                (self.fallback_count / self.api_call_count * 100)
                if self.api_call_count > 0
                else 0
            ),
            "db_pool_active": self.db_pool is not None,
        }
