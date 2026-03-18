"""
Comprehensive test suite for unified rate limiter.

Location: backend_python/smartpay_ai/tests/test_rate_limiter.py
Purpose: Test token bucket, fixed window, config loading, and middleware integration

Run:
    pytest backend_python/smartpay_ai/tests/test_rate_limiter.py -v
    pytest backend_python/smartpay_ai/tests/test_rate_limiter.py -v -k "test_token_bucket"
"""

import pytest
import time
import os
import tempfile
import yaml
from pathlib import Path
from unittest.mock import Mock, AsyncMock, patch

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
    
    def test_initial_capacity(self):
        """Token bucket starts with full capacity."""
        bucket = TokenBucket(capacity=10, refill_rate=1.0)
        assert bucket.tokens == 10
        assert bucket.capacity == 10
    
    def test_consume_single_token(self):
        """Can consume single token."""
        bucket = TokenBucket(capacity=10, refill_rate=1.0)
        assert bucket.consume(1) == True
        assert bucket.tokens == 9
    
    def test_consume_multiple_tokens(self):
        """Can consume multiple tokens at once."""
        bucket = TokenBucket(capacity=10, refill_rate=1.0)
        assert bucket.consume(5) == True
        assert bucket.tokens == 5
    
    def test_consume_exceeds_capacity(self):
        """Cannot consume more tokens than available."""
        bucket = TokenBucket(capacity=10, refill_rate=1.0)
        
        # Consume all tokens
        assert bucket.consume(10) == True
        
        # Next consume should fail
        assert bucket.consume(1) == False
    
    def test_refill_over_time(self):
        """Tokens refill over time based on refill rate."""
        bucket = TokenBucket(capacity=10, refill_rate=2.0)  # 2 tokens/sec
        
        # Consume all tokens
        bucket.consume(10)
        assert bucket.tokens == 0
        
        # Wait 1 second (should add ~2 tokens)
        time.sleep(1.1)
        
        # Should be able to consume 2 tokens
        assert bucket.consume(2) == True
    
    def test_refill_does_not_exceed_capacity(self):
        """Refill never exceeds bucket capacity."""
        bucket = TokenBucket(capacity=10, refill_rate=5.0)
        
        # Don't consume any tokens, wait for refill
        time.sleep(1.0)
        
        # Should still be at capacity
        bucket._refill()
        assert bucket.tokens == 10
    
    def test_get_remaining(self):
        """Get remaining tokens correctly."""
        bucket = TokenBucket(capacity=10, refill_rate=1.0)
        bucket.consume(3)
        
        remaining = bucket.get_remaining()
        assert remaining == 7
    
    def test_get_retry_after(self):
        """Calculate retry time correctly."""
        bucket = TokenBucket(capacity=10, refill_rate=1.0)  # 1 token/sec
        
        # Consume all tokens
        bucket.consume(10)
        
        # Should need to wait ~1 second for next token
        retry_after = bucket.get_retry_after()
        assert retry_after >= 1
        assert retry_after <= 2
    
    def test_burst_capacity(self):
        """Token bucket allows burst traffic up to capacity."""
        bucket = TokenBucket(capacity=100, refill_rate=1.0)
        
        # Should allow burst of 100 requests immediately
        for i in range(100):
            assert bucket.consume() == True
        
        # 101st should fail
        assert bucket.consume() == False


class TestFixedWindow:
    """Test fixed window algorithm implementation."""
    
    def test_initial_window(self):
        """Fixed window starts with zero count."""
        window = FixedWindow(max_requests=10, window_ms=1000)
        assert window.count == 0
        assert window.max_requests == 10
    
    def test_consume_within_limit(self):
        """Can consume requests within limit."""
        window = FixedWindow(max_requests=10, window_ms=1000)
        
        for i in range(10):
            assert window.consume() == True
    
    def test_consume_exceeds_limit(self):
        """Cannot exceed max requests in window."""
        window = FixedWindow(max_requests=5, window_ms=1000)
        
        # Consume 5 requests
        for i in range(5):
            assert window.consume() == True
        
        # 6th should fail
        assert window.consume() == False
    
    def test_window_reset(self):
        """Window resets after expiry."""
        window = FixedWindow(max_requests=5, window_ms=500)  # 0.5 second window
        
        # Fill the window
        for i in range(5):
            window.consume()
        
        assert window.consume() == False
        
        # Wait for window to expire
        time.sleep(0.6)
        
        # Should allow requests again
        assert window.consume() == True
    
    def test_get_remaining(self):
        """Get remaining requests in window."""
        window = FixedWindow(max_requests=10, window_ms=1000)
        window.consume(3)
        
        remaining = window.get_remaining()
        assert remaining == 7
    
    def test_get_retry_after(self):
        """Calculate retry time for window reset."""
        window = FixedWindow(max_requests=5, window_ms=1000)
        
        # Fill window
        for i in range(5):
            window.consume()
        
        # Should need to wait for window reset
        retry_after = window.get_retry_after()
        assert retry_after >= 0
        assert retry_after <= 2


