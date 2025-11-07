"""
Rate limiting for FastAPI endpoints.
"""

import time
from typing import Dict, Tuple
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

# Rate limit configuration
RATE_LIMIT_WINDOW_SECONDS = 60  # 1 minute
RATE_LIMIT_MAX_REQUESTS = 30  # 30 requests per minute per identifier

# In-memory store (for single-instance deployment)
# For production with multiple instances, use Redis
_rate_limit_store: Dict[str, Dict[str, any]] = defaultdict(dict)


def rate_limit(identifier: str) -> Tuple[bool, int, int]:
    """
    Check rate limit for an identifier.
    
    Args:
        identifier: Unique identifier (e.g., IP address, user ID)
    
    Returns:
        Tuple of (allowed, remaining, reset_at)
    """
    now = time.time()
    key = identifier
    
    # Get or create rate limit entry
    entry = _rate_limit_store.get(key)
    
    if not entry or entry.get("reset_time", 0) < now:
        # Create new entry or reset expired entry
        entry = {
            "count": 0,
            "reset_time": now + RATE_LIMIT_WINDOW_SECONDS
        }
        _rate_limit_store[key] = entry
    
    # Increment count
    entry["count"] += 1
    
    # Check if limit exceeded
    allowed = entry["count"] <= RATE_LIMIT_MAX_REQUESTS
    remaining = max(0, RATE_LIMIT_MAX_REQUESTS - entry["count"])
    reset_at = int(entry["reset_time"])
    
    # Clean up old entries (simple cleanup - remove entries older than 5 minutes)
    if len(_rate_limit_store) > 1000:
        cutoff = now - 300  # 5 minutes
        keys_to_remove = [
            k for k, v in _rate_limit_store.items()
            if v.get("reset_time", 0) < cutoff
        ]
        for k in keys_to_remove:
            del _rate_limit_store[k]
    
    return allowed, remaining, reset_at


def get_client_identifier(request) -> str:
    """
    Get client identifier from FastAPI request.
    
    Args:
        request: FastAPI Request object
    
    Returns:
        Client identifier (IP address or user ID)
    """
    # Try to get IP from various headers
    forwarded = request.headers.get("x-forwarded-for")
    real_ip = request.headers.get("x-real-ip")
    cf_connecting_ip = request.headers.get("cf-connecting-ip")
    
    # Use first IP from forwarded header, or fallback to other headers
    ip = None
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    elif real_ip:
        ip = real_ip
    elif cf_connecting_ip:
        ip = cf_connecting_ip
    else:
        # Fallback to client host
        ip = request.client.host if request.client else "unknown"
    
    return f"rate_limit:{ip}"

