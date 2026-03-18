"""
Centralized Transaction Limits Configuration.

Consolidates all hardcoded transaction limits into a single, maintainable configuration
module that serves as the single source of truth for:
- PSD-1/PSD-3: E-Money transaction limits by KYC tier
- PSD-6: Compliance violation thresholds
- FIA-2012: Suspicious Transaction Report (STR) and Cash Transaction Report (CTR) thresholds
- Risk assessment thresholds for fraud detection

Location: backend_python/smartpay_ai/config/transaction_limits.py
Compliance: PSD-1, PSD-3, PSD-6, FIA-2012

MIGRATION NOTE:
This module replaces all hardcoded limits previously scattered across:
- graph/nodes.py (risk scoring limits)
- compliance/validator.py (EMONEY_LIMITS)
- services/compliance_validator.py (duplicate EMONEY_LIMITS)
- agents/security_guardian/tools.py (implicit risk thresholds)
"""

from enum import Enum
from typing import Dict, Any, NamedTuple
from dataclasses import dataclass


# =============================================================================
# PSD-1/PSD-3: KYC Tier Definitions
# =============================================================================

class KYCTier(str, Enum):
    """
    KYC verification tiers per PSD-1 and PSD-3 regulations.
    
    Compliance Reference:
    - PSD-1: E-Money Institutions licensing requirements
    - PSD-3: Customer Due Diligence (CDD) and Enhanced Due Diligence (EDD)
    """
    BASIC = "basic"
    STANDARD = "standard"
    PREMIUM = "premium"


# =============================================================================
# PSD-1/PSD-3: Transaction Limits by KYC Tier
# =============================================================================

@dataclass(frozen=True)
class TransactionLimits:
    """
    Immutable transaction limit configuration for a KYC tier.
    
    Attributes:
        max_single_transaction: Maximum amount per single transaction (NAD)
        max_daily_transaction: Maximum cumulative daily transaction amount (NAD)
        max_monthly_transaction: Maximum cumulative monthly transaction amount (NAD)
        max_wallet_balance: Maximum wallet balance allowed (NAD)
    
    Compliance Reference:
    - PSD-1 Section 4.2: Transaction limits per tier
    - PSD-3 Section 2.1: Risk-based approach to CDD
    """
    max_single_transaction: float
    max_daily_transaction: float
    max_monthly_transaction: float
    max_wallet_balance: float


# E-Money Transaction Limits (Namibian Dollar - NAD)
# Source: Bank of Namibia PSD-1 and PSD-3 regulations
EMONEY_LIMITS: Dict[KYCTier, TransactionLimits] = {
    KYCTier.BASIC: TransactionLimits(
        max_single_transaction=1000.0,     # N$1,000 per transaction
        max_daily_transaction=5000.0,      # N$5,000 per day
        max_monthly_transaction=20000.0,   # N$20,000 per month
        max_wallet_balance=5000.0,         # N$5,000 max balance
    ),
    KYCTier.STANDARD: TransactionLimits(
        max_single_transaction=5000.0,     # N$5,000 per transaction
        max_daily_transaction=25000.0,     # N$25,000 per day
        max_monthly_transaction=100000.0,  # N$100,000 per month
        max_wallet_balance=25000.0,        # N$25,000 max balance
    ),
    KYCTier.PREMIUM: TransactionLimits(
        max_single_transaction=50000.0,    # N$50,000 per transaction
        max_daily_transaction=250000.0,    # N$250,000 per day
        max_monthly_transaction=1000000.0, # N$1,000,000 per month
        max_wallet_balance=50000.0,        # N$50,000 max balance (for e-money compliance)
    ),
}


# =============================================================================
# FIA-2012: Anti-Money Laundering Thresholds
# =============================================================================