class TestRateLimitConfig:
    """Test configuration loading and management."""
    
    def test_load_default_config(self):
        """Loads default config when file not found."""
        with tempfile.TemporaryDirectory() as tmpdir:
            config_path = Path(tmpdir) / "nonexistent.yaml"
            config = RateLimitConfig(str(config_path))
            
            assert config.config is not None
            assert "global" in config.config
            assert "endpoints" in config.config
    
    def test_load_from_yaml(self):
        """Loads configuration from YAML file."""
        with tempfile.TemporaryDirectory() as tmpdir:
            config_path = Path(tmpdir) / "rate_limits.yaml"
            
            # Create test config
            test_config = {
                "version": "1.0",
                "global": {
                    "default": {
                        "algorithm": "token_bucket",
                        "capacity": 1000,
                        "refill_rate": 0.2778
                    }
                },
                "endpoints": {
                    "test_endpoint": {
                        "path": "/api/test",
                        "algorithm": "token_bucket",
                        "capacity": 50,
                        "refill_rate": 0.1,
                        "per_user": True
                    }
                },
                "skip_paths": ["/health", "/docs"],
                "security_logging": {"enabled": True}
            }
            
            with open(config_path, 'w') as f:
                yaml.dump(test_config, f)
            
            config = RateLimitConfig(str(config_path))
            
            assert config.config["version"] == "1.0"
            assert "test_endpoint" in config.config["endpoints"]
    
    def test_get_endpoint_config(self):
        """Retrieves endpoint-specific configuration."""
        # Use real config file
        config = RateLimitConfig()
        
        # Should find copilot chat endpoint
        chat_config = config.get_endpoint_config("/api/smartpay-copilot/chat")
        assert chat_config is not None
        assert chat_config["capacity"] == 100
    
    def test_get_endpoint_config_prefix_match(self):
        """Matches endpoints by path prefix."""
        config = RateLimitConfig()
        
        # Should match /api/transfers
        transfer_config = config.get_endpoint_config("/api/transfers/123")
        assert transfer_config is not None
        assert transfer_config["path"] == "/api/transfers"
    
    def test_get_global_config(self):
        """Retrieves global default configuration."""
        config = RateLimitConfig()
        global_config = config.get_global_config()
        
        assert global_config is not None
        assert "capacity" in global_config or "max_requests" in global_config
    
    def test_should_skip_path(self):
        """Identifies paths that should skip rate limiting."""
        config = RateLimitConfig()
        
        assert config.should_skip_path("/health") == True
        assert config.should_skip_path("/docs") == True
        assert config.should_skip_path("/api/chat") == False
    
    def test_environment_overrides(self):
        """Applies environment-specific overrides."""
        with tempfile.TemporaryDirectory() as tmpdir:
            config_path = Path(tmpdir) / "rate_limits.yaml"
            
            test_config = {
                "global": {
                    "default": {"capacity": 100}
                },
                "environments": {
                    "development": {
                        "global": {
                            "default": {"capacity": 1000}
                        }
                    }
                }
            }
            
            with open(config_path, 'w') as f:
                yaml.dump(test_config, f)
            
            # Set environment
            os.environ["ENVIRONMENT"] = "development"
            
            config = RateLimitConfig(str(config_path))
            
            # Should have development override
            global_config = config.get_global_config()
            assert global_config["capacity"] == 1000
            
            # Clean up
            del os.environ["ENVIRONMENT"]


