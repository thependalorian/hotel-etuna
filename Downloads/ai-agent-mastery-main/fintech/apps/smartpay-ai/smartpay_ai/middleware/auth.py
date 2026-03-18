"""
Authentication middleware for Smartpay AI Copilot.

Location: backend_python/smartpay_ai/middleware/auth.py
Purpose: JWT token validation, user ID extraction, admin role checking.
         Uses shared JWT validator (DRY principle - no duplication with TypeScript).
         Enhanced with audit logging for PSD-12 compliance.

Migration: Now uses smartpay_ai.shared.jwt_validator instead of delegating to Node API.
"""

import os
import logging
from typing import Optional, Dict, Any

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from smartpay_ai.user_profile import fetch_user_profile
from smartpay_ai.config.logging import get_audit_logger
from smartpay_ai.shared import verify_access_token, extract_bearer_token

_log = logging.getLogger(__name__)
_audit_logger = get_audit_logger()

# Feature flag for gradual migration
USE_SHARED_JWT_VALIDATOR = os.getenv('USE_SHARED_JWT_VALIDATOR', 'true').lower() == 'true'


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Authentication middleware for JWT validation and user context.
    
    - Extracts Authorization header
    - Validates JWT token (via Node API)
    - Attaches user info to request.state
    - Allows unauthenticated access to public endpoints
    """
    
    # Public endpoints that don't require authentication
    PUBLIC_PATHS = {
        "/",
        "/health",
        "/api/health/detailed",
        "/docs",
        "/openapi.json",
        "/redoc",
    }
    
    def __init__(self, app, exclude_patterns: Optional[list] = None):
        super().__init__(app)
        self.exclude_patterns = exclude_patterns or []
    
    async def dispatch(self, request: Request, call_next):
        """Process request and validate authentication."""
        
        # Get client info for audit logging
        ip_address = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Skip authentication for public paths
        if request.url.path in self.PUBLIC_PATHS:
            return await call_next(request)
        
        # Skip for paths matching exclude patterns
        for pattern in self.exclude_patterns:
            if request.url.path.startswith(pattern):
                return await call_next(request)
        
        # Extract Authorization header
        auth_header = request.headers.get("Authorization", "")
        
        if not auth_header:
            # Allow endpoints to handle missing auth themselves
            # (copilot_endpoint has fallback for test users)
            request.state.user = None
            return await call_next(request)
        
        # Validate token and get user profile
        try:
            user_profile = await self._validate_token(auth_header)
            
            if user_profile:
                # Attach user info to request state
                user_id = str(user_profile.get("id"))
                request.state.user = {
                    "user_id": user_id,
                    "email": user_profile.get("email"),
                    "role": user_profile.get("role", "user"),
                    "is_admin": user_profile.get("role") == "admin",
                    "profile": user_profile
                }
                _log.debug("Authenticated user: %s", user_id)
                
                # Log successful authentication
                await _audit_logger.log_authentication(
                    success=True,
                    user_id=user_id,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
            else:
                # Token invalid or user not found
                request.state.user = None
                _log.warning("Invalid authentication token")
                
                # Log failed authentication
                await _audit_logger.log_authentication(
                    success=False,
                    user_id=None,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    error_message="Invalid or expired token"
                )
        
        except Exception as e:
            _log.error("Authentication error: %s", e)
            request.state.user = None
            
            # Log authentication error
            await _audit_logger.log_authentication(
                success=False,
                user_id=None,
                ip_address=ip_address,
                user_agent=user_agent,
                error_message=str(e)
            )
        
        return await call_next(request)
    
    async def _validate_token(self, auth_header: str) -> Optional[Dict[str, Any]]:
        """
        Validate JWT token using shared JWT validator or Node API fallback.
        
        Primary method (if USE_SHARED_JWT_VALIDATOR=true):
        - Uses smartpay_ai.shared.jwt_validator
        - Direct JWT validation without API call
        - Faster and eliminates dependency on Node API
        
        Fallback method:
        - Fetches user profile from Node API
        - Used for gradual migration or if shared validator unavailable
        
        Returns user profile dict or None if invalid.
        """
        # Extract token from Bearer header
        token = extract_bearer_token(auth_header)
        if not token:
            _log.debug("Invalid authorization header format")
            return None
        
        # Try shared JWT validator first (if enabled)
        if USE_SHARED_JWT_VALIDATOR:
            try:
                result = await verify_access_token(token)
                
                if result['valid'] and result.get('payload'):
                    user_id = result['payload']['userId']
                    
                    # Fetch full user profile from database or cache
                    profile = await self._fetch_user_profile_by_id(user_id)
                    
                    if profile:
                        _log.debug("Token validated using shared JWT validator")
                        return profile
                    else:
                        _log.warning("Valid token but user not found: %s", user_id)
                        return None
                else:
                    _log.debug("Token validation failed: %s", result.get('error'))
                    return None
            
            except Exception as e:
                _log.warning("Shared JWT validator error, falling back to Node API: %s", e)
                # Continue to fallback
        
        # Fallback: Use Node API for token validation
        try:
            profile = await fetch_user_profile(auth_header)
            if profile:
                _log.debug("Token validated using Node API (fallback)")
            return profile
        except Exception as e:
            _log.debug("Node API token validation failed: %s", e)
            return None
    
    async def _fetch_user_profile_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch user profile by ID from database.
        
        This is a lightweight alternative to fetch_user_profile that doesn't
        require calling the Node API.
        
        Args:
            user_id: User identifier from JWT payload
        
        Returns:
            User profile dict or None if not found
        """
        try:
            # Import here to avoid circular dependencies
            from smartpay_ai.db_utils import get_db_pool
            
            pool = get_db_pool()
            if not pool:
                _log.warning("Database pool not available, falling back to Node API")
                return None
            
            async with pool.acquire() as conn:
                row = await conn.fetchrow(
                    """
                    SELECT id, phone, email, first_name, last_name, 
                           full_name, wallet_status, created_at
                    FROM users
                    WHERE id = $1
                    LIMIT 1
                    """,
                    user_id
                )
                
                if row:
                    return dict(row)
                else:
                    return None
        
        except Exception as e:
            _log.error("Failed to fetch user profile from database: %s", e)
            return None


