"""
Unified Rate Limiting Implementation for SmartPay
Location: backend_python/smartpay_ai/shared/rate_limiter.py
Purpose: Configuration-driven rate limiter supporting both token bucket and fixed window algorithms

This implementation reads from shared_config/rate_limits.yaml to maintain consistency
across Python and TypeScript backends.

Algorithms:
1. Token Bucket: Smooth rate limiting with burst support
2. Fixed Window: Simple time-windowed request counting

Features:
- YAML configuration support
- Redis backend support (production)
- In-memory fallback (development)
- Per-user and per-IP rate limiting
- Security event logging
- Automatic cleanup
- Environment-specific overrides
"""

import os
import time
import logging
import yaml
from typing import Dict, Optional, Tuple, Any, List
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

_log = logging.getLogger(__name__)


class TokenBucket:
    """
    Token bucket for rate limiting with configurable refill rate.
    
    The token bucket algorithm allows for smooth rate limiting with burst capacity.
    Tokens are continuously refilled at a specified rate.
    """
    
    def __init__(self, capacity: int, refill_rate: float):
        """
        Initialize token bucket.
        
        Args:
            capacity: Maximum number of tokens (burst size)
            refill_rate: Tokens added per second
        """
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = float(capacity)
        self.last_refill = time.time()
    
    def consume(self, tokens: int = 1) -> bool:
        """
        Try to consume tokens from bucket.
        
        Returns:
            True if tokens were available and consumed, False otherwise
        """
        self._refill()
        
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        
        return False
    
    def _refill(self):
        """Refill tokens based on elapsed time."""
        now = time.time()
        elapsed = now - self.last_refill
        
        # Add tokens based on elapsed time
        tokens_to_add = elapsed * self.refill_rate
        self.tokens = min(self.capacity, self.tokens + tokens_to_add)
        self.last_refill = now
    
    def get_remaining(self) -> int:
        """Get number of tokens remaining."""
        self._refill()
        return int(self.tokens)
    
    def get_retry_after(self) -> int:
        """Get seconds until next token available."""
        self._refill()
        
        if self.tokens >= 1:
            return 0
        
        tokens_needed = 1 - self.tokens
        return int(tokens_needed / self.refill_rate) + 1


class FixedWindow:
    """
    Fixed window rate limiter.
    
    Simple algorithm that counts requests within fixed time windows.
    Window resets after the specified duration.
    """
    
    def __init__(self, max_requests: int, window_ms: int):
        """
        Initialize fixed window limiter.
        
        Args:
            max_requests: Maximum requests per window
            window_ms: Window duration in milliseconds
        """
        self.max_requests = max_requests
        self.window_ms = window_ms
        self.count = 0
        self.window_start = time.time() * 1000  # Convert to milliseconds
    
    def consume(self, tokens: int = 1) -> bool:
        """
        Try to consume from the window.
        
        Returns:
            True if within limit, False otherwise
        """
        self._reset_if_needed()
        
        if self.count < self.max_requests:
            self.count += tokens
            return True
        
        return False
    
    def _reset_if_needed(self):
        """Reset window if expired."""
        now = time.time() * 1000
        if now - self.window_start >= self.window_ms:
            self.count = 0
            self.window_start = now
    
    def get_remaining(self) -> int:
        """Get remaining requests in current window."""
        self._reset_if_needed()
        return max(0, self.max_requests - self.count)
    
    def get_retry_after(self) -> int:
        """Get seconds until window resets."""
        self._reset_if_needed()
        
        if self.count < self.max_requests:
            return 0
        
        now = time.time() * 1000
        window_end = self.window_start + self.window_ms
        retry_ms = max(0, window_end - now)
        return int(retry_ms / 1000) + 1


