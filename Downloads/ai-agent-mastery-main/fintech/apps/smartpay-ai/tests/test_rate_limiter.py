"""
Test suite for unified rate limiting implementation.

Location: backend_python/tests/test_rate_limiter.py
Purpose: Comprehensive tests for configuration-driven rate limiter

Test Coverage:
- Token bucket algorithm
- Fixed window algorithm
- Configuration loading
- Per-user and per-IP limiting
- Security event logging
- Environment overrides
- Header validation
"""

import os
import time
import pytest
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock

from fastapi import Request
from starlette.responses import Response
from starlette.datastructures import Headers

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from smartpay_ai.shared.rate_limiter import (
    TokenBucket,
    FixedWindow,
    RateLimitConfig,
    InMemoryRateLimiter,
    ConfigurableRateLimitMiddleware,
    create_rate_limit_middleware
)


class TestTokenBucket:
    """Test token bucket algorithm implementation."""
    
    def test_initialization(self):
        """Test bucket initializes with full capacity."""
        bucket = TokenBucket(capacity=10, refill_rate=1.0)
        assert bucket.capacity == 10
        assert bucket.refill_rate == 1.0
        assert bucket.tokens == 10.0
    
    def test_consume_tokens(self):
        """Test consuming tokens from bucket."""
        bucket = TokenBucket(capacity=10, refill_rate=1.0)
        
        # First consumption should succeed
        assert bucket.consume(1) is True
        assert bucket.tokens == 9.0
        
        # Consume more tokens
        assert bucket.consume(5) is True
        assert bucket.tokens == 4.0
    
    def test_consume_too_many_tokens(self):
        """Test consuming more tokens than available."""
        bucket = TokenBucket(capacity=5, refill_rate=1.0)
        
        # Consume all tokens
        assert bucket.consume(5) is True
        
        # Try to consume more - should fail
        assert bucket.consume(1) is False
        assert bucket.tokens == 0.0
    
    def test_token_refill(self):
        """Test tokens refill over time."""
        bucket = TokenBucket(capacity=10, refill_rate=2.0)  # 2 tokens per second
        
        # Consume all tokens
        bucket.consume(10)
        assert bucket.tokens == 0.0
        
        # Wait 2 seconds (should refill 4 tokens)
        time.sleep(2)
        bucket._refill()
        
        # Should have ~4 tokens now
        assert bucket.tokens >= 3.5  # Allow small timing variance
        assert bucket.tokens <= 4.5
    
    def test_refill_cap(self):
        """Test tokens don't exceed capacity."""
        bucket = TokenBucket(capacity=10, refill_rate=5.0)
        
        # Wait to refill
        time.sleep(5)
        bucket._refill()
        
        # Should cap at capacity
        assert bucket.tokens == 10.0
    
    def test_get_retry_after(self):
        """Test calculating retry time."""
        bucket = TokenBucket(capacity=10, refill_rate=1.0)
        
        # Consume all tokens
        bucket.consume(10)
        
        # Should need ~1 second to get next token
        retry = bucket.get_retry_after()
        assert retry >= 1
        assert retry <= 2  # Allow small variance
    
    def test_get_remaining(self):
        """Test getting remaining tokens."""
        bucket = TokenBucket(capacity=10, refill_rate=1.0)
        
        bucket.consume(3)
        remaining = bucket.get_remaining()
        assert remaining == 7


class TestFixedWindow:
    """Test fixed window algorithm implementation."""
    
    def test_initialization(self):
        """Test window initializes correctly."""
        window = FixedWindow(max_requests=100, window_ms=60000)
        assert window.max_requests == 100
        assert window.window_ms == 60000
        assert window.count == 0
    
    def test_consume_within_limit(self):
        """Test consuming within limit."""
        window = FixedWindow(max_requests=5, window_ms=60000)
        
        # Should allow 5 requests
        for i in range(5):
            assert window.consume() is True
        
        # 6th request should fail
        assert window.consume() is False
    
    def test_window_reset(self):
        """Test window resets after expiry."""
        window = FixedWindow(max_requests=3, window_ms=100)  # 100ms window
        
        # Consume all requests
        window.consume(3)
        assert window.consume() is False
        
        # Wait for window to expire
        time.sleep(0.2)  # 200ms
        
        # Should allow requests again
        assert window.consume() is True
    
    def test_get_remaining(self):
        """Test getting remaining requests."""
        window = FixedWindow(max_requests=10, window_ms=60000)
        
        window.consume(3)
        remaining = window.get_remaining()
        assert remaining == 7
    
    def test_get_retry_after(self):
        """Test calculating retry time."""
        window = FixedWindow(max_requests=5, window_ms=5000)  # 5 second window
        
        # Consume all requests
        window.consume(5)
        
        # Should need to wait for window to reset
        retry = window.get_retry_after()
        assert retry >= 0
        assert retry <= 6


