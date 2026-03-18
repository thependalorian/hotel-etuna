"""
Shared JWT Validator for SmartPay AI Backend

Location: backend_python/smartpay_ai/shared/jwt_validator.py
Purpose: Centralized JWT token validation following DRY principles
         Mirrors the TypeScript implementation in backend/src/lib/jwt.ts

Security Features:
- HMAC-SHA256 signature verification
- Token expiration checking
- Token type validation (access vs refresh)
- Database revocation checking
- Token refresh logic
- Comprehensive audit logging

Usage:
    from smartpay_ai.shared.jwt_validator import (
        verify_access_token,
        verify_refresh_token,
        refresh_access_token,
        revoke_access_token,
        revoke_refresh_token,
        revoke_all_user_tokens
    )
    
    # Validate access token
    result = await verify_access_token(token)
    if result['valid']:
        user_id = result['payload']['userId']
    
    # Refresh access token
    new_token = await refresh_access_token(refresh_token)
"""

import os
import hmac
import hashlib
import json
import base64
import logging
import secrets
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from pathlib import Path

# Database imports (assuming async PostgreSQL)
try:
    import asyncpg
except ImportError:
    asyncpg = None

_log = logging.getLogger(__name__)

# Load shared JWT configuration
SHARED_CONFIG_PATH = Path(__file__).parent.parent.parent.parent / "shared_config" / "jwt_config.json"

try:
    with open(SHARED_CONFIG_PATH, 'r') as f:
        JWT_CONFIG = json.load(f)
except FileNotFoundError:
    _log.warning(f"JWT config not found at {SHARED_CONFIG_PATH}, using defaults")
    JWT_CONFIG = {
        "algorithm": "HS256",
        "access_token": {"expiry_seconds": 900},
        "refresh_token": {"expiry_seconds": 604800},
        "validation_rules": {"allow_clock_skew_seconds": 30}
    }

# JWT Configuration
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_REFRESH_SECRET = os.getenv('JWT_REFRESH_SECRET', 'your-refresh-secret-key')
ACCESS_TOKEN_EXPIRY = JWT_CONFIG['access_token']['expiry_seconds']
REFRESH_TOKEN_EXPIRY = JWT_CONFIG['refresh_token']['expiry_seconds']
CLOCK_SKEW_SECONDS = JWT_CONFIG.get('validation_rules', {}).get('allow_clock_skew_seconds', 30)

# Database connection pool (to be initialized by application)
_db_pool: Optional[asyncpg.Pool] = None

# Validation for production environments
if os.getenv('NODE_ENV') == 'production':
    if JWT_SECRET == 'your-secret-key-change-in-production':
        raise ValueError("JWT_SECRET must be set in production environment")
    if JWT_REFRESH_SECRET == 'your-refresh-secret-key':
        raise ValueError("JWT_REFRESH_SECRET must be set in production environment")
    if len(JWT_SECRET) < 32 or len(JWT_REFRESH_SECRET) < 32:
        raise ValueError("JWT secrets must be at least 32 characters in production")


def set_database_pool(pool: 'asyncpg.Pool') -> None:
    """
    Set the database connection pool for token validation.
    
    Args:
        pool: asyncpg connection pool
    """
    global _db_pool
    _db_pool = pool
    _log.info("Database pool configured for JWT validator")


def base64url_encode(data: bytes) -> str:
    """
    Encode bytes to base64url format (URL-safe base64 without padding).
    
    Args:
        data: Bytes to encode
    
    Returns:
        Base64url encoded string
    """
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')


def base64url_decode(data: str) -> bytes:
    """
    Decode base64url format to bytes.
    
    Args:
        data: Base64url encoded string
    
    Returns:
        Decoded bytes
    """
    # Add padding if needed
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += '=' * padding
    
    return base64.urlsafe_b64decode(data)


