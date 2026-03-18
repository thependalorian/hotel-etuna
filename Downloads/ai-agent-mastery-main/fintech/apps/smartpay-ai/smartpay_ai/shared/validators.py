"""
Shared Compliance Validators - DRY Violation Fix #1

Centralizes all duplicate compliance validation logic from:
- smartpay_ai.compliance.validator
- smartpay_ai.services.compliance_validator

Provides:
- PSD-1 through PSD-13 compliance checks
- FIA reporting threshold validation
- Interchange fee calculations (PSD-11)
- Transaction limit validation with fallback
- Violation logging with dual-mode (API + DB)

Location: backend_python/smartpay_ai/shared/validators.py

MIGRATION GUIDE:
See bottom of file for import update instructions.
"""

import logging
import os
from typing import Any, Dict, Optional, Tuple, List
from datetime import datetime, timedelta
from enum import Enum

import httpx
import asyncpg

# Import centralized transaction limits (PSD-6 compliance)
from smartpay_ai.config.transaction_limits import (
    KYCTier,
    ViolationSeverity,
    EMONEY_LIMITS,
    FIA_STR_THRESHOLD,
    FIA_CTR_THRESHOLD,
    get_limits_for_tier,
    check_fia_threshold as config_check_fia_threshold,
)

logger = logging.getLogger(__name__)


# =============================================================================
# Type Definitions
# =============================================================================

class ValidationMode(str, Enum):
    """Validation operation mode."""
    API_ONLY = "api_only"           # Only use Node.js API (fail if unavailable)
    API_WITH_FALLBACK = "fallback"  # Try API, fall back to local/DB
    LOCAL_ONLY = "local"            # Only use local validation


class ValidationSource(str, Enum):
    """Source of validation result."""
    NODEJS_API = "nodejs"
    PYTHON_FALLBACK = "python_fallback"
    DATABASE_FALLBACK = "database_fallback"


# =============================================================================
# PSD-1: Transaction Limit Validation
# =============================================================================

async def validate_transaction_limits(
    user_id: str,
    amount: float,
    user_tier: Optional[str] = None,
    daily_spent: Optional[float] = None,
    monthly_spent: Optional[float] = None,
    http_client: Optional[httpx.AsyncClient] = None,
    node_backend_url: Optional[str] = None,
    mode: ValidationMode = ValidationMode.API_WITH_FALLBACK,
) -> Dict[str, Any]:
    """
    Validate PSD-1/PSD-3 transaction limits with configurable fallback.
    
    Supports three modes:
    - API_ONLY: Only use Node.js backend (fail if unavailable)
    - API_WITH_FALLBACK: Try Node.js, fall back to local validation
    - LOCAL_ONLY: Skip API, use local validation only
    
    Args:
        user_id: User ID for validation
        amount: Transaction amount to validate
        user_tier: KYC tier (required for fallback modes)
        daily_spent: Daily spending total (required for fallback)
        monthly_spent: Monthly spending total (required for fallback)
        http_client: Optional httpx client (created if not provided)
        node_backend_url: Node.js backend URL (defaults to env var)
        mode: Validation mode (see ValidationMode enum)
    
    Returns:
        {
            "allowed": bool,
            "reason": str (if not allowed),
            "remaining_daily": float,
            "remaining_monthly": float,
            "source": str (nodejs|python_fallback)
        }
    
    Raises:
        ValueError: If mode is API_ONLY and API fails, or required fallback params missing
    
    Examples:
        # Standard API with fallback
        result = await validate_transaction_limits(
            user_id="usr_123",
            amount=5000.0,
            user_tier="tier2",
            daily_spent=10000.0,
            monthly_spent=45000.0
        )
        
        # API only (strict mode)
        result = await validate_transaction_limits(
            user_id="usr_123",
            amount=5000.0,
            mode=ValidationMode.API_ONLY
        )
        
        # Local only (no network calls)
        result = await validate_transaction_limits(
            user_id="usr_123",
            amount=5000.0,
            user_tier="tier2",
            daily_spent=10000.0,
            monthly_spent=45000.0,
            mode=ValidationMode.LOCAL_ONLY
        )
    """
    backend_url = node_backend_url or os.getenv("NODE_BACKEND_URL", "http://localhost:3000")
    
    # API validation
    if mode in (ValidationMode.API_ONLY, ValidationMode.API_WITH_FALLBACK):
        client_provided = http_client is not None
        client = http_client or httpx.AsyncClient(timeout=5.0)
        
        try:
            response = await client.post(
                f"{backend_url}/api/v1/compliance/validate-limits",
                json={"user_id": user_id, "amount": amount},
            )
            response.raise_for_status()
            result = response.json()
            result["source"] = ValidationSource.NODEJS_API
            return result
        
        except Exception as e:
            if mode == ValidationMode.API_ONLY:
                raise ValueError(f"API validation failed in API_ONLY mode: {e}")
            
            logger.warning(f"Node.js limit validation failed, using fallback: {e}")
        
        finally:
            if not client_provided:
                await client.aclose()
    
    # Local fallback validation
    if not user_tier or daily_spent is None or monthly_spent is None:
        return {
            "allowed": False,
            "reason": "Cannot validate limits: missing tier/spending data",
            "source": ValidationSource.PYTHON_FALLBACK,
        }
    
    is_valid, error_msg = validate_emoney_limits_local(
        user_tier, amount, daily_spent, monthly_spent
    )
    
    if not is_valid:
        return {
            "allowed": False,
            "reason": error_msg,
            "source": ValidationSource.PYTHON_FALLBACK,
        }
    
    # Calculate remaining limits
    limits = get_limits_for_tier(user_tier)
    remaining_daily = limits.max_daily_transaction - daily_spent - amount
    remaining_monthly = limits.max_monthly_transaction - monthly_spent - amount
    
    return {
        "allowed": True,
        "remaining_daily": remaining_daily,
        "remaining_monthly": remaining_monthly,
        "source": ValidationSource.PYTHON_FALLBACK,
    }