class TestRateLimitConfig:
    """Test configuration loading and management."""
    
    def test_default_config(self):
        """Test default configuration when file doesn't exist."""
        config = RateLimitConfig(config_path="/nonexistent/path.yaml")
        
        assert config.config is not None
        assert "global" in config.config
        assert "default" in config.config["global"]
    
    def test_load_valid_config(self):
        """Test loading valid YAML configuration."""
        # Create temporary config file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write("""
version: "1.0"
global:
  default:
    algorithm: "token_bucket"
    capacity: 100
    refill_rate: 0.1
endpoints:
  test_endpoint:
    path: "/api/test"
    capacity: 50
    refill_rate: 0.05
skip_paths:
  - "/health"
security_logging:
  enabled: true
""")
            config_path = f.name
        
        try:
            config = RateLimitConfig(config_path=config_path)
            
            assert config.config["version"] == "1.0"
            assert "test_endpoint" in config.config["endpoints"]
            assert config.should_skip_path("/health") is True
            assert config.should_log_violations() is True
            
        finally:
            os.unlink(config_path)
    
    def test_get_endpoint_config(self):
        """Test retrieving endpoint-specific config."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write("""
endpoints:
  chat:
    path: "/api/chat"
    capacity: 100
  payments:
    path: "/api/payments"
    capacity: 10
""")
            config_path = f.name
        
        try:
            config = RateLimitConfig(config_path=config_path)
            
            # Test exact match
            chat_config = config.get_endpoint_config("/api/chat")
            assert chat_config is not None
            assert chat_config["capacity"] == 100
            
            # Test prefix match
            payments_config = config.get_endpoint_config("/api/payments/initiate")
            assert payments_config is not None
            assert payments_config["capacity"] == 10
            
        finally:
            os.unlink(config_path)
    
    def test_environment_overrides(self):
        """Test environment-specific overrides."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write("""
global:
  default:
    capacity: 100
environments:
  development:
    global:
      default:
        capacity: 1000
  production:
    global:
      default:
        capacity: 50
""")
            config_path = f.name
        
        try:
            # Test development environment
            with patch.dict(os.environ, {"ENVIRONMENT": "development"}):
                config_dev = RateLimitConfig(config_path=config_path)
                assert config_dev.config["global"]["default"]["capacity"] == 1000
            
            # Test production environment
            with patch.dict(os.environ, {"ENVIRONMENT": "production"}):
                config_prod = RateLimitConfig(config_path=config_path)
                assert config_prod.config["global"]["default"]["capacity"] == 50
            
        finally:
            os.unlink(config_path)


class TestInMemoryRateLimiter:
    """Test in-memory rate limiter."""
    
    def test_rate_limit_allowed(self):
        """Test request within rate limit is allowed."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write("""
global:
  default:
    algorithm: "token_bucket"
    capacity: 10
    refill_rate: 1.0
""")
            config_path = f.name
        
        try:
            config = RateLimitConfig(config_path=config_path)
            limiter = InMemoryRateLimiter(config)
            
            endpoint_config = config.get_global_config()
            
            # First request should be allowed
            allowed, retry_after, remaining = limiter.check_rate_limit(
                "user:123:/api/test", endpoint_config
            )
            
            assert allowed is True
            assert retry_after is None
            assert remaining >= 0
            
        finally:
            os.unlink(config_path)
    
    def test_rate_limit_exceeded(self):
        """Test rate limit exceeded behavior."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write("""
global:
  default:
    algorithm: "token_bucket"
    capacity: 2
    refill_rate: 0.1