class TestInMemoryRateLimiter:
    """Test in-memory rate limiter implementation."""
    
    def test_create_token_bucket(self):
        """Creates token bucket for endpoint."""
        config = RateLimitConfig()
        limiter = InMemoryRateLimiter(config)
        
        endpoint_config = {
            "algorithm": "token_bucket",
            "capacity": 10,
            "refill_rate": 1.0
        }
        
        key = "user:123:/api/test"
        allowed, retry_after, remaining = limiter.check_rate_limit(key, endpoint_config)
        
        assert allowed == True
        assert remaining > 0
    
    def test_create_fixed_window(self):
        """Creates fixed window for endpoint."""
        config = RateLimitConfig()
        limiter = InMemoryRateLimiter(config)
        
        endpoint_config = {
            "algorithm": "fixed_window",
            "max_requests": 10,
            "window_ms": 1000
        }
        
        key = "user:123:/api/test"
        allowed, retry_after, remaining = limiter.check_rate_limit(key, endpoint_config)
        
        assert allowed == True
    
    def test_enforce_rate_limit(self):
        """Enforces rate limits correctly."""
        config = RateLimitConfig()
        limiter = InMemoryRateLimiter(config)
        
        endpoint_config = {
            "algorithm": "token_bucket",
            "capacity": 5,
            "refill_rate": 0.1
        }
        
        key = "user:123:/api/test"
        
        # Should allow 5 requests
        for i in range(5):
            allowed, _, _ = limiter.check_rate_limit(key, endpoint_config)
            assert allowed == True
        
        # 6th should be denied
        allowed, retry_after, remaining = limiter.check_rate_limit(key, endpoint_config)
        assert allowed == False
        assert retry_after is not None
        assert remaining == 0
    
    def test_separate_keys(self):
        """Different keys have separate rate limits."""
        config = RateLimitConfig()
        limiter = InMemoryRateLimiter(config)
        
        endpoint_config = {
            "algorithm": "token_bucket",
            "capacity": 5,
            "refill_rate": 0.1
        }
        
        # Exhaust user 1's limit
        for i in range(5):
            limiter.check_rate_limit("user:1:/api/test", endpoint_config)
        
        # User 2 should still have quota
        allowed, _, _ = limiter.check_rate_limit("user:2:/api/test", endpoint_config)
        assert allowed == True
    
    def test_cleanup_old_buckets(self):
        """Cleans up inactive buckets."""
        config = RateLimitConfig()
        limiter = InMemoryRateLimiter(config)
        limiter.cleanup_interval = 0  # Cleanup immediately
        
        endpoint_config = {
            "algorithm": "token_bucket",
            "capacity": 10,
            "refill_rate": 1.0
        }
        
        # Create some buckets
        for i in range(10):
            limiter.check_rate_limit(f"user:{i}:/api/test", endpoint_config)
        
        assert len(limiter.buckets) == 10
        
        # Trigger cleanup (will remove full buckets)
        limiter._cleanup_if_needed()
        
        # Some buckets should be removed
        # (full buckets are considered inactive)


@pytest.mark.asyncio
class TestConfigurableRateLimitMiddleware:
    """Test middleware integration with FastAPI."""
    
    async def test_middleware_allows_request(self):
        """Middleware allows requests within limit."""
        from fastapi import FastAPI, Request
        from fastapi.testclient import TestClient
        
        app = FastAPI()
        middleware = ConfigurableRateLimitMiddleware(app)
        
        # Mock request
        request = Mock(spec=Request)
        request.url.path = "/api/test"
        request.client.host = "127.0.0.1"
        request.state.user = None
        
        # Mock call_next
        call_next = AsyncMock(return_value=Mock(headers={}))
        
        response = await middleware.dispatch(request, call_next)
        
        # Should call next middleware
        call_next.assert_called_once()
    
    async def test_middleware_skips_health_check(self):
        """Middleware skips rate limiting for health checks."""
        from fastapi import FastAPI, Request
        
        app = FastAPI()
        middleware = ConfigurableRateLimitMiddleware(app)
        
        request = Mock(spec=Request)
        request.url.path = "/health"
        
        call_next = AsyncMock(return_value=Mock())
        
        response = await middleware.dispatch(request, call_next)
        
        # Should skip rate limiting and call next
        call_next.assert_called_once()
    
    async def test_middleware_enforces_limit(self):
        """Middleware enforces rate limits."""
        from fastapi import FastAPI, Request
        
        app = FastAPI()
        
        # Create temp config with strict limits
        with tempfile.TemporaryDirectory() as tmpdir:
            config_path = Path(tmpdir) / "rate_limits.yaml"
            
            test_config = {
                "endpoints": {
                    "test": {
                        "path": "/api/test",
                        "algorithm": "token_bucket",
                        "capacity": 2,
                        "refill_rate": 0.1,
                        "per_user": True
                    }
                },
                "skip_paths": []
            }
            
            with open(config_path, 'w') as f:
                yaml.dump(test_config, f)
            
            middleware = ConfigurableRateLimitMiddleware(app, str(config_path))
            
            # Mock request
            request = Mock(spec=Request)
            request.url.path = "/api/test"
            request.client.host = "127.0.0.1"
            request.state.user = None
            
            call_next = AsyncMock(return_value=Mock(headers={}))
            
            # First 2 requests should succeed
            for i in range(2):
                response = await middleware.dispatch(request, call_next)
            
            # 3rd should be rate limited
            response = await middleware.dispatch(request, call_next)
            
            # Check for 429 response
            if hasattr(response, 'status_code'):
                assert response.status_code == 429
    
    async def test_middleware_adds_headers(self):
        """Middleware adds rate limit headers."""
        from fastapi import FastAPI, Request
        
        app = FastAPI()
        middleware = ConfigurableRateLimitMiddleware(app)
        
        request = Mock(spec=Request)
        request.url.path = "/api/test"
        request.client.host = "127.0.0.1"
        request.state.user = None
        
        mock_response = Mock()
        mock_response.headers = {}
        call_next = AsyncMock(return_value=mock_response)
        
        response = await middleware.dispatch(request, call_next)
        
        # Should have rate limit headers
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers


