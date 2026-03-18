"""
Example usage of the shared JWT validator.

This file demonstrates how to use the JWT validation functions
in your FastAPI endpoints and middleware.

Run this file directly to test JWT operations:
    python -m smartpay_ai.shared.example_usage
"""

import asyncio
import os
import logging
from typing import Dict, Any

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import JWT functions
from smartpay_ai.shared import (
    generate_access_token,
    generate_refresh_token,
    verify_access_token,
    verify_refresh_token,
    refresh_access_token,
    revoke_access_token,
    revoke_refresh_token,
    revoke_all_user_tokens,
    cleanup_expired_tokens,
    extract_bearer_token,
    set_database_pool,
)


async def example_1_basic_token_generation():
    """Example 1: Generate and verify an access token."""
    print("\n" + "="*60)
    print("Example 1: Basic Token Generation and Verification")
    print("="*60)
    
    user_id = "user-123-test"
    
    # Generate access token
    print(f"\n1. Generating access token for user: {user_id}")
    access_token = await generate_access_token(user_id)
    print(f"   ✓ Token generated: {access_token[:50]}...")
    
    # Verify token
    print(f"\n2. Verifying access token...")
    result = await verify_access_token(access_token)
    
    if result['valid']:
        print(f"   ✓ Token is valid!")
        print(f"   - User ID: {result['payload']['userId']}")
        print(f"   - Token Type: {result['payload']['type']}")
        print(f"   - Issued At: {result['payload']['iat']}")
        print(f"   - Expires At: {result['payload']['exp']}")
        print(f"   - JWT ID: {result['payload']['jti']}")
    else:
        print(f"   ✗ Token validation failed: {result['error']}")


async def example_2_refresh_token_flow():
    """Example 2: Complete refresh token flow."""
    print("\n" + "="*60)
    print("Example 2: Refresh Token Flow")
    print("="*60)
    
    user_id = "user-456-test"
    
    # Generate refresh token
    print(f"\n1. Generating refresh token for user: {user_id}")
    refresh_token = await generate_refresh_token(user_id)
    print(f"   ✓ Refresh token generated: {refresh_token[:50]}...")
    
    # Verify refresh token
    print(f"\n2. Verifying refresh token...")
    result = await verify_refresh_token(refresh_token)
    print(f"   ✓ Refresh token is valid!")
    
    # Use refresh token to get new access token
    print(f"\n3. Refreshing access token...")
    refresh_result = await refresh_access_token(refresh_token)
    
    if 'accessToken' in refresh_result:
        new_access_token = refresh_result['accessToken']
        print(f"   ✓ New access token generated: {new_access_token[:50]}...")
        
        # Verify new access token
        verify_result = await verify_access_token(new_access_token)
        if verify_result['valid']:
            print(f"   ✓ New access token is valid!")
            print(f"   - User ID: {verify_result['payload']['userId']}")
    else:
        print(f"   ✗ Token refresh failed: {refresh_result['error']}")


async def example_3_token_revocation():
    """Example 3: Token revocation."""
    print("\n" + "="*60)
    print("Example 3: Token Revocation")
    print("="*60)
    
    user_id = "user-789-test"
    
    # Generate tokens
    print(f"\n1. Generating tokens for user: {user_id}")
    access_token = await generate_access_token(user_id)
    refresh_token = await generate_refresh_token(user_id)
    print(f"   ✓ Tokens generated")
    
    # Verify they work
    print(f"\n2. Verifying tokens work...")
    access_result = await verify_access_token(access_token)
    refresh_result = await verify_refresh_token(refresh_token)
    print(f"   ✓ Access token valid: {access_result['valid']}")
    print(f"   ✓ Refresh token valid: {refresh_result['valid']}")
    
    # Revoke access token
    print(f"\n3. Revoking access token...")
    await revoke_access_token(access_token)
    print(f"   ✓ Access token revoked")
    
    # Try to verify revoked access token
    print(f"\n4. Attempting to verify revoked access token...")
    revoked_result = await verify_access_token(access_token)
    print(f"   ✓ Token correctly rejected: {not revoked_result['valid']}")
    print(f"   - Error: {revoked_result.get('error')}")
    
    # Revoke refresh token
    print(f"\n5. Revoking refresh token...")
    await revoke_refresh_token(refresh_token)
    print(f"   ✓ Refresh token revoked")


async def example_4_revoke_all_user_tokens():
    """Example 4: Revoke all tokens for a user (logout)."""
    print("\n" + "="*60)
    print("Example 4: Revoke All User Tokens (Logout)")
    print("="*60)
    
    user_id = "user-logout-test"
    
    # Generate multiple tokens
    print(f"\n1. Generating multiple tokens for user: {user_id}")
    token1 = await generate_access_token(user_id)
    token2 = await generate_access_token(user_id)
    refresh_token = await generate_refresh_token(user_id)
    print(f"   ✓ Generated 2 access tokens and 1 refresh token")
    
    # Revoke all tokens
    print(f"\n2. Revoking all tokens for user...")
    await revoke_all_user_tokens(user_id)
    print(f"   ✓ All tokens revoked")
    
    # Verify all tokens are invalid
    print(f"\n3. Verifying all tokens are now invalid...")
    result1 = await verify_access_token(token1)
    result2 = await verify_access_token(token2)
    result3 = await verify_refresh_token(refresh_token)
    print(f"   ✓ Token 1 invalid: {not result1['valid']}")
    print(f"   ✓ Token 2 invalid: {not result2['valid']}")
    print(f"   ✓ Refresh token invalid: {not result3['valid']}")