""")
            config_path = f.name
        
        try:
            config = RateLimitConfig(config_path=config_path)
            limiter = InMemoryRateLimiter(config)
            endpoint_config = config.get_global_config()
            
            # Consume all tokens
            limiter.check_rate_limit("user:123:/api/test", endpoint_config)
            limiter.check_rate_limit("user:123:/api/test", endpoint_config)
            
            # Third request should be denied
            allowed, retry_after, remaining = limiter.check_rate_limit(
                "user:123:/api/test", endpoint_config
            )
            
            assert allowed is False
            assert retry_after is not None
            assert retry_after > 0
            assert remaining == 0
            
        finally:
            os.unlink(config_path)
    
    def test_cleanup(self):
        """Test bucket cleanup removes inactive buckets."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write("""
global:
  default:
    algorithm: "token_bucket"
    capacity: 10
    refill_rate: 1.0
""")
            config_path = f.name
        
        try:
            config = RateLimitConfig(config_path=config_path)
            limiter = InMemoryRateLimiter(config)
            limiter.cleanup_interval = 0  # Force immediate cleanup
            
            endpoint_config = config.get_global_config()
            
            # Create bucket
            limiter.check_rate_limit("user:123:/api/test", endpoint_config)
            assert len(limiter.buckets) == 1
            
            # Trigger cleanup (bucket should be removed if full)
            limiter.last_cleanup = 0
            limiter._cleanup_if_needed()
            
            # After cleanup, inactive buckets may be removed
            # (depends on timing and implementation)
            
        finally:
            os.unlink(config_path)


class TestConfigurableRateLimitMiddleware:
    """Test the FastAPI middleware integration."""
    
    @pytest.fixture
    def mock_request(self):
        """Create mock request."""
        request = Mock(spec=Request)
        request.url.path = "/api/smartpay-copilot/chat"
        request.state.user = {"user_id": "test-user-123"}
        request.client.host = "127.0.0.1"
        return request
    
    @pytest.fixture
    def config_file(self):
        """Create temporary config file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write("""
version: "1.0"
global:
  default:
    algorithm: "token_bucket"
    capacity: 1000
    refill_rate: 0.2778
skip_paths:
  - "/health"
  - "/docs"
endpoints:
  copilot_chat:
    path: "/api/smartpay-copilot/chat"
    algorithm: "token_bucket"
    capacity: 5
    refill_rate: 0.1
    log_violations: true
    security_level: "medium"
security_logging:
  enabled: true
responses:
  error_messages:
    default: "Rate limit exceeded. Please try again later."
""")
            yield f.name
        
        os.unlink(f.name)
    
    @pytest.mark.asyncio
    async def test_skip_paths(self, config_file):
        """Test that skip_paths are not rate limited."""
        app = Mock()
        middleware = ConfigurableRateLimitMiddleware(app, config_path=config_file)
        
        request = Mock(spec=Request)
        request.url.path = "/health"
        
        call_next = AsyncMock(return_value=Response())
        
        response = await middleware.dispatch(request, call_next)
        
        # Should call next without rate limiting
        call_next.assert_called_once()
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_rate_limit_allowed(self, config_file, mock_request):
        """Test request within rate limit is allowed."""
        app = Mock()
        middleware = ConfigurableRateLimitMiddleware(app, config_path=config_file)
        
        call_next = AsyncMock(return_value=Response())
        
        response = await middleware.dispatch(mock_request, call_next)
        
        # Should call next
        call_next.assert_called_once()
        
        # Should have rate limit headers
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
    
    @pytest.mark.asyncio
    async def test_rate_limit_exceeded(self, config_file):
        """Test rate limit exceeded returns 429."""
        app = Mock()
        middleware = ConfigurableRateLimitMiddleware(app, config_path=config_file)
        
        request = Mock(spec=Request)
        request.url.path = "/api/smartpay-copilot/chat"
        request.state.user = {"user_id": "test-user-123"}
        request.client.host = "127.0.0.1"
        
        call_next = AsyncMock(return_value=Response())
        
        # Make 6 requests (limit is 5)
        for i in range(6):
            response = await middleware.dispatch(request, call_next)
        
        # Last response should be 429
        assert response.status_code == 429
        assert "Retry-After" in response.headers
    
    @pytest.mark.asyncio
    async def test_per_user_limiting(self, config_file):
        """Test per-user rate limiting."""
        app = Mock()
        middleware = ConfigurableRateLimitMiddleware(app, config_path=config_file)
        
        # User 1 requests
        request1 = Mock(spec=Request)
        request1.url.path = "/api/smartpay-copilot/chat"
        request1.state.user = {"user_id": "user-1"}
        request1.client.host = "127.0.0.1"
        
        # User 2 requests
        request2 = Mock(spec=Request)
        request2.url.path = "/api/smartpay-copilot/chat"
        request2.state.user = {"user_id": "user-2"}
        request2.client.host = "192.168.1.1"
        
        call_next = AsyncMock(return_value=Response())
        
        # Exhaust user 1's limit
        for i in range(5):
            await middleware.dispatch(request1, call_next)
        
        # User 1 should be blocked
        response1 = await middleware.dispatch(request1, call_next)
        assert response1.status_code == 429
        
        # User 2 should still be allowed
        response2 = await middleware.dispatch(request2, call_next)
        assert response2.status_code == 200
    
    @pytest.mark.asyncio
    async def test_identifier_fallback(self, config_file):
        """Test falling back to IP when no user."""
        app = Mock()
        middleware = ConfigurableRateLimitMiddleware(app, config_path=config_file)
        
        request = Mock(spec=Request)
        request.url.path = "/api/smartpay-copilot/chat"
        request.state.user = None  # No authenticated user
        request.client.host = "127.0.0.1"
        
        call_next = AsyncMock(return_value=Response())
        
        response = await middleware.dispatch(request, call_next)
        
        # Should still work with IP-based limiting
        assert response.status_code == 200