def validate_emoney_limits_local(
    user_tier: str,
    amount: float,
    daily_spent: float,
    monthly_spent: float,
) -> Tuple[bool, Optional[str]]:
    """
    Local PSD-1/PSD-3 transaction limit validation.
    
    Uses centralized transaction limits from config.transaction_limits.
    This is the core validation logic used by both validator classes.
    
    Args:
        user_tier: KYC tier (basic, tier1, tier2, tier3)
        amount: Transaction amount
        daily_spent: Total daily spending before this transaction
        monthly_spent: Total monthly spending before this transaction
    
    Returns:
        Tuple of (is_valid: bool, error_message: Optional[str])
        - (True, None) if validation passes
        - (False, "error message") if validation fails
    
    Validation Rules (PSD-1/PSD-3):
        1. Single transaction must not exceed tier's max_single_transaction
        2. Daily spending + amount must not exceed max_daily_transaction
        3. Monthly spending + amount must not exceed max_monthly_transaction
    
    Examples:
        >>> validate_emoney_limits_local("tier2", 5000.0, 10000.0, 45000.0)
        (True, None)
        
        >>> validate_emoney_limits_local("tier1", 50000.0, 0.0, 0.0)
        (False, "Transaction N$50000.00 exceeds tier1 tier limit of N$10000.00")
    """
    try:
        limits = get_limits_for_tier(user_tier)
    except ValueError as e:
        return False, str(e)
    
    # Check single transaction limit (PSD-1)
    if amount > limits.max_single_transaction:
        return (
            False,
            f"Transaction N${amount:.2f} exceeds {user_tier} tier limit of N${limits.max_single_transaction:.2f}",
        )
    
    # Check daily limit (PSD-3)
    if daily_spent + amount > limits.max_daily_transaction:
        remaining = limits.max_daily_transaction - daily_spent
        return (
            False,
            f"Daily limit reached. Remaining: N${remaining:.2f}",
        )
    
    # Check monthly limit (PSD-3)
    if monthly_spent + amount > limits.max_monthly_transaction:
        remaining = limits.max_monthly_transaction - monthly_spent
        return (
            False,
            f"Monthly limit reached. Remaining: N${remaining:.2f}",
        )
    
    return True, None


# =============================================================================
# PSD-11: Interchange Fee Estimation
# =============================================================================

async def estimate_interchange_fee(
    transaction_type: str,
    card_type: Optional[str] = None,
    amount: float = 0.0,
    http_client: Optional[httpx.AsyncClient] = None,
    node_backend_url: Optional[str] = None,
    mode: ValidationMode = ValidationMode.API_WITH_FALLBACK,
) -> Dict[str, Any]:
    """
    Estimate PSD-11 interchange fees with configurable fallback.
    
    Supports transaction types:
    - card_retail: Retail card transactions (requires card_type)
    - atm_withdrawal: ATM cash withdrawals
    - instant_payment: Real-time payment transfers
    
    Card types (for card_retail):
    - debit: 0.5% interchange rate
    - hybrid: 0.75% interchange rate
    - credit: 1.55% interchange rate
    
    Args:
        transaction_type: Transaction type (see above)
        card_type: Card type (required for card_retail)
        amount: Transaction amount
        http_client: Optional httpx client
        node_backend_url: Node.js backend URL
        mode: Validation mode
    
    Returns:
        {
            "interchange_amount": float,      # Base interchange fee
            "interchange_rate": float,        # Rate applied (for card transactions)
            "vat_amount": float,              # 15% VAT on interchange
            "total_fee": float,               # Total fee including VAT
            "description": str,               # Human-readable description
            "source": str                     # nodejs|python_fallback
        }
    
    PSD-11 Fee Schedule:
        Card Retail:
            - Debit: 0.5% of transaction
            - Hybrid: 0.75% of transaction
            - Credit: 1.55% of transaction
        
        ATM Withdrawal:
            - Base: N$4.00
            - Variable: N$0.80 per N$100
        
        Instant Payment:
            - Flat: N$1.25
        
        All fees + 15% VAT
    
    Examples:
        # Card purchase
        >>> await estimate_interchange_fee("card_retail", "debit", 10000.0)
        {
            "interchange_amount": 50.0,
            "interchange_rate": 0.005,
            "vat_amount": 7.5,
            "total_fee": 57.5,
            "description": "Card debit retail purchase interchange"
        }
        
        # ATM withdrawal
        >>> await estimate_interchange_fee("atm_withdrawal", amount=5000.0)
        {
            "interchange_amount": 44.0,  # 4 + (5000/100)*0.8
            "vat_amount": 6.6,
            "total_fee": 50.6,
            "description": "ATM reverse interchange"
        }
    """
    backend_url = node_backend_url or os.getenv("NODE_BACKEND_URL", "http://localhost:3000")
    
    # API validation
    if mode in (ValidationMode.API_ONLY, ValidationMode.API_WITH_FALLBACK):
        client_provided = http_client is not None
        client = http_client or httpx.AsyncClient(timeout=5.0)
        
        try:
            response = await client.post(
                f"{backend_url}/api/v1/compliance/estimate-fees",
                json={
                    "transaction_type": transaction_type,
                    "card_type": card_type,
                    "amount": amount,
                },
            )
            response.raise_for_status()
            result = response.json()
            result["source"] = ValidationSource.NODEJS_API
            return result
        
        except Exception as e:
            if mode == ValidationMode.API_ONLY:
                raise ValueError(f"Fee estimation failed in API_ONLY mode: {e}")
            
            logger.warning(f"Fee estimation API failed, using fallback: {e}")
        
        finally:
            if not client_provided:
                await client.aclose()
    
    # Local fallback
    return estimate_interchange_fee_local(transaction_type, card_type, amount)