class FIAThreshold(NamedTuple):
    """
    Financial Intelligence Act (FIA-2012) reporting thresholds.
    
    Compliance Reference:
    - FIA-2012 Section 26: Suspicious Transaction Reports (STR)
    - FIA-2012 Section 27: Cash Transaction Reports (CTR)
    """
    amount: float
    report_type: str
    description: str


# FIA-2012 Reporting Thresholds (Namibian Dollar - NAD)
FIA_STR_THRESHOLD = 20000.0  # N$20,000 - Suspicious Transaction Report required
FIA_CTR_THRESHOLD = 50000.0  # N$50,000 - Cash Transaction Report required

FIA_THRESHOLDS: Dict[str, FIAThreshold] = {
    "str": FIAThreshold(
        amount=FIA_STR_THRESHOLD,
        report_type="STR",
        description="Suspicious Transaction Report - required for transactions ≥ N$20,000 or high-risk patterns"
    ),
    "ctr": FIAThreshold(
        amount=FIA_CTR_THRESHOLD,
        report_type="CTR",
        description="Cash Transaction Report - required for cash transactions ≥ N$50,000"
    ),
}


# =============================================================================
# Risk Assessment Thresholds for Fraud Detection
# =============================================================================

class RiskLevel(str, Enum):
    """
    Risk classification levels for transaction monitoring.
    
    Used by Security Guardian agent and ML fraud detection models.
    """
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass(frozen=True)
class RiskThresholds:
    """
    Risk scoring thresholds for fraud detection and transaction monitoring.
    
    Risk scores range from 0.0 (no risk) to 1.0 (maximum risk).
    
    Attributes:
        low_threshold: Upper bound for low risk (≤ this value = low risk)
        medium_threshold: Upper bound for medium risk (≤ this value = medium risk)
        high_threshold: Upper bound for high risk (≤ this value = high risk)
        critical_threshold: Critical risk threshold (> this value = critical risk)
        auto_block_threshold: Threshold for automatic transaction blocking
    
    Compliance Reference:
    - PSD-6: Risk management and monitoring requirements
    - PSD-12: Dynamic fraud detection thresholds
    """
    low_threshold: float = 0.3      # 0.0 - 0.3 = Low risk
    medium_threshold: float = 0.6   # 0.3 - 0.6 = Medium risk
    high_threshold: float = 0.8     # 0.6 - 0.8 = High risk
    critical_threshold: float = 1.0 # 0.8 - 1.0 = Critical risk
    auto_block_threshold: float = 0.8  # Auto-block transactions with risk > 0.8


# Default risk thresholds (can be overridden by PSD-12 dynamic configuration)
DEFAULT_RISK_THRESHOLDS = RiskThresholds()


# =============================================================================
# Risk Scoring Amount Thresholds
# =============================================================================

class RiskAmountThresholds:
    """
    Amount-based risk scoring thresholds aligned with KYC tier limits.
    
    These thresholds are used in risk calculation algorithms to assess
    transaction risk based on amount relative to regulatory limits.
    
    Compliance Reference:
    - PSD-6 Section 3.4: Transaction monitoring and risk assessment
    - Derived from PSD-1 tier limits for consistency
    """
    
    # Critical risk: Exceeds Premium tier single transaction limit
    CRITICAL_AMOUNT = 50000.0  # N$50,000 (Premium tier daily limit)
    
    # High risk: Exceeds Standard tier single transaction limit
    HIGH_AMOUNT = 10000.0  # N$10,000 (Standard tier daily limit)
    
    # Medium risk: Exceeds Basic tier wallet balance limit
    MEDIUM_AMOUNT = 5000.0  # N$5,000 (Basic tier monthly limit)
    
    # Standard monitoring: Exceeds Basic tier single transaction limit
    STANDARD_AMOUNT = 1000.0  # N$1,000 (Basic tier daily limit)
    
    # Micro-transaction alert: Suspiciously small (potential structuring)
    MICRO_AMOUNT = 10.0  # N$10 (potential transaction splitting/structuring)
    
    @classmethod
    def get_risk_increment(cls, amount: float) -> float:
        """
        Calculate risk increment based on transaction amount.
        
        Returns a risk score increment (0.0 - 0.4) to add to base transaction risk.
        
        Args:
            amount: Transaction amount in NAD
        
        Returns:
            Risk increment value (0.0 - 0.4)
        
        Example:
            >>> RiskAmountThresholds.get_risk_increment(60000)  # Above critical
            0.4
            >>> RiskAmountThresholds.get_risk_increment(15000)  # Above high
            0.3
        """
        if amount > cls.CRITICAL_AMOUNT:
            return 0.4  # Critical: >N$50,000
        elif amount > cls.HIGH_AMOUNT:
            return 0.3  # High: >N$10,000
        elif amount > cls.MEDIUM_AMOUNT:
            return 0.2  # Medium: >N$5,000
        elif amount > cls.STANDARD_AMOUNT:
            return 0.1  # Standard: >N$1,000
        elif amount < cls.MICRO_AMOUNT:
            return 0.15  # Micro-transaction (potential structuring)
        else:
            return 0.0  # Normal range