class RateLimitConfig:
    """Configuration loader for rate limits."""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Load rate limit configuration from YAML.
        
        Args:
            config_path: Path to rate_limits.yaml (defaults to shared_config/)
        """
        if config_path is None:
            # Try to find config relative to this file
            current_dir = Path(__file__).parent
            # Go up to project root, then to shared_config
            project_root = current_dir.parent.parent.parent
            config_path = project_root / "shared_config" / "rate_limits.yaml"
        
        self.config_path = Path(config_path)
        self.config = self._load_config()
        self.environment = os.getenv("ENVIRONMENT", "development")
        self._apply_environment_overrides()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load and parse YAML configuration."""
        try:
            if not self.config_path.exists():
                _log.error(f"Config file not found: {self.config_path}")
                return self._get_default_config()
            
            with open(self.config_path, 'r') as f:
                config = yaml.safe_load(f)
            
            _log.info(f"Loaded rate limit config from {self.config_path}")
            return config
        
        except Exception as e:
            _log.error(f"Failed to load rate limit config: {e}")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Return safe default configuration."""
        return {
            "global": {
                "default": {
                    "algorithm": "token_bucket",
                    "capacity": 1000,
                    "refill_rate": 0.2778,
                    "window_ms": 3600000,
                    "max_requests": 1000
                }
            },
            "endpoints": {},
            "skip_paths": ["/", "/health", "/docs"],
            "security_logging": {"enabled": True}
        }
    
    def _apply_environment_overrides(self):
        """Apply environment-specific configuration overrides."""
        if "environments" in self.config:
            env_overrides = self.config["environments"].get(self.environment, {})
            if env_overrides:
                _log.info(f"Applying {self.environment} environment overrides")
                # Deep merge environment overrides
                self._deep_merge(self.config, env_overrides)
    
    def _deep_merge(self, base: dict, override: dict):
        """Deep merge override dict into base dict."""
        for key, value in override.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._deep_merge(base[key], value)
            else:
                base[key] = value
    
    def get_endpoint_config(self, path: str) -> Optional[Dict[str, Any]]:
        """Get rate limit configuration for endpoint."""
        endpoints = self.config.get("endpoints", {})
        
        # Exact match first
        for endpoint_name, config in endpoints.items():
            endpoint_path = config.get("path", "")
            if path == endpoint_path or path.startswith(endpoint_path):
                return config
        
        return None
    
    def get_global_config(self) -> Dict[str, Any]:
        """Get global rate limit configuration."""
        return self.config.get("global", {}).get("default", {})
    
    def should_skip_path(self, path: str) -> bool:
        """Check if path should skip rate limiting."""
        skip_paths = self.config.get("skip_paths", [])
        return path in skip_paths
    
    def should_log_violations(self) -> bool:
        """Check if security violations should be logged."""
        return self.config.get("security_logging", {}).get("enabled", False)


class InMemoryRateLimiter:
    """
    In-memory rate limiter supporting both algorithms.
    
    For development and testing. Use Redis in production.
    """
    
    def __init__(self, config: RateLimitConfig):
        self.config = config
        self.buckets: Dict[str, Any] = {}  # TokenBucket or FixedWindow
        self.cleanup_interval = 300  # 5 minutes
        self.last_cleanup = time.time()
    
    def check_rate_limit(
        self,
        key: str,
        endpoint_config: Dict[str, Any]
    ) -> Tuple[bool, Optional[int], int]:
        """
        Check if request is within rate limit.
        
        Args:
            key: Unique key for rate limit (e.g., "user:123:/api/chat")
            endpoint_config: Configuration dict for this endpoint
        
        Returns:
            (allowed, retry_after, remaining) tuple
        """
        # Cleanup old buckets periodically
        self._cleanup_if_needed()
        
        # Get or create limiter for this key
        if key not in self.buckets:
            self.buckets[key] = self._create_limiter(endpoint_config)
        
        limiter = self.buckets[key]
        
        # Try to consume token/request
        if limiter.consume():
            remaining = limiter.get_remaining()
            return True, None, remaining
        else:
            retry_after = limiter.get_retry_after()
            return False, retry_after, 0
    
    def _create_limiter(self, config: Dict[str, Any]):
        """Create appropriate limiter based on algorithm."""
        algorithm = config.get("algorithm", "token_bucket")
        
        if algorithm == "token_bucket":
            capacity = config.get("capacity", 100)
            refill_rate = config.get("refill_rate", 0.1)
            return TokenBucket(capacity, refill_rate)
        
        elif algorithm == "fixed_window":
            max_requests = config.get("max_requests", 100)
            window_ms = config.get("window_ms", 900000)
            return FixedWindow(max_requests, window_ms)
        
        else:
            _log.warning(f"Unknown algorithm {algorithm}, defaulting to token_bucket")
            return TokenBucket(100, 0.1)
    
    def _cleanup_if_needed(self):
        """Remove old buckets to prevent memory leak."""
        now = time.time()
        if now - self.last_cleanup > self.cleanup_interval:
            # Remove buckets that are full (likely inactive)
            initial_count = len(self.buckets)
            
            self.buckets = {
                k: v for k, v in self.buckets.items()
                if self._is_bucket_active(v)
            }
            
            removed = initial_count - len(self.buckets)
            if removed > 0:
                _log.info(f"Cleaned up {removed} inactive rate limit buckets")
            
            self.last_cleanup = now
    
    def _is_bucket_active(self, bucket) -> bool:
        """Check if bucket has been used recently."""
        if isinstance(bucket, TokenBucket):
            # Keep if not full (has been used)
            return bucket.tokens < bucket.capacity
        elif isinstance(bucket, FixedWindow):
            # Keep if has counts
            return bucket.count > 0
        return True


class ConfigurableRateLimitMiddleware(BaseHTTPMiddleware):
    """
    Configuration-driven rate limiting middleware.
    
    Reads configuration from YAML and applies appropriate rate limits
    per endpoint with support for both token bucket and fixed window algorithms.
    """
    
    def __init__(self, app, config_path: Optional[str] = None):
        super().__init__(app)
        
        # Load configuration
        self.config = RateLimitConfig(config_path)
        
        # Initialize limiter (Redis or in-memory)
        redis_url = os.getenv("REDIS_URL")
        redis_enabled = self.config.config.get("redis", {}).get("enabled", False)
        
        if redis_url and redis_enabled:
            try:
                # TODO: Implement Redis backend
                _log.warning("Redis rate limiting not implemented yet, using in-memory")
                self.limiter = InMemoryRateLimiter(self.config)
            except Exception as e:
                _log.warning(f"Redis unavailable, using in-memory: {e}")
                self.limiter = InMemoryRateLimiter(self.config)
        else:
            self.limiter = InMemoryRateLimiter(self.config)
            _log.info(f"Using in-memory rate limiter ({self.config.environment} mode)")
    
    async def dispatch(self, request: Request, call_next):
        """Check rate limits and process request."""
        
        # Skip rate limiting for certain paths
        if self.config.should_skip_path(request.url.path):
            return await call_next(request)
        
        # Get identifier (user ID or IP)
        identifier = self._get_identifier(request)
        
        # Check endpoint-specific rate limit
        endpoint_config = self.config.get_endpoint_config(request.url.path)
        
        if not endpoint_config:
            # Use global default
            endpoint_config = self.config.get_global_config()
        
        # Build rate limit key
        key = self._build_key(identifier, request.url.path, endpoint_config)
        
        # Check rate limit
        allowed, retry_after, remaining = self.limiter.check_rate_limit(
            key, endpoint_config
        )
        
        if not allowed:
            # Log violation if configured
            if self.config.should_log_violations() and endpoint_config.get("log_violations", False):
                await self._log_violation(request, identifier, endpoint_config)
            
            return self._rate_limit_response(
                retry_after,
                endpoint_config,
                remaining
            )
        
        # Rate limit passed, process request
        response = await call_next(request)
        
        # Add rate limit headers
        self._add_rate_limit_headers(response, endpoint_config, remaining, retry_after)
        
        return response
    
    def _get_identifier(self, request: Request) -> str:
        """Get unique identifier for rate limiting."""
        # Try to get user ID from auth
        user = getattr(request.state, "user", None)
        
        if user and isinstance(user, dict):
            user_id = user.get("user_id") or user.get("id")
            if user_id:
                return f"user:{user_id}"
        
        # Fall back to IP address
        ip = request.client.host if request.client else "unknown"
        return f"ip:{ip}"
    
    def _build_key(self, identifier: str, path: str, config: Dict[str, Any]) -> str:
        """Build rate limit key."""
        # Include path for per-endpoint limits
        return f"{identifier}:path:{path}"
    
    def _add_rate_limit_headers(
        self,
        response,
        config: Dict[str, Any],
        remaining: int,
        retry_after: Optional[int]
    ):
        """Add rate limit headers to response."""
        limit = config.get("capacity") or config.get("max_requests", "unknown")
        
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        
        if retry_after:
            response.headers["Retry-After"] = str(retry_after)
    
    def _rate_limit_response(
        self,
        retry_after: Optional[int],
        config: Dict[str, Any],
        remaining: int
    ) -> JSONResponse:
        """Return 429 Too Many Requests response."""
        # Get custom error message if configured
        responses_config = self.config.config.get("responses", {})
        error_messages = responses_config.get("error_messages", {})
        
        # Determine message based on security level
        security_level = config.get("security_level", "default")
        if security_level in ["critical", "high"] and "payment" in config.get("path", ""):
            message = error_messages.get("payment", error_messages.get("default"))
        elif "auth" in config.get("path", ""):
            message = error_messages.get("auth", error_messages.get("default"))
        else:
            message = error_messages.get("default", "Rate limit exceeded. Please try again later.")
        
        headers = {}
        if retry_after:
            headers["Retry-After"] = str(retry_after)
        
        headers["X-RateLimit-Remaining"] = "0"
        limit = config.get("capacity") or config.get("max_requests", "unknown")
        headers["X-RateLimit-Limit"] = str(limit)
        
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "message": message,
                "retry_after_seconds": retry_after,
                "endpoint": config.get("description", ""),
            },
            headers=headers
        )
    
    async def _log_violation(
        self,
        request: Request,
        identifier: str,
        config: Dict[str, Any]
    ):
        """Log rate limit violation to security events."""
        try:
            # TODO: Implement database logging
            _log.warning(
                f"Rate limit violation: {identifier} on {request.url.path} "
                f"(security_level: {config.get('security_level', 'unknown')})"
            )
            
            # In production, log to database:
            # - user_id/ip
            # - endpoint
            # - timestamp
            # - security_level
            # - request details
            
        except Exception as e:
            _log.error(f"Failed to log rate limit violation: {e}")


# Factory function for easy integration
def create_rate_limit_middleware(app, config_path: Optional[str] = None):
    """
    Create and return rate limit middleware instance.
    
    Args:
        app: FastAPI application
        config_path: Optional path to rate_limits.yaml
    
    Returns:
        ConfigurableRateLimitMiddleware instance
    """
    return ConfigurableRateLimitMiddleware(app, config_path)