def estimate_interchange_fee_local(
    transaction_type: str,
    card_type: Optional[str],
    amount: float,
) -> Dict[str, Any]:
    """
    Local PSD-11 interchange fee calculation using centralized calculator.
    
    MIGRATION NOTE: This function now delegates to the centralized fee_calculator
    module, eliminating duplicate PSD-11 rate definitions.
    
    Previous implementation (76 lines) replaced with import + delegation.
    
    Args:
        transaction_type: Transaction type
        card_type: Card type (for card_retail)
        amount: Transaction amount
    
    Returns:
        Fee breakdown dictionary
    """
    from smartpay_ai.shared.fee_calculator import LegacyFeeCalculator
    
    legacy_calc = LegacyFeeCalculator()
    return legacy_calc.estimate_fee_local(transaction_type, card_type, amount)


# =============================================================================
# PSD-6: Violation Logging
# =============================================================================

async def log_compliance_violation(
    violation_type: str,
    psd_reference: str,
    severity: str,
    description: str,
    user_id: Optional[str] = None,
    transaction_id: Optional[str] = None,
    remediation_action: Optional[str] = None,
    http_client: Optional[httpx.AsyncClient] = None,
    node_backend_url: Optional[str] = None,
    db_pool: Optional[asyncpg.Pool] = None,
    mode: ValidationMode = ValidationMode.API_WITH_FALLBACK,
) -> Dict[str, Any]:
    """
    Log compliance violation with dual-mode support (API + database fallback).
    
    Violation severity levels (PSD-6):
    - minor: Low impact, 30-day reporting deadline
    - moderate: Medium impact, 7-day reporting deadline
    - serious: High impact, 24-hour reporting deadline
    - critical: Immediate action required, 4-hour deadline
    
    Args:
        violation_type: Type of violation (e.g., "transaction_limit_breach")
        psd_reference: PSD regulation reference (e.g., "PSD-1", "FIA-2012")
        severity: Severity level (minor|moderate|serious|critical)
        description: Detailed violation description
        user_id: User ID (if applicable)
        transaction_id: Transaction ID (if applicable)
        remediation_action: Suggested remediation steps
        http_client: Optional httpx client
        node_backend_url: Node.js backend URL
        db_pool: Optional asyncpg pool for database fallback
        mode: Validation mode
    
    Returns:
        {
            "success": bool,
            "violation_id": str,
            "source": str (nodejs|database_fallback)
        }
    
    Database Schema (compliance_violations):
        - id: UUID (primary key)
        - violation_type: VARCHAR
        - psd_reference: VARCHAR
        - description: TEXT
        - severity: VARCHAR
        - reporting_deadline: TIMESTAMP
        - remediation_action: TEXT
        - metadata: JSONB
        - created_at: TIMESTAMP
    
    Examples:
        >>> await log_compliance_violation(
        ...     violation_type="daily_limit_exceeded",
        ...     psd_reference="PSD-1",
        ...     severity="serious",
        ...     description="User exceeded N$50,000 daily limit",
        ...     user_id="usr_123",
        ...     transaction_id="txn_456"
        ... )
        {"success": True, "violation_id": "vio_789", "source": "nodejs"}
    """
    backend_url = node_backend_url or os.getenv("NODE_BACKEND_URL", "http://localhost:3000")
    
    payload = {
        "violation_type": violation_type,
        "psd_reference": psd_reference,
        "severity": severity,
        "description": description,
        "user_id": user_id,
        "transaction_id": transaction_id,
        "remediation_action": remediation_action,
        "source": "python_backend",
    }
    
    # API logging
    if mode in (ValidationMode.API_ONLY, ValidationMode.API_WITH_FALLBACK):
        client_provided = http_client is not None
        client = http_client or httpx.AsyncClient(timeout=5.0)
        
        try:
            response = await client.post(
                f"{backend_url}/api/v1/compliance/violations",
                json=payload,
            )
            response.raise_for_status()
            result = response.json()
            result["source"] = ValidationSource.NODEJS_API
            return result
        
        except Exception as e:
            if mode == ValidationMode.API_ONLY:
                raise ValueError(f"Violation logging failed in API_ONLY mode: {e}")
            
            logger.warning(f"Node.js violation logging failed, using database fallback: {e}")
        
        finally:
            if not client_provided:
                await client.aclose()
    
    # Database fallback
    if not db_pool:
        logger.error("No database pool available for fallback violation logging")
        return {
            "success": False,
            "error": "Database fallback unavailable - no connection pool"
        }
    
    try:
        reporting_deadline = calculate_reporting_deadline(severity)
        
        async with db_pool.acquire() as conn:
            result = await conn.fetchrow(
                """
                INSERT INTO compliance_violations (
                    violation_type, psd_reference, description, severity,
                    reporting_deadline, remediation_action, metadata, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                RETURNING id
                """,
                violation_type,
                psd_reference,
                description,
                severity,
                reporting_deadline,
                remediation_action,
                {
                    "user_id": user_id,
                    "transaction_id": transaction_id,
                    "source": "python_backend_fallback",
                },
            )
        
        violation_id = result["id"]
        logger.info(f"Violation logged via database fallback: {violation_id}")
        
        return {
            "success": True,
            "violation_id": str(violation_id),
            "source": ValidationSource.DATABASE_FALLBACK,
        }
    
    except Exception as db_error:
        logger.error(f"Database fallback violation logging failed: {db_error}")
        return {
            "success": False,
            "error": f"Database fallback failed: {db_error}",
        }