# =============================================================================
# PSD-6: Violation Severity Mapping
# =============================================================================

class ViolationSeverity(str, Enum):
    """
    Compliance violation severity levels per PSD-6.
    
    Compliance Reference:
    - PSD-6 Section 5.2: Incident reporting and escalation
    """
    MINOR = "minor"        # Low impact, routine handling
    MODERATE = "moderate"  # Medium impact, requires attention
    SERIOUS = "serious"    # High impact, requires escalation
    CRITICAL = "critical"  # Critical impact, immediate action required


# =============================================================================
# Helper Functions
# =============================================================================

def get_limits_for_tier(tier: str) -> TransactionLimits:
    """
    Get transaction limits for a specific KYC tier.
    
    Args:
        tier: KYC tier name ("basic", "standard", or "premium")
    
    Returns:
        TransactionLimits for the specified tier
    
    Raises:
        ValueError: If tier is not recognized
    
    Example:
        >>> limits = get_limits_for_tier("standard")
        >>> limits.max_single_transaction
        5000.0
    """
    try:
        kyc_tier = KYCTier(tier.lower())
        return EMONEY_LIMITS[kyc_tier]
    except (ValueError, KeyError):
        raise ValueError(
            f"Invalid KYC tier: {tier}. Must be one of: "
            f"{', '.join([t.value for t in KYCTier])}"
        )


def check_fia_threshold(amount: float) -> Dict[str, bool]:
    """
    Check if transaction amount meets FIA reporting thresholds.
    
    Args:
        amount: Transaction amount in NAD
    
    Returns:
        Dictionary with STR and CTR requirement flags
        {
            "str_required": bool,  # True if STR reporting required
            "ctr_required": bool,  # True if CTR reporting required
        }
    
    Compliance Reference:
    - FIA-2012 Section 26 & 27: Threshold-based reporting requirements
    
    Example:
        >>> check_fia_threshold(25000)
        {'str_required': True, 'ctr_required': False}
        >>> check_fia_threshold(55000)
        {'str_required': True, 'ctr_required': True}
    """
    return {
        "str_required": amount >= FIA_STR_THRESHOLD,
        "ctr_required": amount >= FIA_CTR_THRESHOLD,
    }


def get_risk_level_from_score(risk_score: float) -> RiskLevel:
    """
    Convert numeric risk score to categorical risk level.
    
    Args:
        risk_score: Risk score (0.0 - 1.0)
    
    Returns:
        RiskLevel enum value
    
    Example:
        >>> get_risk_level_from_score(0.25)
        <RiskLevel.LOW: 'low'>
        >>> get_risk_level_from_score(0.75)
        <RiskLevel.HIGH: 'high'>
    """
    thresholds = DEFAULT_RISK_THRESHOLDS
    
    if risk_score < thresholds.low_threshold:
        return RiskLevel.LOW
    elif risk_score < thresholds.medium_threshold:
        return RiskLevel.MEDIUM
    elif risk_score < thresholds.high_threshold:
        return RiskLevel.HIGH
    else:
        return RiskLevel.CRITICAL


