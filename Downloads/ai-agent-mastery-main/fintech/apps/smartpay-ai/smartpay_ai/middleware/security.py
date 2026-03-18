"""
Security Middleware for Smartpay AI Backend.

Location: backend_python/smartpay_ai/middleware/security.py
Purpose: 2FA verification, fraud detection, audit logging, and payment-specific rate limiting.
         PSD-12 Compliance: Sections 12.2 (2FA), 11.6 (Fraud Detection), and audit trail requirements.

Integration:
- Connects to Node.js backend at http://localhost:4000 for 2FA verification
- Calls fraud detection service for real-time risk assessment
- Logs all security events to audit trail
"""

import os
import time
import logging
from typing import Optional, Dict, Any

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import httpx

from smartpay_ai.config.logging import get_audit_logger

_log = logging.getLogger(__name__)


class Check2FAMiddleware(BaseHTTPMiddleware):
    """
    2FA verification middleware for payment operations.
    
    PSD-12 Section 12.2: Two-Factor Authentication REQUIRED for EVERY payment.
    
    This middleware:
    1. Identifies payment-related endpoints
    2. Verifies 2FA session with Node.js backend
    3. Checks 2FA session validity (5-minute window)
    4. Logs all 2FA verification attempts
    5. Blocks requests without valid 2FA
    """
    
    # Payment endpoints requiring 2FA
    PAYMENT_ENDPOINTS = [
        "/api/payments/",
        "/api/transfers/",
        "/api/withdrawals/",
        "/api/cards/transactions",
        "/api/loans/disburse",
        "/api/smartpay-copilot/chat"  # If handling payments via copilot
    ]
    
    def __init__(self, app, node_api_base_url: Optional[str] = None):
        super().__init__(app)
        self.node_api_base_url = node_api_base_url or os.getenv(
            "SMARTPAY_API_BASE_URL",
            "http://localhost:4000"
        )
        self.audit_logger = get_audit_logger()
        self.twofa_timeout_seconds = int(os.getenv("TWOFA_TIMEOUT_SECONDS", "300"))  # 5 minutes
    
    async def dispatch(self, request: Request, call_next):
        """Process request and verify 2FA for payment operations."""
        
        # Check if this is a payment endpoint
        is_payment_endpoint = any(
            request.url.path.startswith(endpoint) 
            for endpoint in self.PAYMENT_ENDPOINTS
        )
        
        if not is_payment_endpoint:
            return await call_next(request)
        
        # Get user from request state (set by AuthMiddleware)
        user = getattr(request.state, "user", None)
        
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Authentication required for payment operations"
            )
        
        user_id = user.get("user_id")
        ip_address = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Extract Authorization header for Node.js API call
        auth_header = request.headers.get("Authorization", "")
        
        # Verify 2FA session with Node.js backend
        try:
            twofa_verified, twofa_method, error_msg = await self._verify_2fa_session(
                user_id,
                auth_header
            )
            
            if not twofa_verified:
                # Log failed 2FA verification
                await self.audit_logger.log_2fa_verification(
                    success=False,
                    user_id=user_id,
                    method="unknown",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    error_message=error_msg
                )
                
                # Log security violation
                await self.audit_logger.log_security_violation(
                    violation_type="2FA_NOT_VERIFIED",
                    user_id=user_id,
                    details={
                        "endpoint": request.url.path,
                        "reason": error_msg
                    },
                    ip_address=ip_address,
                    user_agent=user_agent
                )
                
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "TWO_FACTOR_AUTH_REQUIRED",
                        "code": "PSD12_SECTION_12_2_VIOLATION",
                        "compliance": "PSD-12 Section 12.2 mandates 2FA for EVERY payment",
                        "message": error_msg
                    }
                )
            
            # Log successful 2FA verification
            await self.audit_logger.log_2fa_verification(
                success=True,
                user_id=user_id,
                method=twofa_method,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            # Attach 2FA verification to request state
            request.state.twofa_verified = True
            request.state.twofa_method = twofa_method
            
            _log.debug(
                "2FA verified for user %s via %s",
                user_id,
                twofa_method
            )
            
            return await call_next(request)
        
        except HTTPException:
            raise
        except Exception as e:
            _log.error("2FA verification error: %s", e)
            
            # Log error
            await self.audit_logger.log_2fa_verification(
                success=False,
                user_id=user_id,
                method="unknown",
                ip_address=ip_address,
                user_agent=user_agent,
                error_message=str(e)
            )
            
            raise HTTPException(
                status_code=503,
                detail="2FA verification service unavailable"
            )
    
    async def _verify_2fa_session(
        self,
        user_id: str,
        auth_header: str
    ) -> tuple[bool, str, str]:
        """
        Verify 2FA session with Node.js backend.
        
        Returns:
            (verified, method, error_message) tuple
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.node_api_base_url}/api/auth/verify-2fa-session",
                    headers={"Authorization": auth_header},
                    json={"user_id": user_id}
                )
            
            if response.status_code == 200:
                data = response.json()
                return True, data.get("method", "unknown"), ""
            
            elif response.status_code == 403:
                data = response.json()
                return False, "unknown", data.get("message", "2FA verification required")
            
            else:
                return False, "unknown", f"2FA verification failed with status {response.status_code}"
        
        except httpx.TimeoutException:
            _log.error("2FA verification timeout")
            return False, "unknown", "2FA verification service timeout"
        
        except Exception as e:
            _log.error("2FA verification error: %s", e)
            return False, "unknown", str(e)


class FraudDetectionMiddleware(BaseHTTPMiddleware):
    """
    Fraud detection middleware for payment operations.
    
    PSD-12 Section 11.6: Monitor ALL payments for fraud.
    
    This middleware:
    1. Identifies payment-related endpoints
    2. Extracts payment context from request
    3. Calls fraud detection service API
    4. Blocks high-risk payments
    5. Requires review for medium-risk payments
    6. Logs all fraud detection events
    """
    
    # Payment endpoints requiring fraud detection
    PAYMENT_ENDPOINTS = [
        "/api/payments/",
        "/api/transfers/",
        "/api/withdrawals/",
        "/api/cards/transactions"
    ]
    
    def __init__(self, app, node_api_base_url: Optional[str] = None):
        super().__init__(app)
        self.node_api_base_url = node_api_base_url or os.getenv(
            "SMARTPAY_API_BASE_URL",
            "http://localhost:4000"
        )
        self.audit_logger = get_audit_logger()
    
    async def dispatch(self, request: Request, call_next):
        """Process request and check for fraud."""
        
        # Check if this is a payment endpoint
        is_payment_endpoint = any(
            request.url.path.startswith(endpoint)
            for endpoint in self.PAYMENT_ENDPOINTS
        )
        
        if not is_payment_endpoint:
            return await call_next(request)
        
        # Get user from request state
        user = getattr(request.state, "user", None)
        
        if not user:
            # User not authenticated, skip fraud detection
            return await call_next(request)
        
        user_id = user.get("user_id")
        ip_address = request.client.host if request.client else "unknown"
        
        # Extract payment context from request
        try:
            fraud_context = await self._extract_payment_context(request, user_id, ip_address)
        except Exception as e:
            _log.warning("Failed to extract payment context: %s", e)
            # Continue without fraud detection if context extraction fails
            return await call_next(request)
        
        # Call fraud detection service
        try:
            fraud_check = await self._check_fraud(fraud_context)
            
            # Log fraud detection event
            await self.audit_logger.log_fraud_detection(
                payment_id=fraud_context.get("payment_id", "unknown"),
                user_id=user_id,
                risk_score=fraud_check.get("riskScore", 0),
                action_taken=fraud_check.get("actionTaken", "UNKNOWN"),
                rules_triggered=fraud_check.get("rulesTriggered", []),
                fraud_indicators=fraud_check.get("fraudIndicators", []),
                ip_address=ip_address
            )
            
            # Attach fraud check result to request state
            request.state.fraud_check = fraud_check
            
            # Block high-risk payments
            if fraud_check.get("blocked"):
                await self.audit_logger.log_security_violation(
                    violation_type="PAYMENT_BLOCKED_FRAUD",
                    user_id=user_id,
                    details={
                        "payment_id": fraud_context.get("payment_id"),
                        "risk_score": fraud_check.get("riskScore"),
                        "block_reason": fraud_check.get("blockReason"),
                        "fraud_indicators": fraud_check.get("fraudIndicators", [])
                    },
                    ip_address=ip_address
                )
                
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": "PAYMENT_BLOCKED",
                        "code": "FRAUD_DETECTED",
                        "reason": fraud_check.get("blockReason"),
                        "risk_score": fraud_check.get("riskScore"),
                        "compliance": "PSD-12 Section 11.6 requires fraud monitoring on ALL payments"
                    }
                )
            
            # Require manual review for medium-high risk
            if fraud_check.get("requiresReview"):
                return JSONResponse(
                    status_code=202,
                    content={
                        "status": "PENDING_REVIEW",
                        "message": "Payment requires manual review due to fraud risk",
                        "risk_score": fraud_check.get("riskScore"),
                        "payment_id": fraud_context.get("payment_id")
                    }
                )
            
            # Require step-up authentication
            if fraud_check.get("requiresStepUpAuth"):
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": "STEP_UP_AUTH_REQUIRED",
                        "message": "Additional authentication required due to elevated fraud risk",
                        "risk_score": fraud_check.get("riskScore"),
                        "requires_action": "ADDITIONAL_2FA_VERIFICATION"
                    }
                )
            
            # Payment allowed, proceed
            _log.info(
                "Fraud check passed for payment - Risk score: %s",
                fraud_check.get("riskScore", 0)
            )
            
            return await call_next(request)
        
        except Exception as e:
            _log.error("Fraud detection error: %s", e)
            
            # Fail safely: require manual review if fraud detection fails
            return JSONResponse(
                status_code=202,
                content={
                    "status": "PENDING_REVIEW",
                    "message": "Fraud detection service unavailable - payment requires manual review",
                    "error": str(e)
                }
            )
    
    async def _extract_payment_context(
        self,
        request: Request,
        user_id: str,
        ip_address: str
    ) -> Dict[str, Any]:
        """Extract payment context from request."""
        
        # Get request body (if POST/PUT/PATCH)
        body = {}
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.json()
            except Exception:
                body = {}
        
        # Build payment context
        payment_id = body.get("payment_id") or f"pay_{int(time.time())}"
        
        context = {
            "payment_id": payment_id,
            "user_id": user_id,
            "amount": body.get("amount", 0),
            "currency": body.get("currency", "NAD"),
            "payment_type": body.get("payment_type", "CARD"),
            "payment_method": body.get("payment_method", "CARD_NOT_PRESENT"),
            
            # Device context
            "device_id": request.headers.get("X-Device-ID"),
            "device_type": request.headers.get("X-Device-Type", "WEB"),
            "ip_address": ip_address,
            "user_agent": request.headers.get("user-agent"),
            
            # Location context (if provided)
            "latitude": body.get("latitude"),
            "longitude": body.get("longitude"),
            "country": body.get("country"),
            "city": body.get("city"),
            
            # Card details (if applicable)
            "card_last_4": body.get("card_last_4"),
            "card_bin": body.get("card_bin"),
            "card_type": body.get("card_type"),
            "is_card_present": body.get("is_card_present", False),
            
            # Additional context
            "session_id": request.headers.get("X-Session-ID"),
            "timestamp": time.time(),
            
            # Recipient (if applicable)
            "recipient_id": body.get("recipient_id"),
            "merchant_id": body.get("merchant_id"),
        }
        
        return context
    
    async def _check_fraud(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call fraud detection service.
        
        Returns fraud check result with risk score and action.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.node_api_base_url}/api/fraud/check-payment",
                    json=context
                )
            
            if response.status_code == 200:
                return response.json()
            else:
                _log.error(
                    "Fraud detection API returned status %s",
                    response.status_code
                )
                raise Exception(f"Fraud API error: {response.status_code}")
        
        except httpx.TimeoutException:
            _log.error("Fraud detection API timeout")
            raise Exception("Fraud detection service timeout")
        
        except Exception as e:
            _log.error("Fraud detection error: %s", e)
            raise


class PaymentRateLimitMiddleware(BaseHTTPMiddleware):
    """
    Payment-specific rate limiting middleware.
    
    Implements stricter rate limits for financial operations to prevent:
    - Brute force attacks
    - Rapid fraud attempts
    - Account enumeration
    - Service abuse
    """
    
    # Payment endpoint rate limits (requests, window_seconds)
    PAYMENT_RATE_LIMITS = {
        "/api/payments/initiate": (10, 3600),  # 10 per hour
        "/api/payments/verify-2fa": (20, 900),  # 20 per 15 min
        "/api/payments/tokenize-card": (30, 3600),  # 30 per hour
        "/api/transfers/": (15, 3600),  # 15 per hour
        "/api/withdrawals/": (10, 3600),  # 10 per hour
        
        # Authentication endpoints (brute force protection)
        "/api/auth/login": (5, 900),  # 5 per 15 min
        "/api/auth/verify-2fa": (10, 900),  # 10 per 15 min
        "/api/auth/request-otp": (10, 900),  # 10 per 15 min
    }
    
    def __init__(self, app):
        super().__init__(app)
        self.audit_logger = get_audit_logger()
        # Simple in-memory rate limiting (use Redis in production)
        self.rate_limit_cache: Dict[str, list] = {}
        self.cleanup_interval = 300  # Clean up every 5 minutes
        self.last_cleanup = time.time()
    
    async def dispatch(self, request: Request, call_next):
        """Check payment-specific rate limits."""
        
        # Get rate limit config for this endpoint
        limit_config = self._get_rate_limit_config(request.url.path)
        
        if not limit_config:
            # No specific rate limit for this endpoint
            return await call_next(request)
        
        max_requests, window_seconds = limit_config
        
        # Get user ID
        user = getattr(request.state, "user", None)
        user_id = user.get("user_id") if user else "anonymous"
        ip_address = request.client.host if request.client else "unknown"
        
        # Build rate limit key
        rate_limit_key = f"payment_rate:{user_id}:{request.url.path}"
        
        # Check rate limit
        allowed, retry_after = self._check_rate_limit(
            rate_limit_key,
            max_requests,
            window_seconds
        )
        
        if not allowed:
            # Log rate limit exceeded
            await self.audit_logger.log_rate_limit_exceeded(
                user_id=user_id,
                endpoint=request.url.path,
                ip_address=ip_address,
                retry_after=retry_after
            )
            
            _log.warning(
                "Payment rate limit exceeded for user %s on %s",
                user_id,
                request.url.path
            )
            
            return JSONResponse(
                status_code=429,
                content={
                    "error": "RATE_LIMIT_EXCEEDED",
                    "message": "Too many payment requests. Please try again later.",
                    "retry_after_seconds": retry_after,
                    "max_requests": max_requests,
                    "window_seconds": window_seconds
                },
                headers={"Retry-After": str(retry_after)}
            )
        
        # Rate limit passed
        return await call_next(request)
    
    def _get_rate_limit_config(self, path: str) -> Optional[tuple[int, int]]:
        """Get rate limit configuration for path."""
        for pattern, config in self.PAYMENT_RATE_LIMITS.items():
            if path.startswith(pattern):
                return config
        return None
    
    def _check_rate_limit(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> tuple[bool, int]:
        """
        Check if request is within rate limit.
        
        Returns:
            (allowed, retry_after) tuple
        """
        now = time.time()
        
        # Cleanup old entries periodically
        if now - self.last_cleanup > self.cleanup_interval:
            self._cleanup_old_entries()
        
        # Get or create request timestamps for this key
        if key not in self.rate_limit_cache:
            self.rate_limit_cache[key] = []
        
        timestamps = self.rate_limit_cache[key]
        
        # Remove timestamps outside the window
        cutoff = now - window_seconds
        timestamps = [ts for ts in timestamps if ts > cutoff]
        self.rate_limit_cache[key] = timestamps
        
        # Check if within limit
        if len(timestamps) < max_requests:
            # Add current timestamp
            timestamps.append(now)
            return True, 0
        else:
            # Calculate retry after
            oldest_timestamp = min(timestamps)
            retry_after = int((oldest_timestamp + window_seconds) - now) + 1
            return False, retry_after
    
    def _cleanup_old_entries(self) -> None:
        """Remove old rate limit entries to prevent memory leak."""
        now = time.time()
        
        # Remove keys with no recent requests (older than 1 hour)
        keys_to_remove = []
        for key, timestamps in self.rate_limit_cache.items():
            if not timestamps or max(timestamps) < now - 3600:
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self.rate_limit_cache[key]
        
        self.last_cleanup = now


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses.
    
    Implements:
    - Content Security Policy
    - X-Frame-Options
    - X-Content-Type-Options
    - Strict-Transport-Security
    - X-XSS-Protection
    """
    
    async def dispatch(self, request: Request, call_next):
        """Add security headers to response."""
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # HSTS (only if HTTPS)
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        
        # CSP (Content Security Policy)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' http://localhost:4000 http://localhost:3000; "
            "frame-ancestors 'none';"
        )
        
        return response


# Factory functions for middleware
def check_2fa_middleware(app, **kwargs):
    """Create and return 2FA verification middleware instance."""
    return Check2FAMiddleware(app, **kwargs)


def fraud_detection_middleware(app, **kwargs):
    """Create and return fraud detection middleware instance."""
    return FraudDetectionMiddleware(app, **kwargs)


def payment_rate_limit_middleware(app, **kwargs):
    """Create and return payment rate limit middleware instance."""
    return PaymentRateLimitMiddleware(app, **kwargs)


def security_headers_middleware(app, **kwargs):
    """Create and return security headers middleware instance."""
    return SecurityHeadersMiddleware(app, **kwargs)