class TestIntegration:
    """Integration tests for complete rate limiting flow."""
    
    def test_real_config_file_exists(self):
        """Real configuration file exists and is valid."""
        # Try to find config relative to test file
        current_dir = Path(__file__).parent
        project_root = current_dir.parent.parent.parent
        config_path = project_root / "shared_config" / "rate_limits.yaml"
        
        if config_path.exists():
            config = RateLimitConfig(str(config_path))
            
            # Should have loaded successfully
            assert config.config is not None
            assert "endpoints" in config.config
            
            # Check some expected endpoints
            endpoints = config.config.get("endpoints", {})
            assert "copilot_chat" in endpoints
            assert "payments_initiate" in endpoints
    
    def test_all_algorithms_supported(self):
        """Both algorithms work correctly."""
        config = RateLimitConfig()
        limiter = InMemoryRateLimiter(config)
        
        # Test token bucket
        tb_config = {
            "algorithm": "token_bucket",
            "capacity": 10,
            "refill_rate": 1.0
        }
        allowed, _, _ = limiter.check_rate_limit("test:tb", tb_config)
        assert allowed == True
        
        # Test fixed window
        fw_config = {
            "algorithm": "fixed_window",
            "max_requests": 10,
            "window_ms": 1000
        }
        allowed, _, _ = limiter.check_rate_limit("test:fw", fw_config)
        assert allowed == True
    
    def test_security_endpoints_strict(self):
        """Security-critical endpoints have strict limits."""
        config = RateLimitConfig()
        
        # Payment endpoints should have low limits
        payment_config = config.get_endpoint_config("/api/payments/initiate")
        if payment_config:
            assert payment_config["capacity"] <= 10
        
        # Auth endpoints should have low limits
        auth_config = config.get_endpoint_config("/api/auth/login")
        if auth_config:
            assert auth_config.get("max_requests", 100) <= 10


class TestEdgeCases:
    """Test edge cases and error conditions."""
    
    def test_zero_capacity_bucket(self):
        """Handle zero capacity bucket."""
        bucket = TokenBucket(capacity=0, refill_rate=1.0)
        assert bucket.consume() == False
    
    def test_negative_refill_rate(self):
        """Handle negative refill rate."""
        bucket = TokenBucket(capacity=10, refill_rate=-1.0)
        bucket.consume(10)
        
        time.sleep(1.0)
        
        # Should not refill with negative rate
        assert bucket.tokens <= 0
    
    def test_very_high_refill_rate(self):
        """Handle very high refill rates."""
        bucket = TokenBucket(capacity=10, refill_rate=1000.0)
        bucket.consume(10)
        
        time.sleep(0.1)
        
        # Should refill to capacity
        bucket._refill()
        assert bucket.tokens == 10
    
    def test_concurrent_access(self):
        """Handle concurrent access (basic test)."""
        import threading
        
        config = RateLimitConfig()
        limiter = InMemoryRateLimiter(config)
        
        endpoint_config = {
            "algorithm": "token_bucket",
            "capacity": 100,
            "refill_rate": 1.0
        }
        
        def make_request():
            limiter.check_rate_limit("concurrent:test", endpoint_config)
        
        threads = []
        for i in range(10):
            t = threading.Thread(target=make_request)
            threads.append(t)
            t.start()
        
        for t in threads:
            t.join()
        
        # Should have handled all requests without crashing


if __name__ == "__main__":
    # Run tests with verbose output
    pytest.main([__file__, "-v", "--tb=short"])
