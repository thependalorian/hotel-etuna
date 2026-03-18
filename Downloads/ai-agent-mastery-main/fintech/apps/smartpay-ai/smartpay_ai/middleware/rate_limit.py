"""
Rate limiting middleware for Smartpay AI Copilot.

Location: backend_python/smartpay_ai/middleware/rate_limit.py
Purpose: Configuration-driven rate limiting using shared YAML config.

MIGRATION NOTICE:
This module now imports from shared/rate_limiter.py to use the unified
configuration-driven implementation. All rate limits are defined in
shared_config/rate_limits.yaml for consistency across backends.
"""

import logging
from typing import Optional

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# Import from unified shared implementation
from smartpay_ai.shared.rate_limiter import (
    ConfigurableRateLimitMiddleware,
    create_rate_limit_middleware
)

_log = logging.getLogger(__name__)


class RateLimitMiddleware(ConfigurableRateLimitMiddleware):
    """
    Rate limiting middleware using unified configuration.
    
    This is a compatibility wrapper that extends the shared implementation.
    All configuration is now centralized in shared_config/rate_limits.yaml.
    
    Features:
    - Token bucket and fixed window algorithms
    - Per-user and per-IP rate limiting
    - Environment-specific overrides
    - Security event logging
    - Redis support (production)
    """
    
    def __init__(self, app, config_path: Optional[str] = None, **kwargs):
        """
        Initialize rate limiting middleware.
        
        Args:
            app: FastAPI application instance
            config_path: Optional path to rate_limits.yaml
            **kwargs: Additional arguments (for backward compatibility)
        """
        super().__init__(app, config_path)
        
        # Log migration status
        _log.info(
            "RateLimitMiddleware initialized with unified config from "
            f"{self.config.config_path}"
        )


# Factory function to create middleware
def rate_limit_middleware(app, **kwargs):
    """
    Create and return rate limit middleware instance.
    
    This function now uses the unified configuration-driven implementation
    from shared/rate_limiter.py. All rate limits are defined in
    shared_config/rate_limits.yaml.
    
    Args:
        app: FastAPI application
        **kwargs: Optional configuration (config_path, etc.)
    
    Returns:
        RateLimitMiddleware instance
    """
    return RateLimitMiddleware(app, **kwargs)