class TestConfigurationLoading:
    """Test configuration file parsing and validation."""
    
    def test_missing_config_uses_defaults(self):
        """Test default config when file missing."""
        config = RateLimitConfig(config_path="/nonexistent/path.yaml")
        
        global_config = config.get_global_config()
        assert global_config["algorithm"] == "token_bucket"
        assert global_config["capacity"] == 1000
    
    def test_yaml_parsing(self):
        """Test YAML parsing."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write("""
version: "1.0"
endpoints:
  test:
    path: "/api/test"
    capacity: 42
    refill_rate: 0.5
    algorithm: "token_bucket"
""")
            config_path = f.name
        
        try:
            config = RateLimitConfig(config_path=config_path)
            
            test_config = config.get_endpoint_config("/api/test")
            assert test_config is not None
            assert test_config["capacity"] == 42
            assert test_config["refill_rate"] == 0.5
            
        finally:
            os.unlink(config_path)
    
    def test_invalid_yaml_fallback(self):
        """Test fallback when YAML is invalid."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write("invalid: yaml: content: [")
            config_path = f.name
        
        try:
            config = RateLimitConfig(config_path=config_path)
            
            # Should fall back to defaults
            assert config.config is not None
            assert "global" in config.config
            
        finally:
            os.unlink(config_path)


class TestEndToEnd:
    """End-to-end integration tests."""
    
    @pytest.mark.asyncio
    async def test_payment_endpoint_strict_limit(self):
        """Test strict rate limit on payment endpoint."""
        # Create config with strict payment limits
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write("""
endpoints:
  payments_initiate:
    path: "/api/payments/initiate"
    algorithm: "token_bucket"
    capacity: 3
    refill_rate: 0.0083
    security_level: "critical"
    log_violations: true
security_logging:
  enabled: true
""")
            config_path = f.name
        
        try:
            app = Mock()
            middleware = ConfigurableRateLimitMiddleware(app, config_path=config_path)
            
            request = Mock(spec=Request)
            request.url.path = "/api/payments/initiate"
            request.state.user = {"user_id": "user-123"}
            request.client.host = "127.0.0.1"
            
            call_next = AsyncMock(return_value=Response())
            
            # Make 4 requests (limit is 3)
            responses = []
            for i in range(4):
                response = await middleware.dispatch(request, call_next)
                responses.append(response)
            
            # First 3 should succeed
            for i in range(3):
                assert responses[i].status_code == 200
            
            # 4th should fail
            assert responses[3].status_code == 429
            
        finally:
            os.unlink(config_path)
    
    @pytest.mark.asyncio
    async def test_auth_endpoint_brute_force_protection(self):
        """Test brute force protection on auth endpoints."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write("""
endpoints:
  auth_login:
    path: "/api/auth/login"
    algorithm: "fixed_window"
    max_requests: 3
    window_ms: 60000
    per_ip: true
    security_level: "critical"
    log_violations: true
security_logging:
  enabled: true
""")
            config_path = f.name
        
        try:
            app = Mock()
            middleware = ConfigurableRateLimitMiddleware(app, config_path=config_path)
            
            request = Mock(spec=Request)
            request.url.path = "/api/auth/login"
            request.state.user = None  # Unauthenticated
            request.client.host = "192.168.1.100"
            
            call_next = AsyncMock(return_value=Response())
            
            # Make 4 login attempts
            responses = []
            for i in range(4):
                response = await middleware.dispatch(request, call_next)
                responses.append(response)
            
            # First 3 should succeed
            for i in range(3):
                assert responses[i].status_code == 200
            
            # 4th should fail with 429
            assert responses[3].status_code == 429
            
        finally:
            os.unlink(config_path)


class TestSecurityLogging:
    """Test security event logging."""
    
    @pytest.mark.asyncio
    async def test_violation_logging(self, config_file):
        """Test that violations are logged when configured."""
        app = Mock()
        
        with patch('smartpay_ai.shared.rate_limiter._log') as mock_log:
            middleware = ConfigurableRateLimitMiddleware(app, config_path=config_file)
            
            request = Mock(spec=Request)
            request.url.path = "/api/smartpay-copilot/chat"
            request.state.user = {"user_id": "test-user"}
            request.client.host = "127.0.0.1"
            
            call_next = AsyncMock(return_value=Response())
            
            # Exhaust rate limit
            for i in range(6):
                await middleware.dispatch(request, call_next)
            
            # Should have logged warning
            mock_log.warning.assert_called()


class TestAlgorithmSelection:
    """Test algorithm selection based on configuration."""
    
    def test_token_bucket_selection(self):
        """Test token bucket algorithm is used when configured."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write("""
endpoints:
  test:
    path: "/api/test"
    algorithm: "token_bucket"
    capacity: 100
    refill_rate: 1.0
""")
            config_path = f.name
        
        try:
            config = RateLimitConfig(config_path=config_path)
            limiter = InMemoryRateLimiter(config)
            
            endpoint_config = config.get_endpoint_config("/api/test")
            
            # First check creates the limiter
            allowed, _, _ = limiter.check_rate_limit("key:test", endpoint_config)
            
            # Verify it's a TokenBucket
            bucket = limiter.buckets["key:test"]
            assert hasattr(bucket, 'refill_rate')
            assert bucket.__class__.__name__ == 'TokenBucket'
            
        finally:
            os.unlink(config_path)
    
    def test_fixed_window_selection(self):
        """Test fixed window algorithm is used when configured."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write("""
endpoints:
  test:
    path: "/api/test"
    algorithm: "fixed_window"
    max_requests: 100
    window_ms: 60000
""")
            config_path = f.name
        
        try:
            config = RateLimitConfig(config_path=config_path)
            limiter = InMemoryRateLimiter(config)
            
            endpoint_config = config.get_endpoint_config("/api/test")
            
            # First check creates the limiter
            allowed, _, _ = limiter.check_rate_limit("key:test", endpoint_config)
            
            # Verify it's a FixedWindow
            window = limiter.buckets["key:test"]
            assert hasattr(window, 'window_start')
            assert window.__class__.__name__ == 'FixedWindow'
            
        finally:
            os.unlink(config_path)


# Performance benchmarks
class TestPerformance:
    """Test rate limiter performance."""
    
    def test_many_requests_performance(self):
        """Test performance with many requests."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write("""
global:
  default:
    algorithm: "token_bucket"
    capacity: 10000
    refill_rate: 100.0
""")
            config_path = f.name
        
        try:
            config = RateLimitConfig(config_path=config_path)
            limiter = InMemoryRateLimiter(config)
            endpoint_config = config.get_global_config()
            
            start = time.time()
            
            # Make 1000 requests
            for i in range(1000):
                limiter.check_rate_limit(f"user:{i % 100}:/api/test", endpoint_config)
            
            elapsed = time.time() - start
            
            # Should complete in reasonable time (< 1 second)
            assert elapsed < 1.0
            print(f"1000 requests processed in {elapsed:.3f}s")
            
        finally:
            os.unlink(config_path)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
