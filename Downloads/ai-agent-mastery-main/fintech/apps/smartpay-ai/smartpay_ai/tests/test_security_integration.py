"""
Security Integration Tests for Smartpay AI Backend.

Location: backend_python/smartpay_ai/tests/test_security_integration.py
Purpose: Comprehensive tests for security middleware (2FA, fraud detection, audit logging).
         Validates PSD-12 compliance.

Run:
    pytest smartpay_ai/tests/test_security_integration.py -v
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
import httpx

from smartpay_ai.middleware.security import (
    Check2FAMiddleware,
    FraudDetectionMiddleware,
    PaymentRateLimitMiddleware,
    SecurityHeadersMiddleware
)
from smartpay_ai.config.logging import AuditLogger


# ==================== Fixtures ====================

@pytest.fixture
def app():
    """Create test FastAPI app."""
    app = FastAPI()
    
    @app.get("/test/public")
    async def public_endpoint():
        return {"status": "ok"}
    
    @app.post("/api/payments/initiate")
    async def payment_endpoint(request: Request):
        user = getattr(request.state, "user", None)
        twofa_verified = getattr(request.state, "twofa_verified", False)
        fraud_check = getattr(request.state, "fraud_check", None)
        
        return {
            "status": "success",
            "user_id": user.get("user_id") if user else None,
            "twofa_verified": twofa_verified,
            "fraud_risk_score": fraud_check.get("riskScore") if fraud_check else None
        }
    
    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def mock_request():
    """Create mock request."""
    request = Mock(spec=Request)
    request.url.path = "/api/payments/initiate"
    request.method = "POST"
    request.headers = {"Authorization": "Bearer test_token"}
    request.client.host = "127.0.0.1"
    request.state.user = {
        "user_id": "user_123",
        "email": "test@example.com",
        "role": "user"
    }
    return request


# ==================== 2FA Middleware Tests ====================

class TestCheck2FAMiddleware:
    """Test 2FA verification middleware."""
    
    @pytest.mark.asyncio
    async def test_2fa_verification_success(self, mock_request):
        """Test successful 2FA verification."""
        middleware = Check2FAMiddleware(None, node_api_base_url="http://localhost:4000")
        
        # Mock successful 2FA verification
        with patch("httpx.AsyncClient") as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"method": "SMS_OTP"}
            
            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Mock call_next
            call_next = AsyncMock(return_value=Mock())
            
            # Execute middleware
            response = await middleware.dispatch(mock_request, call_next)
            
            # Verify 2FA verified flag set
            assert mock_request.state.twofa_verified is True
            assert mock_request.state.twofa_method == "SMS_OTP"
            assert call_next.called
    
    @pytest.mark.asyncio
    async def test_2fa_verification_failure(self, mock_request):
        """Test failed 2FA verification (PSD-12 violation)."""
        middleware = Check2FAMiddleware(None, node_api_base_url="http://localhost:4000")
        
        # Mock failed 2FA verification
        with patch("httpx.AsyncClient") as mock_client:
            mock_response = Mock()
            mock_response.status_code = 403
            mock_response.json.return_value = {"message": "2FA required"}
            
            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Mock call_next
            call_next = AsyncMock()
            
            # Execute middleware - should raise HTTPException
            from fastapi import HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await middleware.dispatch(mock_request, call_next)
            
            # Verify exception details
            assert exc_info.value.status_code == 403
            assert "TWO_FACTOR_AUTH_REQUIRED" in str(exc_info.value.detail)
            assert "PSD12_SECTION_12_2_VIOLATION" in str(exc_info.value.detail)
            assert not call_next.called
    
    @pytest.mark.asyncio
    async def test_2fa_skip_non_payment_endpoints(self):
        """Test 2FA middleware skips non-payment endpoints."""
        middleware = Check2FAMiddleware(None)
        
        # Create request for non-payment endpoint
        request = Mock(spec=Request)
        request.url.path = "/api/ml/predict"
        
        call_next = AsyncMock(return_value=Mock())
        
        # Execute middleware
        await middleware.dispatch(request, call_next)
        
        # Should skip 2FA verification
        assert call_next.called
    
    @pytest.mark.asyncio
    async def test_2fa_requires_authentication_first(self):
        """Test 2FA middleware requires user to be authenticated."""
        middleware = Check2FAMiddleware(None)
        
        # Create request without user
        request = Mock(spec=Request)
        request.url.path = "/api/payments/initiate"
        request.state.user = None
        
        call_next = AsyncMock()
        
        # Should raise 401
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await middleware.dispatch(request, call_next)
        
        assert exc_info.value.status_code == 401


# ==================== Fraud Detection Middleware Tests ====================

class TestFraudDetectionMiddleware:
    """Test fraud detection middleware."""
    
    @pytest.mark.asyncio
    async def test_fraud_detection_allowed(self, mock_request):
        """Test payment allowed with low fraud risk."""
        middleware = FraudDetectionMiddleware(None, node_api_base_url="http://localhost:4000")
        
        # Mock request body
        mock_request.json = AsyncMock(return_value={
            "amount": 1000,
            "currency": "NAD",
            "payment_type": "CARD"
        })
        
        # Mock successful fraud check (low risk)
        with patch("httpx.AsyncClient") as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "allowed": True,
                "blocked": False,
                "requiresReview": False,
                "requiresStepUpAuth": False,
                "riskScore": 15,
                "riskLevel": "LOW",
                "actionTaken": "ALLOWED",
                "rulesTriggered": [],
                "fraudIndicators": []
            }
            
            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Mock call_next
            call_next = AsyncMock(return_value=Mock())
            
            # Execute middleware
            response = await middleware.dispatch(mock_request, call_next)
            
            # Verify fraud check attached to request
            assert hasattr(mock_request.state, "fraud_check")
            assert mock_request.state.fraud_check["riskScore"] == 15
            assert call_next.called
    
    @pytest.mark.asyncio
    async def test_fraud_detection_blocked(self, mock_request):
        """Test payment blocked due to high fraud risk."""
        middleware = FraudDetectionMiddleware(None, node_api_base_url="http://localhost:4000")
        
        # Mock request body
        mock_request.json = AsyncMock(return_value={
            "amount": 50000,
            "currency": "NAD",
            "payment_type": "CARD"
        })
        
        # Mock fraud check (high risk, blocked)
        with patch("httpx.AsyncClient") as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "allowed": False,
                "blocked": True,
                "requiresReview": False,
                "requiresStepUpAuth": False,
                "riskScore": 85,
                "riskLevel": "CRITICAL",
                "actionTaken": "BLOCKED",
                "blockReason": "Multiple fraud indicators detected",
                "rulesTriggered": ["CNP_001", "VEL_001"],
                "fraudIndicators": ["HIGH_VALUE_CNP_TRANSACTION", "HIGH_VELOCITY"]
            }
            
            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Mock call_next
            call_next = AsyncMock()
            
            # Execute middleware
            from starlette.responses import JSONResponse
            response = await middleware.dispatch(mock_request, call_next)
            
            # Verify payment blocked
            assert isinstance(response, JSONResponse)
            assert response.status_code == 403
            assert not call_next.called
    
    @pytest.mark.asyncio
    async def test_fraud_detection_requires_review(self, mock_request):
        """Test payment requires manual review."""
        middleware = FraudDetectionMiddleware(None, node_api_base_url="http://localhost:4000")
        
        # Mock request body
        mock_request.json = AsyncMock(return_value={
            "amount": 25000,
            "currency": "NAD"
        })
        
        # Mock fraud check (medium-high risk)
        with patch("httpx.AsyncClient") as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "allowed": False,
                "blocked": False,
                "requiresReview": True,
                "requiresStepUpAuth": False,
                "riskScore": 55,
                "riskLevel": "HIGH",
                "actionTaken": "REVIEW_REQUIRED",
                "rulesTriggered": ["AMT_001"],
                "fraudIndicators": ["LARGE_TRANSACTION"]
            }
            
            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            call_next = AsyncMock()
            
            # Execute middleware
            from starlette.responses import JSONResponse
            response = await middleware.dispatch(mock_request, call_next)
            
            # Verify requires review
            assert isinstance(response, JSONResponse)
            assert response.status_code == 202
            assert not call_next.called
    
    @pytest.mark.asyncio
    async def test_fraud_detection_step_up_auth(self, mock_request):
        """Test step-up authentication required."""
        middleware = FraudDetectionMiddleware(None, node_api_base_url="http://localhost:4000")
        
        # Mock request body
        mock_request.json = AsyncMock(return_value={"amount": 15000})
        
        # Mock fraud check (medium risk, requires step-up)
        with patch("httpx.AsyncClient") as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "allowed": False,
                "blocked": False,
                "requiresReview": False,
                "requiresStepUpAuth": True,
                "riskScore": 35,
                "riskLevel": "MEDIUM",
                "actionTaken": "STEP_UP_AUTH_REQUIRED"
            }
            
            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            call_next = AsyncMock()
            
            # Execute middleware
            from starlette.responses import JSONResponse
            response = await middleware.dispatch(mock_request, call_next)
            
            # Verify step-up auth required
            assert isinstance(response, JSONResponse)
            assert response.status_code == 403
            assert not call_next.called
    
    @pytest.mark.asyncio
    async def test_fraud_detection_service_unavailable(self, mock_request):
        """Test graceful handling when fraud service is unavailable."""
        middleware = FraudDetectionMiddleware(None, node_api_base_url="http://localhost:4000")
        
        # Mock request body
        mock_request.json = AsyncMock(return_value={"amount": 1000})
        
        # Mock service timeout
        with patch("httpx.AsyncClient") as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.post.side_effect = httpx.TimeoutException("Timeout")
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            call_next = AsyncMock()
            
            # Execute middleware - should require manual review
            from starlette.responses import JSONResponse
            response = await middleware.dispatch(mock_request, call_next)
            
            # Verify fails safely with manual review
            assert isinstance(response, JSONResponse)
            assert response.status_code == 202
            assert not call_next.called


# ==================== Payment Rate Limit Tests ====================

class TestPaymentRateLimitMiddleware:
    """Test payment-specific rate limiting."""
    
    @pytest.mark.asyncio
    async def test_payment_rate_limit_within_limit(self, mock_request):
        """Test request within payment rate limit."""
        middleware = PaymentRateLimitMiddleware(None)
        
        call_next = AsyncMock(return_value=Mock())
        
        # First request should pass
        response = await middleware.dispatch(mock_request, call_next)
        assert call_next.called
    
    @pytest.mark.asyncio
    async def test_payment_rate_limit_exceeded(self, mock_request):
        """Test payment rate limit exceeded."""
        middleware = PaymentRateLimitMiddleware(None)
        
        call_next = AsyncMock(return_value=Mock())
        
        # Exhaust rate limit (10 per hour for /api/payments/initiate)
        for i in range(10):
            await middleware.dispatch(mock_request, call_next)
        
        # 11th request should be blocked
        from starlette.responses import JSONResponse
        response = await middleware.dispatch(mock_request, call_next)
        
        assert isinstance(response, JSONResponse)
        assert response.status_code == 429
        assert "Retry-After" in response.headers
    
    @pytest.mark.asyncio
    async def test_payment_rate_limit_skip_non_payment(self):
        """Test rate limit skips non-payment endpoints."""
        middleware = PaymentRateLimitMiddleware(None)
        
        # Create request for non-payment endpoint
        request = Mock(spec=Request)
        request.url.path = "/api/ml/predict"
        
        call_next = AsyncMock(return_value=Mock())
        
        # Should skip rate limiting
        await middleware.dispatch(request, call_next)
        assert call_next.called
    
    @pytest.mark.asyncio
    async def test_auth_endpoint_rate_limit(self):
        """Test stricter rate limit for auth endpoints (brute force protection)."""
        middleware = PaymentRateLimitMiddleware(None)
        
        # Create auth login request
        request = Mock(spec=Request)
        request.url.path = "/api/auth/login"
        request.client.host = "127.0.0.1"
        request.state.user = {"user_id": "user_123"}
        
        call_next = AsyncMock(return_value=Mock())
        
        # Exhaust rate limit (5 per 15 min for /api/auth/login)
        for i in range(5):
            await middleware.dispatch(request, call_next)
        
        # 6th request should be blocked
        from starlette.responses import JSONResponse
        response = await middleware.dispatch(request, call_next)
        
        assert isinstance(response, JSONResponse)
        assert response.status_code == 429


# ==================== Security Headers Tests ====================

class TestSecurityHeadersMiddleware:
    """Test security headers middleware."""
    
    @pytest.mark.asyncio
    async def test_security_headers_added(self):
        """Test security headers are added to response."""
        middleware = SecurityHeadersMiddleware(None)
        
        # Create mock request
        request = Mock(spec=Request)
        request.url.scheme = "https"
        
        # Create mock response
        mock_response = Mock()
        mock_response.headers = {}
        
        call_next = AsyncMock(return_value=mock_response)
        
        # Execute middleware
        response = await middleware.dispatch(request, call_next)
        
        # Verify security headers
        assert "X-Content-Type-Options" in response.headers
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert "X-Frame-Options" in response.headers
        assert response.headers["X-Frame-Options"] == "DENY"
        assert "Strict-Transport-Security" in response.headers
        assert "Content-Security-Policy" in response.headers


# ==================== Audit Logging Tests ====================

class TestAuditLogger:
    """Test audit logging functionality."""
    
    @pytest.mark.asyncio
    async def test_log_authentication_success(self):
        """Test logging successful authentication."""
        logger = AuditLogger(node_api_base_url="http://localhost:4000")
        
        # Mock httpx client
        with patch("httpx.AsyncClient") as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = Mock(status_code=200)
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Log authentication
            await logger.log_authentication(
                success=True,
                user_id="user_123",
                ip_address="127.0.0.1",
                user_agent="test-agent"
            )
            
            # Verify API called
            assert mock_client_instance.post.called
            call_args = mock_client_instance.post.call_args
            assert "AUTHENTICATION_SUCCESS" in str(call_args)
    
    @pytest.mark.asyncio
    async def test_log_2fa_verification(self):
        """Test logging 2FA verification."""
        logger = AuditLogger(node_api_base_url="http://localhost:4000")
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = Mock(status_code=200)
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Log 2FA verification
            await logger.log_2fa_verification(
                success=True,
                user_id="user_123",
                method="SMS_OTP",
                ip_address="127.0.0.1",
                user_agent="test-agent"
            )
            
            # Verify logged
            assert mock_client_instance.post.called
    
    @pytest.mark.asyncio
    async def test_log_payment_operation(self):
        """Test logging payment operation."""
        logger = AuditLogger(node_api_base_url="http://localhost:4000")
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = Mock(status_code=200)
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Log payment
            await logger.log_payment_operation(
                operation="INITIATE",
                user_id="user_123",
                amount=5000.0,
                currency="NAD",
                payment_id="pay_123",
                ip_address="127.0.0.1",
                success=True,
                fraud_risk_score=15,
                twofa_verified=True
            )
            
            # Verify logged
            assert mock_client_instance.post.called
            call_args = mock_client_instance.post.call_args
            assert "PAYMENT_INITIATE" in str(call_args)
    
    @pytest.mark.asyncio
    async def test_log_fraud_detection(self):
        """Test logging fraud detection event."""
        logger = AuditLogger(node_api_base_url="http://localhost:4000")
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = Mock(status_code=200)
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Log fraud detection
            await logger.log_fraud_detection(
                payment_id="pay_123",
                user_id="user_123",
                risk_score=75,
                action_taken="BLOCKED",
                rules_triggered=["CNP_001", "VEL_001"],
                fraud_indicators=["HIGH_VALUE_CNP", "HIGH_VELOCITY"],
                ip_address="127.0.0.1"
            )
            
            # Verify logged with CRITICAL severity
            assert mock_client_instance.post.called
    
    @pytest.mark.asyncio
    async def test_log_security_violation(self):
        """Test logging security violation."""
        logger = AuditLogger(node_api_base_url="http://localhost:4000")
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = Mock(status_code=200)
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Log security violation
            await logger.log_security_violation(
                violation_type="2FA_NOT_VERIFIED",
                user_id="user_123",
                details={"endpoint": "/api/payments/initiate"},
                ip_address="127.0.0.1"
            )
            
            # Verify logged with CRITICAL severity
            assert mock_client_instance.post.called


# ==================== Integration Tests ====================

class TestSecurityIntegration:
    """Test full security stack integration."""
    
    @pytest.mark.asyncio
    async def test_full_security_stack_payment_allowed(self):
        """Test complete security flow for allowed payment."""
        # This test requires all middleware to work together
        # 1. Auth validates JWT
        # 2. 2FA verifies session
        # 3. Fraud detection checks risk
        # 4. Payment processed
        
        # Mock all external calls
        with patch("httpx.AsyncClient") as mock_client:
            # Mock 2FA verification (success)
            mock_2fa_response = Mock()
            mock_2fa_response.status_code = 200
            mock_2fa_response.json.return_value = {"method": "SMS_OTP"}
            
            # Mock fraud detection (low risk)
            mock_fraud_response = Mock()
            mock_fraud_response.status_code = 200
            mock_fraud_response.json.return_value = {
                "allowed": True,
                "blocked": False,
                "riskScore": 10,
                "actionTaken": "ALLOWED"
            }
            
            # Configure mock client to return different responses
            mock_client_instance = AsyncMock()
            mock_client_instance.post.side_effect = [
                mock_2fa_response,
                mock_fraud_response
            ]
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Create complete request
            request = Mock(spec=Request)
            request.url.path = "/api/payments/initiate"
            request.method = "POST"
            request.headers = {"Authorization": "Bearer valid_token"}
            request.client.host = "127.0.0.1"
            request.state.user = {"user_id": "user_123", "email": "test@example.com"}
            request.json = AsyncMock(return_value={"amount": 1000, "currency": "NAD"})
            
            # Execute 2FA middleware
            twofa_middleware = Check2FAMiddleware(None)
            call_next_1 = AsyncMock(return_value=Mock())
            await twofa_middleware.dispatch(request, call_next_1)
            
            # Verify 2FA passed
            assert request.state.twofa_verified is True
            
            # Execute fraud detection middleware
            fraud_middleware = FraudDetectionMiddleware(None)
            call_next_2 = AsyncMock(return_value=Mock())
            await fraud_middleware.dispatch(request, call_next_2)
            
            # Verify fraud check passed
            assert hasattr(request.state, "fraud_check")
            assert request.state.fraud_check["riskScore"] == 10
    
    @pytest.mark.asyncio
    async def test_full_security_stack_payment_blocked(self):
        """Test complete security flow for blocked payment."""
        with patch("httpx.AsyncClient") as mock_client:
            # Mock 2FA verification (success)
            mock_2fa_response = Mock()
            mock_2fa_response.status_code = 200
            mock_2fa_response.json.return_value = {"method": "SMS_OTP"}
            
            # Mock fraud detection (high risk, blocked)
            mock_fraud_response = Mock()
            mock_fraud_response.status_code = 200
            mock_fraud_response.json.return_value = {
                "allowed": False,
                "blocked": True,
                "riskScore": 85,
                "actionTaken": "BLOCKED",
                "blockReason": "High fraud risk"
            }
            
            mock_client_instance = AsyncMock()
            mock_client_instance.post.side_effect = [
                mock_2fa_response,
                mock_fraud_response
            ]
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Create request
            request = Mock(spec=Request)
            request.url.path = "/api/payments/initiate"
            request.method = "POST"
            request.headers = {"Authorization": "Bearer valid_token"}
            request.client.host = "127.0.0.1"
            request.state.user = {"user_id": "user_123"}
            request.json = AsyncMock(return_value={"amount": 50000})
            
            # Execute 2FA middleware (should pass)
            twofa_middleware = Check2FAMiddleware(None)
            call_next = AsyncMock(return_value=Mock())
            await twofa_middleware.dispatch(request, call_next)
            
            # Execute fraud detection (should block)
            fraud_middleware = FraudDetectionMiddleware(None)
            from starlette.responses import JSONResponse
            response = await fraud_middleware.dispatch(request, call_next)
            
            # Verify payment blocked
            assert isinstance(response, JSONResponse)
            assert response.status_code == 403


# ==================== PSD-12 Compliance Tests ====================

class TestPSD12Compliance:
    """Test PSD-12 regulatory compliance."""
    
    @pytest.mark.asyncio
    async def test_section_12_2_2fa_required_for_payments(self):
        """
        PSD-12 Section 12.2: Two-Factor Authentication REQUIRED for EVERY payment.
        """
        middleware = Check2FAMiddleware(None)
        
        # Create payment request without 2FA
        request = Mock(spec=Request)
        request.url.path = "/api/payments/initiate"
        request.state.user = {"user_id": "user_123"}
        request.headers = {"Authorization": "Bearer token"}
        request.client.host = "127.0.0.1"
        
        # Mock failed 2FA verification
        with patch("httpx.AsyncClient") as mock_client:
            mock_response = Mock()
            mock_response.status_code = 403
            mock_response.json.return_value = {"message": "2FA required"}
            
            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            call_next = AsyncMock()
            
            # Should raise HTTPException with PSD-12 violation code
            from fastapi import HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await middleware.dispatch(request, call_next)
            
            # Verify PSD-12 compliance message
            assert exc_info.value.status_code == 403
            detail = exc_info.value.detail
            assert detail["code"] == "PSD12_SECTION_12_2_VIOLATION"
            assert "PSD-12 Section 12.2" in detail["compliance"]
    
    @pytest.mark.asyncio
    async def test_section_11_6_fraud_monitoring_all_payments(self):
        """
        PSD-12 Section 11.6: Monitor ALL payments for fraud.
        """
        middleware = FraudDetectionMiddleware(None)
        
        # Create payment request
        request = Mock(spec=Request)
        request.url.path = "/api/payments/initiate"
        request.state.user = {"user_id": "user_123"}
        request.client.host = "127.0.0.1"
        request.json = AsyncMock(return_value={"amount": 1000})
        
        # Mock fraud detection
        with patch("httpx.AsyncClient") as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "allowed": True,
                "riskScore": 20,
                "actionTaken": "ALLOWED"
            }
            
            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            call_next = AsyncMock(return_value=Mock())
            
            # Execute middleware
            await middleware.dispatch(request, call_next)
            
            # Verify fraud detection was called
            assert mock_client_instance.post.called
            
            # Verify fraud check result attached to request
            assert hasattr(request.state, "fraud_check")
            assert request.state.fraud_check["riskScore"] == 20


# ==================== Error Handling Tests ====================

class TestSecurityErrorHandling:
    """Test error handling in security middleware."""
    
    @pytest.mark.asyncio
    async def test_2fa_service_unavailable(self, mock_request):
        """Test handling when 2FA service is unavailable."""
        middleware = Check2FAMiddleware(None, node_api_base_url="http://invalid:9999")
        
        # Mock network error
        with patch("httpx.AsyncClient") as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.post.side_effect = Exception("Connection refused")
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            call_next = AsyncMock()
            
            # Should raise 503
            from fastapi import HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await middleware.dispatch(mock_request, call_next)
            
            assert exc_info.value.status_code == 503
    
    @pytest.mark.asyncio
    async def test_fraud_service_fails_safely(self, mock_request):
        """Test fraud detection fails safely by requiring review."""
        middleware = FraudDetectionMiddleware(None)
        
        # Mock request body
        mock_request.json = AsyncMock(return_value={"amount": 1000})
        
        # Mock error
        with patch("httpx.AsyncClient") as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.post.side_effect = Exception("Service error")
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            call_next = AsyncMock()
            
            # Should require manual review (fail-safe)
            from starlette.responses import JSONResponse
            response = await middleware.dispatch(mock_request, call_next)
            
            assert isinstance(response, JSONResponse)
            assert response.status_code == 202
            assert not call_next.called


# ==================== Performance Tests ====================

class TestSecurityPerformance:
    """Test security middleware performance."""
    
    @pytest.mark.asyncio
    async def test_rate_limit_cache_cleanup(self):
        """Test rate limit cache cleanup prevents memory leak."""
        middleware = PaymentRateLimitMiddleware(None)
        
        # Add many entries to cache
        for i in range(1000):
            key = f"test_key_{i}"
            middleware.rate_limit_cache[key] = [time.time() - 7200]  # 2 hours ago
        
        assert len(middleware.rate_limit_cache) == 1000
        
        # Trigger cleanup
        middleware._cleanup_old_entries()
        
        # Old entries should be removed
        assert len(middleware.rate_limit_cache) < 1000


# ==================== Test Helpers ====================

def mock_user_authenticated(request: Request, user_id: str = "user_123"):
    """Helper to set authenticated user on request."""
    request.state.user = {
        "user_id": user_id,
        "email": f"{user_id}@example.com",
        "role": "user",
        "is_admin": False
    }


def mock_2fa_verified(request: Request, method: str = "SMS_OTP"):
    """Helper to set 2FA verified on request."""
    request.state.twofa_verified = True
    request.state.twofa_method = method


def mock_fraud_check_passed(request: Request, risk_score: int = 10):
    """Helper to set fraud check result on request."""
    request.state.fraud_check = {
        "allowed": True,
        "blocked": False,
        "riskScore": risk_score,
        "actionTaken": "ALLOWED"
    }


# ==================== Run Tests ====================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