def calculate_reporting_deadline(severity: str) -> datetime:
    """
    Calculate PSD-6 reporting deadline based on violation severity.
    
    Reporting Deadlines (PSD-6):
    - critical: 4 hours from detection
    - serious: 24 hours from detection
    - moderate: 7 days from detection
    - minor: 30 days from detection
    
    Args:
        severity: Violation severity level
    
    Returns:
        Datetime object representing the reporting deadline
    
    Examples:
        >>> calculate_reporting_deadline("critical")
        datetime(2024, 1, 15, 16, 0, 0)  # 4 hours from now
        
        >>> calculate_reporting_deadline("serious")
        datetime(2024, 1, 16, 12, 0, 0)  # 24 hours from now
    """
    now = datetime.now()
    
    deadlines = {
        "critical": timedelta(hours=4),
        "serious": timedelta(hours=24),
        "moderate": timedelta(days=7),
        "minor": timedelta(days=30),
    }
    
    delta = deadlines.get(severity, timedelta(days=7))
    return now + delta


# =============================================================================
# FIA: Security Alert Logging
# =============================================================================

async def log_security_alert(
    user_id: str,
    transaction_id: Optional[str],
    risk_score: float,
    risk_level: str,
    risk_factors: List[Dict[str, Any]],
    source: str = "security_guardian_ml",
    http_client: Optional[httpx.AsyncClient] = None,
    node_backend_url: Optional[str] = None,
    db_pool: Optional[asyncpg.Pool] = None,
    mode: ValidationMode = ValidationMode.API_WITH_FALLBACK,
) -> Dict[str, Any]:
    """
    Log security alert with FIA STR/CTR threshold checking.
    
    Automatically triggers Suspicious Transaction Report (STR) workflow if:
    - Transaction amount >= N$5,000,000 (FIA_STR_THRESHOLD), OR
    - Risk score >= 0.7 (70% fraud probability)
    
    Risk Levels:
    - low: Risk score < 0.5
    - medium: Risk score 0.5-0.6
    - high: Risk score 0.7-0.89
    - critical: Risk score >= 0.9
    
    Args:
        user_id: User ID
        transaction_id: Transaction ID (if applicable)
        risk_score: ML fraud probability (0.0-1.0)
        risk_level: Risk level classification (low|medium|high|critical)
        risk_factors: List of risk factor details
        source: Alert source identifier
        http_client: Optional httpx client
        node_backend_url: Node.js backend URL
        db_pool: Optional asyncpg pool for database fallback
        mode: Validation mode
    
    Returns:
        {
            "success": bool,
            "alert_id": str,
            "str_triggered": bool,  # True if STR workflow initiated
            "source": str
        }
    
    Database Schema (transaction_monitoring_alerts):
        - id: UUID (primary key)
        - alert_type: VARCHAR
        - severity: VARCHAR (low|medium|high|critical)
        - status: VARCHAR (open|investigating|resolved|false_positive)
        - user_id: UUID
        - wallet_id: UUID (nullable)
        - transaction_id: UUID (nullable)
        - alert_reason: TEXT
        - risk_score: NUMERIC (0-100)
        - detection_method: VARCHAR
        - transaction_amount: NUMERIC
        - transaction_type: VARCHAR
        - user_kyc_tier: VARCHAR
        - metadata: JSONB
        - detected_at: TIMESTAMP
    
    Examples:
        >>> await log_security_alert(
        ...     user_id="usr_123",
        ...     transaction_id="txn_456",
        ...     risk_score=0.85,
        ...     risk_level="high",
        ...     risk_factors=[
        ...         {"factor": "velocity", "score": 0.9, "is_flagged": True},
        ...         {"factor": "location", "score": 0.6, "is_flagged": False}
        ...     ]
        ... )
        {"success": True, "alert_id": "alt_789", "str_triggered": True}
    """
    backend_url = node_backend_url or os.getenv("NODE_BACKEND_URL", "http://localhost:3000")
    
    payload = {
        "user_id": user_id,
        "transaction_id": transaction_id,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_factors": risk_factors,
        "source": source,
    }
    
    # API logging
    if mode in (ValidationMode.API_ONLY, ValidationMode.API_WITH_FALLBACK):
        client_provided = http_client is not None
        client = http_client or httpx.AsyncClient(timeout=5.0)
        
        try:
            response = await client.post(
                f"{backend_url}/api/v1/compliance/security-alert",
                json=payload,
            )
            response.raise_for_status()
            result = response.json()
            result["source"] = ValidationSource.NODEJS_API
            
            if result.get("str_triggered"):
                logger.warning(
                    f"STR triggered: transaction_id={transaction_id}, "
                    f"user_id={user_id}, risk_score={risk_score}"
                )
            
            return result
        
        except Exception as e:
            if mode == ValidationMode.API_ONLY:
                raise ValueError(f"Alert logging failed in API_ONLY mode: {e}")
            
            logger.warning(f"Node.js alert logging failed, using database fallback: {e}")
        
        finally:
            if not client_provided:
                await client.aclose()
    
    # Database fallback
    if not db_pool:
        logger.error("No database pool available for fallback alert logging")
        return {
            "success": False,
            "error": "Database fallback unavailable - no connection pool"
        }
    
    try:
        # Determine alert type and severity
        alert_type = "unusual_pattern" if risk_score >= 0.6 else "other"
        severity = (
            "critical" if risk_score >= 0.9 else
            "high" if risk_score >= 0.7 else
            "medium" if risk_score >= 0.5 else "low"
        )
        
        # Build alert reason from flagged factors
        flagged_factors = [f for f in risk_factors if f.get("is_flagged")]
        alert_reason = (
            "; ".join(f.get("description", "") for f in flagged_factors)
            if flagged_factors
            else f"ML fraud detection: Risk score {risk_score * 100:.1f}%"
        )
        
        async with db_pool.acquire() as conn:
            # Get transaction details
            wallet_id = None
            transaction_amount = None
            transaction_type = None
            
            if transaction_id:
                tx_row = await conn.fetchrow(
                    "SELECT amount, type, wallet_id FROM transactions WHERE id = $1",
                    transaction_id
                )
                if tx_row:
                    transaction_amount = tx_row["amount"]
                    transaction_type = tx_row["type"]
                    wallet_id = tx_row["wallet_id"]
            
            # Get user KYC tier
            user_row = await conn.fetchrow(
                "SELECT kyc_tier FROM users WHERE id = $1",
                user_id
            )
            user_kyc_tier = user_row["kyc_tier"] if user_row else "basic"
            
            # Insert alert
            result = await conn.fetchrow(
                """
                INSERT INTO transaction_monitoring_alerts (
                    alert_type, severity, status, user_id, wallet_id,
                    transaction_id, alert_reason, risk_score, detection_method,
                    transaction_amount, transaction_type, user_kyc_tier,
                    metadata, detected_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
                RETURNING id
                """,
                alert_type,
                severity,
                "open",
                user_id,
                wallet_id,
                transaction_id,
                alert_reason,
                risk_score * 100,  # Convert 0-1 to 0-100
                "ml_model",
                transaction_amount,
                transaction_type,
                user_kyc_tier,
                {
                    "source": f"{source}_fallback",
                    "risk_factors": risk_factors,
                    "ml_risk_level": risk_level,
                },
            )
            
            alert_id = result["id"]
            
            # Check STR trigger (using centralized FIA threshold)
            str_triggered = (
                (transaction_amount and transaction_amount >= FIA_STR_THRESHOLD) or
                risk_score >= 0.7
            )
            
            if str_triggered:
                # Log STR violation
                await conn.execute(
                    """
                    INSERT INTO compliance_violations (
                        violation_type, psd_reference, description, severity, metadata, created_at
                    ) VALUES ($1, $2, $3, $4, $5, NOW())
                    """,
                    "fia_str_threshold",
                    "FIA-2012",
                    f"STR triggered: Risk {risk_score * 100:.1f}%, Amount: N${transaction_amount or 0}",
                    "serious",
                    {
                        "alert_id": str(alert_id),
                        "user_id": user_id,
                        "transaction_id": transaction_id,
                        "risk_score": risk_score,
                        "source": f"{source}_fallback",
                    },
                )
                
                logger.warning(
                    f"STR triggered via database fallback: alert_id={alert_id}, "
                    f"risk_score={risk_score}, amount={transaction_amount}"
                )
            
            logger.info(f"Alert logged via database fallback: {alert_id}")
            
            return {
                "success": True,
                "alert_id": str(alert_id),
                "str_triggered": str_triggered,
                "source": ValidationSource.DATABASE_FALLBACK,
            }
    
    except Exception as db_error:
        logger.error(f"Database fallback alert logging failed: {db_error}")
        return {
            "success": False,
            "error": f"Database fallback failed: {db_error}",
        }