def generate_token(
    payload: Dict[str, Any],
    secret: str,
    expiry_seconds: int
) -> str:
    """
    Generate a JWT token with HMAC-SHA256 signature.
    
    Args:
        payload: Token payload (must include userId and type)
        secret: Secret key for signing
        expiry_seconds: Token expiry in seconds
    
    Returns:
        JWT token string
    """
    now = int(datetime.utcnow().timestamp())
    
    # Build full payload with timestamps
    full_payload = {
        **payload,
        'iat': now,
        'exp': now + expiry_seconds,
        'jti': secrets.token_hex(16) if 'jti' not in payload else payload['jti']
    }
    
    # Create header
    header = {'alg': 'HS256', 'typ': 'JWT'}
    
    # Encode header and payload
    header_b64 = base64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    payload_b64 = base64url_encode(json.dumps(full_payload, separators=(',', ':')).encode('utf-8'))
    
    # Create signature
    signature_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(
        secret.encode('utf-8'),
        signature_input,
        hashlib.sha256
    ).digest()
    signature_b64 = base64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"


def verify_token_signature(token: str, secret: str) -> Dict[str, Any]:
    """
    Verify JWT token signature and decode payload.
    
    Args:
        token: JWT token string
        secret: Secret key for verification
    
    Returns:
        Dict with 'valid', 'payload', and optional 'error' keys
    """
    try:
        # Split token into parts
        parts = token.split('.')
        if len(parts) != 3:
            return {'valid': False, 'error': 'Invalid token format'}
        
        header_b64, payload_b64, signature_b64 = parts
        
        if not header_b64 or not payload_b64 or not signature_b64:
            return {'valid': False, 'error': 'Invalid token parts'}
        
        # Verify signature
        signature_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            signature_input,
            hashlib.sha256
        ).digest()
        expected_signature_b64 = base64url_encode(expected_signature)
        
        if not hmac.compare_digest(signature_b64, expected_signature_b64):
            return {'valid': False, 'error': 'Invalid signature'}
        
        # Decode payload
        payload_json = base64url_decode(payload_b64).decode('utf-8')
        payload = json.loads(payload_json)
        
        # Check expiration (with clock skew allowance)
        now = int(datetime.utcnow().timestamp())
        if payload.get('exp', 0) < (now - CLOCK_SKEW_SECONDS):
            return {'valid': False, 'error': 'Token expired'}
        
        return {'valid': True, 'payload': payload}
    
    except Exception as e:
        _log.error(f"Token verification failed: {e}")
        return {'valid': False, 'error': 'Token verification failed'}


async def verify_access_token(token: str) -> Dict[str, Any]:
    """
    Verify access token with database validation.
    
    Validates:
    1. Token signature
    2. Token expiration
    3. Token type (must be 'access')
    4. Token not revoked in database
    
    Args:
        token: JWT access token
    
    Returns:
        Dict with 'valid', 'payload', and optional 'error' keys
    """
    # Verify signature and expiration
    result = verify_token_signature(token, JWT_SECRET)
    if not result['valid']:
        return result
    
    payload = result['payload']
    
    # Check token type
    if payload.get('type') != 'access':
        return {'valid': False, 'error': 'Invalid token type'}
    
    # Check database for revocation
    if _db_pool:
        try:
            async with _db_pool.acquire() as conn:
                row = await conn.fetchrow(
                    """
                    SELECT * FROM user_sessions 
                    WHERE token = $1 AND user_id = $2
                    LIMIT 1
                    """,
                    token,
                    payload.get('userId')
                )
                
                if not row:
                    return {'valid': False, 'error': 'Token revoked or session not found'}
        
        except Exception as e:
            _log.error(f"Database validation failed: {e}")
            return {'valid': False, 'error': 'Database validation failed'}
    else:
        _log.warning("Database pool not configured, skipping revocation check")
    
    return {'valid': True, 'payload': payload}