# Factory function to create middleware
def auth_middleware(app, **kwargs):
    """Create and return auth middleware instance."""
    return AuthMiddleware(app, **kwargs)


# Helper function for manual token validation (for use in endpoints)
async def validate_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Validate JWT token and return user info.
    
    Uses shared JWT validator for direct validation without API calls.
    Falls back to Node API if shared validator unavailable.
    
    Args:
        token: JWT token (with or without "Bearer " prefix)
    
    Returns:
        User info dict or None if invalid
    """
    # Remove "Bearer " prefix if present
    clean_token = extract_bearer_token(f"Bearer {token}") if not token.startswith("Bearer ") else extract_bearer_token(token)
    
    if not clean_token:
        return None
    
    # Try shared JWT validator first (if enabled)
    if USE_SHARED_JWT_VALIDATOR:
        try:
            result = await verify_access_token(clean_token)
            
            if result['valid'] and result.get('payload'):
                user_id = result['payload']['userId']
                
                # Fetch user profile
                from smartpay_ai.db_utils import get_db_pool
                pool = get_db_pool()
                
                if pool:
                    async with pool.acquire() as conn:
                        row = await conn.fetchrow(
                            """
                            SELECT id, phone, email, first_name, last_name, 
                                   full_name, wallet_status, created_at
                            FROM users
                            WHERE id = $1
                            LIMIT 1
                            """,
                            user_id
                        )
                        
                        if row:
                            profile = dict(row)
                            return {
                                "user_id": str(profile.get("id")),
                                "email": profile.get("email"),
                                "role": profile.get("role", "user"),
                                "is_admin": profile.get("role") == "admin",
                                "profile": profile
                            }
        
        except Exception as e:
            _log.warning("Shared JWT validator error in validate_jwt_token: %s", e)
            # Continue to fallback
    
    # Fallback: Use Node API
    try:
        profile = await fetch_user_profile(f"Bearer {clean_token}")
        if not profile:
            return None
        
        return {
            "user_id": str(profile.get("id")),
            "email": profile.get("email"),
            "role": profile.get("role", "user"),
            "is_admin": profile.get("role") == "admin",
            "profile": profile
        }
    except Exception as e:
        _log.debug("Token validation failed: %s", e)
        return None


# Helper function to extract user ID from request
def get_user_id_from_request(request: Request) -> Optional[str]:
    """
    Extract user ID from request state.
    
    Returns None if user is not authenticated.
    """
    user = getattr(request.state, "user", None)
    if user:
        return user.get("user_id")
    return None


# Helper function to check if user is admin
def is_admin_user(request: Request) -> bool:
    """
    Check if current user has admin role.
    
    Returns False if user is not authenticated or not admin.
    """
    user = getattr(request.state, "user", None)
    if user:
        return user.get("is_admin", False)
    return False