# =============================================================================
# FIA Threshold Helpers
# =============================================================================

def check_fia_threshold(amount: float) -> Dict[str, bool]:
    """
    Check if transaction meets FIA reporting thresholds.
    
    Uses centralized FIA thresholds from config.transaction_limits:
    - STR Threshold: N$5,000,000 (Suspicious Transaction Report)
    - CTR Threshold: N$10,000,000 (Cash Transaction Report)
    
    Args:
        amount: Transaction amount to check
    
    Returns:
        {
            "str_required": bool,  # True if >= STR threshold
            "ctr_required": bool   # True if >= CTR threshold
        }
    
    Examples:
        >>> check_fia_threshold(3_000_000)
        {"str_required": False, "ctr_required": False}
        
        >>> check_fia_threshold(6_000_000)
        {"str_required": True, "ctr_required": False}
        
        >>> check_fia_threshold(12_000_000)
        {"str_required": True, "ctr_required": True}
    """
    return config_check_fia_threshold(amount)


# =============================================================================
# PSD-12: Dynamic Fraud Thresholds
# =============================================================================

async def get_fraud_thresholds(
    http_client: Optional[httpx.AsyncClient] = None,
    node_backend_url: Optional[str] = None,
) -> Dict[str, float]:
    """
    Fetch dynamic fraud detection thresholds from Node.js KRI config.
    
    Falls back to default thresholds if Node.js is unavailable.
    
    Args:
        http_client: Optional httpx client
        node_backend_url: Node.js backend URL
    
    Returns:
        {
            "low_threshold": float,     # Minimum risk score for low-risk flag
            "medium_threshold": float,  # Minimum risk score for medium-risk flag
            "high_threshold": float     # Minimum risk score for high-risk flag
        }
    
    Default Thresholds:
        - low: 0.3 (30% fraud probability)
        - medium: 0.6 (60% fraud probability)
        - high: 1.0 (100% fraud probability - never reached by ML)
    
    Examples:
        >>> await get_fraud_thresholds()
        {"low_threshold": 0.3, "medium_threshold": 0.6, "high_threshold": 1.0}
    """
    backend_url = node_backend_url or os.getenv("NODE_BACKEND_URL", "http://localhost:3000")
    
    client_provided = http_client is not None
    client = http_client or httpx.AsyncClient(timeout=5.0)
    
    try:
        response = await client.get(
            f"{backend_url}/api/v1/compliance/fraud-thresholds"
        )
        response.raise_for_status()
        return response.json()
    
    except Exception as e:
        logger.warning(f"Failed to fetch fraud thresholds, using defaults: {e}")
        return {
            "low_threshold": 0.3,
            "medium_threshold": 0.6,
            "high_threshold": 1.0,
        }
    
    finally:
        if not client_provided:
            await client.aclose()