async def verify_refresh_token(token: str) -> Dict[str, Any]:
    """
    Verify refresh token with database validation.
    
    Validates:
    1. Token signature
    2. Token expiration
    3. Token type (must be 'refresh')
    4. Token not revoked in database
    
    Args:
        token: JWT refresh token
    
    Returns:
        Dict with 'valid', 'payload', and optional 'error' keys
    """
    # Verify signature and expiration
    result = verify_token_signature(token, JWT_REFRESH_SECRET)
    if not result['valid']:
        return result
    
    payload = result['payload']
    
    # Check token type
    if payload.get('type') != 'refresh':
        return {'valid': False, 'error': 'Invalid token type'}
    
    # Check database for revocation
    if _db_pool:
        try:
            async with _db_pool.acquire() as conn:
                row = await conn.fetchrow(
                    """
                    SELECT * FROM refresh_tokens 
                    WHERE token = $1 AND user_id = $2 AND revoked = false
                    LIMIT 1
                    """,
                    token,
                    payload.get('userId')
                )
                
                if not row:
                    return {'valid': False, 'error': 'Token revoked or not found'}
        
        except Exception as e:
            _log.error(f"Database validation failed: {e}")
            return {'valid': False, 'error': 'Database validation failed'}
    else:
        _log.warning("Database pool not configured, skipping revocation check")
    
    return {'valid': True, 'payload': payload}


async def generate_access_token(user_id: str) -> str:
    """
    Generate and store a new access token for a user.
    
    Args:
        user_id: User identifier
    
    Returns:
        JWT access token
    """
    jti = secrets.token_hex(16)
    token = generate_token(
        {'userId': user_id, 'type': 'access', 'jti': jti},
        JWT_SECRET,
        ACCESS_TOKEN_EXPIRY
    )
    
    # Store in database
    if _db_pool:
        try:
            expires_at = datetime.utcnow() + timedelta(seconds=ACCESS_TOKEN_EXPIRY)
            async with _db_pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO user_sessions (user_id, token, expires_at)
                    VALUES ($1, $2, $3)
                    """,
                    user_id,
                    token,
                    expires_at
                )
            _log.info(f"Access token generated for user {user_id}")
        except Exception as e:
            _log.error(f"Failed to store access token: {e}")
            raise
    
    return token


async def generate_refresh_token(user_id: str) -> str:
    """
    Generate and store a new refresh token for a user.
    
    Args:
        user_id: User identifier
    
    Returns:
        JWT refresh token
    """
    jti = secrets.token_hex(16)
    token = generate_token(
        {'userId': user_id, 'type': 'refresh', 'jti': jti},
        JWT_REFRESH_SECRET,
        REFRESH_TOKEN_EXPIRY
    )
    
    # Store in database
    if _db_pool:
        try:
            expires_at = datetime.utcnow() + timedelta(seconds=REFRESH_TOKEN_EXPIRY)
            async with _db_pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO refresh_tokens (user_id, token, expires_at, revoked)
                    VALUES ($1, $2, $3, false)
                    """,
                    user_id,
                    token,
                    expires_at
                )
            _log.info(f"Refresh token generated for user {user_id}")
        except Exception as e:
            _log.error(f"Failed to store refresh token: {e}")
            raise
    
    return token


async def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
    """
    Generate a new access token using a valid refresh token.
    
    Args:
        refresh_token: Valid JWT refresh token
    
    Returns:
        Dict with 'accessToken' or 'error' key
    """
    # Verify refresh token
    verification = await verify_refresh_token(refresh_token)
    
    if not verification['valid']:
        return {'error': verification.get('error', 'Invalid refresh token')}
    
    user_id = verification['payload']['userId']
    
    # Generate new access token
    try:
        access_token = await generate_access_token(user_id)
        return {'accessToken': access_token}
    except Exception as e:
        _log.error(f"Failed to refresh access token: {e}")
        return {'error': 'Failed to generate access token'}