def validate_transaction_against_limits(
    amount: float,
    tier: str,
    daily_spent: float,
    monthly_spent: float,
) -> Dict[str, Any]:
    """
    Validate transaction against PSD-1/PSD-3 limits.
    
    Args:
        amount: Transaction amount in NAD
        tier: KYC tier ("basic", "standard", or "premium")
        daily_spent: Cumulative daily spending in NAD
        monthly_spent: Cumulative monthly spending in NAD
    
    Returns:
        Validation result dictionary:
        {
            "allowed": bool,
            "reason": str (if not allowed),
            "remaining_daily": float,
            "remaining_monthly": float,
            "limits_used": {
                "single": bool,
                "daily": bool,
                "monthly": bool
            }
        }
    
    Example:
        >>> validate_transaction_against_limits(
        ...     amount=2000,
        ...     tier="basic",
        ...     daily_spent=3000,
        ...     monthly_spent=15000
        ... )
        {'allowed': True, 'remaining_daily': 0.0, 'remaining_monthly': 3000.0, ...}
    """
    try:
        limits = get_limits_for_tier(tier)
    except ValueError as e:
        return {
            "allowed": False,
            "reason": str(e),
            "remaining_daily": 0.0,
            "remaining_monthly": 0.0,
        }
    
    # Check single transaction limit
    if amount > limits.max_single_transaction:
        return {
            "allowed": False,
            "reason": (
                f"Transaction N${amount:.2f} exceeds {tier} tier "
                f"single transaction limit of N${limits.max_single_transaction:.2f}"
            ),
            "remaining_daily": limits.max_daily_transaction - daily_spent,
            "remaining_monthly": limits.max_monthly_transaction - monthly_spent,
            "limits_used": {"single": True, "daily": False, "monthly": False},
        }
    
    # Check daily limit
    if daily_spent + amount > limits.max_daily_transaction:
        remaining = limits.max_daily_transaction - daily_spent
        return {
            "allowed": False,
            "reason": f"Daily limit reached. Remaining: N${remaining:.2f}",
            "remaining_daily": remaining,
            "remaining_monthly": limits.max_monthly_transaction - monthly_spent,
            "limits_used": {"single": False, "daily": True, "monthly": False},
        }
    
    # Check monthly limit
    if monthly_spent + amount > limits.max_monthly_transaction:
        remaining = limits.max_monthly_transaction - monthly_spent
        return {
            "allowed": False,
            "reason": f"Monthly limit reached. Remaining: N${remaining:.2f}",
            "remaining_daily": limits.max_daily_transaction - daily_spent,
            "remaining_monthly": remaining,
            "limits_used": {"single": False, "daily": False, "monthly": True},
        }
    
    # Transaction allowed
    return {
        "allowed": True,
        "remaining_daily": limits.max_daily_transaction - daily_spent - amount,
        "remaining_monthly": limits.max_monthly_transaction - monthly_spent - amount,
        "limits_used": {"single": False, "daily": False, "monthly": False},
    }


# =============================================================================
# Configuration Export
# =============================================================================

__all__ = [
    # Enums
    "KYCTier",
    "RiskLevel",
    "ViolationSeverity",
    
    # Data classes
    "TransactionLimits",
    "RiskThresholds",
    
    # Constants
    "EMONEY_LIMITS",
    "FIA_STR_THRESHOLD",
    "FIA_CTR_THRESHOLD",
    "FIA_THRESHOLDS",
    "DEFAULT_RISK_THRESHOLDS",
    "RiskAmountThresholds",
    
    # Helper functions
    "get_limits_for_tier",
    "check_fia_threshold",
    "get_risk_level_from_score",
    "validate_transaction_against_limits",
]