async def example_5_bearer_token_extraction():
    """Example 5: Extract token from Authorization header."""
    print("\n" + "="*60)
    print("Example 5: Bearer Token Extraction")
    print("="*60)
    
    # Example Authorization headers
    headers = [
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "Bearer    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...   ",
        "InvalidFormat eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "",
    ]
    
    print("\n1. Extracting tokens from Authorization headers:")
    for i, header in enumerate(headers, 1):
        token = extract_bearer_token(header)
        status = "✓ Extracted" if token else "✗ Failed"
        display_header = header[:40] + "..." if len(header) > 40 else header
        print(f"   {status}: '{display_header}'")
        if token:
            print(f"            Token: {token[:40]}...")


async def example_6_fastapi_middleware():
    """Example 6: Usage in FastAPI middleware."""
    print("\n" + "="*60)
    print("Example 6: FastAPI Middleware Integration")
    print("="*60)
    
    print("\nHere's how to use the JWT validator in FastAPI middleware:")
    print("""
from fastapi import Request, HTTPException
from smartpay_ai.shared import verify_access_token, extract_bearer_token

async def authenticate_request(request: Request):
    '''Middleware function to authenticate requests.'''
    # Extract Authorization header
    auth_header = request.headers.get('Authorization', '')
    token = extract_bearer_token(auth_header)
    
    if not token:
        raise HTTPException(status_code=401, detail='Missing authorization token')
    
    # Verify token
    result = await verify_access_token(token)
    if not result['valid']:
        raise HTTPException(status_code=401, detail=result['error'])
    
    # Attach user info to request state
    request.state.user_id = result['payload']['userId']
    request.state.user = result['payload']
    
    return result['payload']

# In your FastAPI app:
@app.get('/api/protected-endpoint')
async def protected_endpoint(request: Request):
    user_id = request.state.user_id
    return {'message': f'Hello user {user_id}'}
    """)


async def example_7_token_cleanup():
    """Example 7: Clean up expired tokens."""
    print("\n" + "="*60)
    print("Example 7: Token Cleanup (Maintenance)")
    print("="*60)
    
    print("\n1. Running token cleanup...")
    access_count, refresh_count = await cleanup_expired_tokens()
    print(f"   ✓ Cleaned up {access_count} access tokens")
    print(f"   ✓ Cleaned up {refresh_count} refresh tokens")
    
    print("\n2. This should be run periodically (e.g., daily cron job):")
    print("""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from smartpay_ai.shared import cleanup_expired_tokens

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour=2)  # Run daily at 2 AM
async def daily_token_cleanup():
    access_count, refresh_count = await cleanup_expired_tokens()
    logger.info(f"Cleaned up {access_count} access and {refresh_count} refresh tokens")

scheduler.start()
    """)


async def main():
    """Run all examples."""
    print("\n" + "="*60)
    print("JWT Validator - Example Usage")
    print("="*60)
    
    # Check environment setup
    jwt_secret = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
    jwt_refresh_secret = os.getenv('JWT_REFRESH_SECRET', 'your-refresh-secret-key')
    
    print("\nEnvironment Configuration:")
    print(f"  JWT_SECRET: {'✓ Set' if jwt_secret != 'your-secret-key-change-in-production' else '⚠ Using default (for dev only)'}")
    print(f"  JWT_REFRESH_SECRET: {'✓ Set' if jwt_refresh_secret != 'your-refresh-secret-key' else '⚠ Using default (for dev only)'}")
    
    # Note about database
    print("\n⚠ Note: These examples run without database connection.")
    print("  Token validation will work, but database revocation checking is skipped.")
    print("  To enable full functionality, initialize database pool:")
    print("\n  from smartpay_ai.shared import set_database_pool")
    print("  pool = await asyncpg.create_pool(...)")
    print("  set_database_pool(pool)")
    
    # Run examples
    try:
        await example_1_basic_token_generation()
        await example_2_refresh_token_flow()
        await example_3_token_revocation()
        await example_4_revoke_all_user_tokens()
        await example_5_bearer_token_extraction()
        await example_6_fastapi_middleware()
        await example_7_token_cleanup()
        
        print("\n" + "="*60)
        print("All examples completed successfully! ✓")
        print("="*60)
        print("\nNext steps:")
        print("  1. Review JWT_MIGRATION_GUIDE.md for complete documentation")
        print("  2. Set up proper JWT secrets in production environment")
        print("  3. Initialize database pool for full functionality")
        print("  4. Integrate JWT validator into your FastAPI middleware")
        print("  5. Implement token refresh on your client application")
        print("="*60 + "\n")
    
    except Exception as e:
        logger.error(f"Example failed: {e}", exc_info=True)
        print(f"\n✗ Error running examples: {e}")


if __name__ == "__main__":
    asyncio.run(main())