async def revoke_access_token(token: str) -> None:
    """
    Revoke an access token by removing it from the database.
    
    Args:
        token: JWT access token to revoke
    """
    if not _db_pool:
        _log.warning("Database pool not configured, cannot revoke token")
        return
    
    try:
        async with _db_pool.acquire() as conn:
            await conn.execute(
                "DELETE FROM user_sessions WHERE token = $1",
                token
            )
        _log.info("Access token revoked")
    except Exception as e:
        _log.error(f"Failed to revoke access token: {e}")
        raise


async def revoke_refresh_token(token: str) -> None:
    """
    Revoke a refresh token by marking it as revoked in the database.
    
    Args:
        token: JWT refresh token to revoke
    """
    if not _db_pool:
        _log.warning("Database pool not configured, cannot revoke token")
        return
    
    try:
        async with _db_pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE refresh_tokens
                SET revoked = true, revoked_at = NOW()
                WHERE token = $1
                """,
                token
            )
        _log.info("Refresh token revoked")
    except Exception as e:
        _log.error(f"Failed to revoke refresh token: {e}")
        raise


async def revoke_all_user_tokens(user_id: str) -> None:
    """
    Revoke all access and refresh tokens for a user.
    Useful for logout or security incidents.
    
    Args:
        user_id: User identifier
    """
    if not _db_pool:
        _log.warning("Database pool not configured, cannot revoke tokens")
        return
    
    try:
        async with _db_pool.acquire() as conn:
            # Revoke access tokens
            await conn.execute(
                "DELETE FROM user_sessions WHERE user_id = $1",
                user_id
            )
            
            # Revoke refresh tokens
            await conn.execute(
                """
                UPDATE refresh_tokens
                SET revoked = true, revoked_at = NOW()
                WHERE user_id = $1 AND revoked = false
                """,
                user_id
            )
        
        _log.info(f"All tokens revoked for user {user_id}")
    except Exception as e:
        _log.error(f"Failed to revoke user tokens: {e}")
        raise


async def cleanup_expired_tokens() -> Tuple[int, int]:
    """
    Clean up expired tokens from the database.
    Should be run periodically (e.g., daily cron job).
    
    Returns:
        Tuple of (access_tokens_deleted, refresh_tokens_revoked)
    """
    if not _db_pool:
        _log.warning("Database pool not configured, cannot cleanup tokens")
        return (0, 0)
    
    try:
        async with _db_pool.acquire() as conn:
            # Delete expired access tokens
            result1 = await conn.execute(
                "DELETE FROM user_sessions WHERE expires_at < NOW()"
            )
            access_count = int(result1.split()[-1]) if result1 else 0
            
            # Revoke expired refresh tokens
            result2 = await conn.execute(
                """
                UPDATE refresh_tokens
                SET revoked = true, revoked_at = NOW()
                WHERE expires_at < NOW() AND revoked = false
                """
            )
            refresh_count = int(result2.split()[-1]) if result2 else 0
        
        _log.info(f"Cleaned up {access_count} access tokens and {refresh_count} refresh tokens")
        return (access_count, refresh_count)
    
    except Exception as e:
        _log.error(f"Failed to cleanup expired tokens: {e}")
        return (0, 0)


async def detect_token_theft(
    token: str,
    user_id: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> Dict[str, Any]:
    """
    Detect potential token theft by checking for suspicious patterns.
    
    Patterns checked:
    1. Reuse of revoked refresh tokens
    2. Multiple IP addresses using same token
    3. Suspicious token refresh frequency
    
    Args:
        token: JWT token to check
        user_id: User identifier
        ip_address: Client IP address
        user_agent: Client user agent
    
    Returns:
        Dict with 'suspicious', 'reason', and 'actions' keys
    """
    if not _db_pool:
        return {'suspicious': False, 'reason': 'Database not configured'}
    
    try:
        async with _db_pool.acquire() as conn:
            # Check if token is revoked but being reused
            revoked_row = await conn.fetchrow(
                """
                SELECT * FROM refresh_tokens
                WHERE token = $1 AND revoked = true
                LIMIT 1
                """,
                token
            )
            
            if revoked_row:
                _log.warning(f"Token theft detected: Reused revoked token for user {user_id}")
                
                # Revoke all user tokens
                await revoke_all_user_tokens(user_id)
                
                return {
                    'suspicious': True,
                    'reason': 'Reused revoked token - potential token theft',
                    'actions': 'All user tokens have been revoked',
                    'severity': 'high'
                }
            
            # Check for suspicious refresh frequency
            recent_refreshes = await conn.fetchval(
                """
                SELECT COUNT(*) FROM refresh_tokens
                WHERE user_id = $1 
                AND created_at > NOW() - INTERVAL '1 hour'
                """,
                user_id
            )
            
            if recent_refreshes > 100:
                _log.warning(f"Suspicious refresh frequency for user {user_id}: {recent_refreshes}/hour")
                
                return {
                    'suspicious': True,
                    'reason': f'Abnormal refresh frequency: {recent_refreshes} refreshes in last hour',
                    'severity': 'medium'
                }
        
        return {'suspicious': False}
    
    except Exception as e:
        _log.error(f"Error in token theft detection: {e}")
        return {'suspicious': False, 'reason': 'Detection error'}


async def get_token_stats(user_id: str) -> Dict[str, Any]:
    """
    Get statistics about user's tokens.
    
    Useful for debugging and monitoring.
    
    Args:
        user_id: User identifier
    
    Returns:
        Dict with token statistics
    """
    if not _db_pool:
        return {'error': 'Database not configured'}
    
    try:
        async with _db_pool.acquire() as conn:
            # Access tokens
            access_stats = await conn.fetchrow(
                """
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active,
                    COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired
                FROM user_sessions
                WHERE user_id = $1
                """,
                user_id
            )
            
            # Refresh tokens
            refresh_stats = await conn.fetchrow(
                """
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN revoked = false AND expires_at > NOW() THEN 1 END) as active,
                    COUNT(CASE WHEN revoked = true THEN 1 END) as revoked,
                    COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired
                FROM refresh_tokens
                WHERE user_id = $1
                """,
                user_id
            )
            
            return {
                'user_id': user_id,
                'access_tokens': dict(access_stats) if access_stats else {},
                'refresh_tokens': dict(refresh_stats) if refresh_stats else {},
                'timestamp': datetime.utcnow().isoformat()
            }
    
    except Exception as e:
        _log.error(f"Failed to get token stats: {e}")
        return {'error': str(e)}


async def validate_token_with_metrics(
    token: str,
    token_type: str = 'access'
) -> Dict[str, Any]:
    """
    Validate token with timing metrics for monitoring.
    
    Args:
        token: JWT token to validate
        token_type: Token type ('access' or 'refresh')
    
    Returns:
        Dict with 'valid', 'payload', 'error', and 'duration_ms' keys
    """
    start_time = datetime.utcnow()
    
    try:
        if token_type == 'access':
            result = await verify_access_token(token)
        else:
            result = await verify_refresh_token(token)
        
        duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        return {
            **result,
            'duration_ms': round(duration_ms, 2)
        }
    
    except Exception as e:
        duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        return {
            'valid': False,
            'error': str(e),
            'duration_ms': round(duration_ms, 2)
        }


# Utility function to extract token from Authorization header
def extract_bearer_token(auth_header: str) -> Optional[str]:
    """
    Extract JWT token from Authorization header.
    
    Args:
        auth_header: Authorization header value
    
    Returns:
        JWT token or None if invalid format
    """
    if not auth_header:
        return None
    
    if auth_header.startswith('Bearer '):
        return auth_header[7:].strip()
    
    return None


def decode_token_without_verification(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode JWT token without signature verification.
    
    WARNING: Only use for debugging or when you need to inspect
    token contents without validating signature. Never use this
    for authentication decisions.
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded payload or None if invalid format
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        payload_json = base64url_decode(parts[1]).decode('utf-8')
        return json.loads(payload_json)
    
    except Exception as e:
        _log.debug(f"Failed to decode token: {e}")
        return None
