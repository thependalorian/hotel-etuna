"""
Shared Utilities Package

Centralized utilities and validators to eliminate DRY violations across:
- smartpay_ai.compliance.validator
- smartpay_ai.services.compliance_validator
- smartpay_ai.middleware.auth

Modules:
- validators: Compliance and transaction validation
- jwt_validator: JWT authentication and token management
- rate_limiter: Rate limiting utilities

Usage:
    from smartpay_ai.shared import validators
    
    # Or import specific functions
    from smartpay_ai.shared import (
        validate_transaction_limits,
        verify_access_token,
        extract_bearer_token,
    )
"""

from smartpay_ai.shared.validators import (
    # Core validation functions
    validate_transaction_limits,
    validate_emoney_limits_local,
    estimate_interchange_fee,
    estimate_interchange_fee_local,
    log_compliance_violation,
    log_security_alert,
    
    # Helper functions
    check_fia_threshold,
    calculate_reporting_deadline,
    get_fraud_thresholds,
    
    # Enums and types
    ValidationMode,
    ValidationSource,
)

from smartpay_ai.shared.jwt_validator import (
    # Core JWT functions
    verify_access_token,
    verify_refresh_token,
    generate_access_token,
    generate_refresh_token,
    refresh_access_token,
    
    # Token management
    revoke_access_token,
    revoke_refresh_token,
    revoke_all_user_tokens,
    cleanup_expired_tokens,
    
    # Security & monitoring
    detect_token_theft,
    get_token_stats,
    validate_token_with_metrics,
    
    # Utilities
    extract_bearer_token,
    decode_token_without_verification,
    set_database_pool,
)

__all__ = [
    # Compliance validation
    "validate_transaction_limits",
    "validate_emoney_limits_local",
    "estimate_interchange_fee",
    "estimate_interchange_fee_local",
    "log_compliance_violation",
    "log_security_alert",
    
    # Compliance helpers
    "check_fia_threshold",
    "calculate_reporting_deadline",
    "get_fraud_thresholds",
    
    # Compliance enums
    "ValidationMode",
    "ValidationSource",
    
    # JWT core functions
    "verify_access_token",
    "verify_refresh_token",
    "generate_access_token",
    "generate_refresh_token",
    "refresh_access_token",
    
    # JWT token management
    "revoke_access_token",
    "revoke_refresh_token",
    "revoke_all_user_tokens",
    "cleanup_expired_tokens",
    
    # JWT security & monitoring
    "detect_token_theft",
    "get_token_stats",
    "validate_token_with_metrics",
    
    # JWT utilities
    "extract_bearer_token",
    "decode_token_without_verification",
    "set_database_pool",
]
