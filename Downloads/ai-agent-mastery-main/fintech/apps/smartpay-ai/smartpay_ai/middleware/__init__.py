"""
Middleware package for Smartpay AI Copilot.

Location: backend_python/smartpay_ai/middleware/__init__.py
Purpose: Authentication, rate limiting, logging middleware.
         Enhanced with 2FA verification, fraud detection, and audit logging.
         PSD-12 Compliance: Sections 12.2 (2FA) and 11.6 (Fraud Detection).
"""

from smartpay_ai.middleware.auth import AuthMiddleware, auth_middleware
from smartpay_ai.middleware.rate_limit import RateLimitMiddleware, rate_limit_middleware
from smartpay_ai.middleware.security import (
    Check2FAMiddleware,
    FraudDetectionMiddleware,
    PaymentRateLimitMiddleware,
    SecurityHeadersMiddleware,
    check_2fa_middleware,
    fraud_detection_middleware,
    payment_rate_limit_middleware,
    security_headers_middleware
)

__all__ = [
    "AuthMiddleware",
    "auth_middleware",
    "RateLimitMiddleware",
    "rate_limit_middleware",
    "Check2FAMiddleware",
    "check_2fa_middleware",
    "FraudDetectionMiddleware",
    "fraud_detection_middleware",
    "PaymentRateLimitMiddleware",
    "payment_rate_limit_middleware",
    "SecurityHeadersMiddleware",
    "security_headers_middleware",
]