# =============================================================================
# MIGRATION GUIDE
# =============================================================================

"""
BACKWARD COMPATIBILITY & MIGRATION GUIDE
========================================

This module consolidates duplicate validation logic from:
1. smartpay_ai.compliance.validator.ComplianceValidator
2. smartpay_ai.services.compliance_validator.ComplianceValidator

PHASE 1: Immediate Usage (No Breaking Changes)
-----------------------------------------------
The original validator classes can now delegate to these shared functions:

# In compliance/validator.py:
from smartpay_ai.shared.validators import (
    validate_transaction_limits,
    estimate_interchange_fee,
    log_compliance_violation,
    log_security_alert,
    check_fia_threshold,
    get_fraud_thresholds,
)

class ComplianceValidator:
    async def validate_transaction_limits(self, ...):
        return await validate_transaction_limits(
            user_id=user_id,
            amount=amount,
            user_tier=user_tier,
            daily_spent=daily_spent,
            monthly_spent=monthly_spent,
            http_client=self.client,
            node_backend_url=self.node_backend_url,
        )

PHASE 2: Direct Function Imports (Recommended)
-----------------------------------------------
For new code, import functions directly:

from smartpay_ai.shared.validators import (
    validate_transaction_limits,
    estimate_interchange_fee_local,
    check_fia_threshold,
)

# Use directly without class wrapper
result = await validate_transaction_limits(
    user_id="usr_123",
    amount=5000.0,
    user_tier="tier2",
    daily_spent=10000.0,
    monthly_spent=45000.0,
)

PHASE 3: Full Migration (Optional)
-----------------------------------
After testing, consider deprecating wrapper classes:

1. Update all imports:
   - OLD: from smartpay_ai.compliance.validator import ComplianceValidator
   - NEW: from smartpay_ai.shared import validators

2. Replace class instantiation:
   - OLD: validator = ComplianceValidator()
   - NEW: Use functions directly

3. Update function calls:
   - OLD: await validator.validate_transaction_limits(...)
   - NEW: await validators.validate_transaction_limits(...)

TESTING CHECKLIST
-----------------
✓ Test API_WITH_FALLBACK mode (default)
✓ Test API_ONLY mode (strict validation)
✓ Test LOCAL_ONLY mode (no network)
✓ Test database fallback for violations/alerts
✓ Verify STR triggering logic
✓ Validate all fee calculations match PSD-11
✓ Check reporting deadlines (PSD-6)
✓ Confirm FIA threshold checking

UNIT TEST EXAMPLES
------------------
See below for comprehensive test cases.
"""


# =============================================================================
# UNIT TESTS (In Comments)
# =============================================================================

"""
# test_validators.py

import pytest
from unittest.mock import AsyncMock, MagicMock
from smartpay_ai.shared.validators import (
    validate_transaction_limits,
    validate_emoney_limits_local,
    estimate_interchange_fee,
    estimate_interchange_fee_local,
    log_compliance_violation,
    log_security_alert,
    check_fia_threshold,
    calculate_reporting_deadline,
    get_fraud_thresholds,
    ValidationMode,
)


# =============================================================================
# Test PSD-1: Transaction Limits
# =============================================================================

@pytest.mark.asyncio
async def test_validate_transaction_limits_local_success():
    '''Test local validation allows valid transaction.'''
    result = await validate_transaction_limits(
        user_id="usr_123",
        amount=5000.0,
        user_tier="tier2",
        daily_spent=10000.0,
        monthly_spent=45000.0,
        mode=ValidationMode.LOCAL_ONLY,
    )
    
    assert result["allowed"] is True
    assert result["source"] == "python_fallback"
    assert result["remaining_daily"] > 0
    assert result["remaining_monthly"] > 0


@pytest.mark.asyncio
async def test_validate_transaction_limits_exceeds_single():
    '''Test validation rejects transaction exceeding single limit.'''
    result = await validate_transaction_limits(
        user_id="usr_123",
        amount=60000.0,  # Exceeds tier2 limit of 50000
        user_tier="tier2",
        daily_spent=0.0,
        monthly_spent=0.0,
        mode=ValidationMode.LOCAL_ONLY,
    )
    
    assert result["allowed"] is False
    assert "exceeds" in result["reason"].lower()


@pytest.mark.asyncio
async def test_validate_transaction_limits_exceeds_daily():
    '''Test validation rejects transaction exceeding daily limit.'''
    result = await validate_transaction_limits(
        user_id="usr_123",
        amount=5000.0,
        user_tier="tier1",
        daily_spent=19000.0,  # Daily limit is 20000, would exceed
        monthly_spent=0.0,
        mode=ValidationMode.LOCAL_ONLY,
    )
    
    assert result["allowed"] is False
    assert "daily" in result["reason"].lower()


def test_validate_emoney_limits_local_all_tiers():
    '''Test local validation for all KYC tiers.'''
    # Basic tier
    is_valid, msg = validate_emoney_limits_local("basic", 1000.0, 0.0, 0.0)
    assert is_valid is True
    
    # Tier1
    is_valid, msg = validate_emoney_limits_local("tier1", 9000.0, 0.0, 0.0)
    assert is_valid is True
    
    # Tier2
    is_valid, msg = validate_emoney_limits_local("tier2", 40000.0, 0.0, 0.0)
    assert is_valid is True
    
    # Tier3
    is_valid, msg = validate_emoney_limits_local("tier3", 150000.0, 0.0, 0.0)
    assert is_valid is True


# =============================================================================
# Test PSD-11: Interchange Fees
# =============================================================================

def test_estimate_interchange_fee_card_debit():
    '''Test debit card fee calculation (0.5%).'''
    result = estimate_interchange_fee_local("card_retail", "debit", 10000.0)
    
    assert result["interchange_amount"] == 50.0  # 10000 * 0.005
    assert result["interchange_rate"] == 0.005
    assert result["vat_amount"] == 7.5  # 50 * 0.15
    assert result["total_fee"] == 57.5


def test_estimate_interchange_fee_card_credit():
    '''Test credit card fee calculation (1.55%).'''
    result = estimate_interchange_fee_local("card_retail", "credit", 10000.0)
    
    assert result["interchange_amount"] == 155.0  # 10000 * 0.0155
    assert result["interchange_rate"] == 0.0155
    assert result["vat_amount"] == 23.25  # 155 * 0.15
    assert result["total_fee"] == 178.25


def test_estimate_interchange_fee_atm():
    '''Test ATM withdrawal fee calculation.'''
    result = estimate_interchange_fee_local("atm_withdrawal", None, 5000.0)
    
    # Base 4 + (5000/100)*0.8 = 4 + 40 = 44
    assert result["interchange_amount"] == 44.0
    assert result["vat_amount"] == 6.6  # 44 * 0.15
    assert result["total_fee"] == 50.6


def test_estimate_interchange_fee_instant():
    '''Test instant payment fee calculation.'''
    result = estimate_interchange_fee_local("instant_payment", None, 10000.0)
    
    assert result["interchange_amount"] == 1.25
    assert result["vat_amount"] == 0.19  # 1.25 * 0.15
    assert result["total_fee"] == 1.44


def test_estimate_interchange_fee_unknown():
    '''Test handling of unknown transaction type.'''
    result = estimate_interchange_fee_local("unknown_type", None, 10000.0)
    
    assert result["interchange_amount"] == 0.0
    assert result["total_fee"] == 0.0
    assert "unknown" in result["description"].lower()


# =============================================================================
# Test PSD-6: Violation Logging
# =============================================================================

def test_calculate_reporting_deadline():
    '''Test PSD-6 reporting deadline calculation.'''
    from datetime import datetime, timedelta
    
    now = datetime.now()
    
    # Critical: 4 hours
    critical = calculate_reporting_deadline("critical")
    assert (critical - now).total_seconds() / 3600 == pytest.approx(4, abs=0.1)
    
    # Serious: 24 hours
    serious = calculate_reporting_deadline("serious")
    assert (serious - now).total_seconds() / 3600 == pytest.approx(24, abs=0.1)
    
    # Moderate: 7 days
    moderate = calculate_reporting_deadline("moderate")
    assert (moderate - now).days == 7
    
    # Minor: 30 days
    minor = calculate_reporting_deadline("minor")
    assert (minor - now).days == 30


@pytest.mark.asyncio
async def test_log_compliance_violation_db_fallback(mock_db_pool):
    '''Test violation logging with database fallback.'''
    mock_conn = AsyncMock()
    mock_conn.fetchrow = AsyncMock(return_value={"id": "vio_123"})
    mock_db_pool.acquire = AsyncMock(return_value=AsyncMockContext(mock_conn))
    
    result = await log_compliance_violation(
        violation_type="daily_limit_exceeded",
        psd_reference="PSD-1",
        severity="serious",
        description="User exceeded daily limit",
        user_id="usr_123",
        transaction_id="txn_456",
        db_pool=mock_db_pool,
        mode=ValidationMode.LOCAL_ONLY,
    )
    
    assert result["success"] is True
    assert result["violation_id"] == "vio_123"
    assert result["source"] == "database_fallback"


# =============================================================================
# Test FIA: Security Alerts
# =============================================================================

def test_check_fia_threshold_below():
    '''Test FIA threshold check below all limits.'''
    result = check_fia_threshold(3_000_000)
    
    assert result["str_required"] is False
    assert result["ctr_required"] is False


def test_check_fia_threshold_str():
    '''Test FIA threshold check above STR limit.'''
    result = check_fia_threshold(6_000_000)
    
    assert result["str_required"] is True
    assert result["ctr_required"] is False


def test_check_fia_threshold_ctr():
    '''Test FIA threshold check above CTR limit.'''
    result = check_fia_threshold(12_000_000)
    
    assert result["str_required"] is True
    assert result["ctr_required"] is True


@pytest.mark.asyncio
async def test_log_security_alert_str_trigger(mock_db_pool):
    '''Test security alert with STR trigger (high risk score).'''
    mock_conn = AsyncMock()
    mock_conn.fetchrow = AsyncMock(side_effect=[
        {"amount": 1_000_000, "type": "transfer", "wallet_id": "wlt_123"},  # Transaction
        {"kyc_tier": "tier2"},  # User
        {"id": "alt_456"},  # Alert insert
    ])
    mock_conn.execute = AsyncMock()
    mock_db_pool.acquire = AsyncMock(return_value=AsyncMockContext(mock_conn))
    
    result = await log_security_alert(
        user_id="usr_123",
        transaction_id="txn_456",
        risk_score=0.85,  # High risk, triggers STR
        risk_level="high",
        risk_factors=[{"factor": "velocity", "score": 0.9, "is_flagged": True}],
        db_pool=mock_db_pool,
        mode=ValidationMode.LOCAL_ONLY,
    )
    
    assert result["success"] is True
    assert result["alert_id"] == "alt_456"
    assert result["str_triggered"] is True  # Should trigger STR
    assert result["source"] == "database_fallback"


# =============================================================================
# Test PSD-12: Fraud Thresholds
# =============================================================================

@pytest.mark.asyncio
async def test_get_fraud_thresholds_fallback():
    '''Test fraud threshold fetch with fallback to defaults.'''
    # Mock failing HTTP client
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(side_effect=Exception("Connection failed"))
    
    result = await get_fraud_thresholds(http_client=mock_client)
    
    assert result["low_threshold"] == 0.3
    assert result["medium_threshold"] == 0.6
    assert result["high_threshold"] == 1.0


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def mock_db_pool():
    '''Mock asyncpg connection pool.'''
    pool = MagicMock()
    return pool


class AsyncMockContext:
    '''Async context manager mock for database connections.'''
    def __init__(self, conn):
        self.conn = conn
    
    async def __aenter__(self):
        return self.conn
    
    async def __aexit__(self, *args):
        pass
"""
