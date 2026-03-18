"""
Fetch current user profile from Smartpay Node API (single source of truth for user data).

Location: backend_python/smartpay_ai/user_profile.py
Purpose: DRY – profile lives in Node; Copilot calls GET /api/v1/mobile/user/profile with
         Bearer token and uses the returned user (id, name, phone, smartpay_id, kyc_status) for context.
"""

import logging
import os
from typing import Any, Dict, Optional, Tuple

import httpx

# Import centralized transaction limits (DRY Violation #4 fix)
from smartpay_ai.config.transaction_limits import get_limits_for_tier, KYCTier

logger = logging.getLogger(__name__)

# Base URL of the Smartpay Node backend (e.g. http://localhost:3000). Set in .env.
SMARTPAY_API_BASE_URL = os.getenv("SMARTPAY_API_BASE_URL", "").rstrip("/")


async def fetch_user_profile(auth_token: str) -> Optional[Dict[str, Any]]:
    """
    Fetch the current user's profile from the Smartpay Node API using the session token.
    Returns the same user object the mobile app gets from GET /api/v1/mobile/user/profile.
    Single source of truth: Node backend and users table.
    """
    if not SMARTPAY_API_BASE_URL:
        logger.info("SMARTPAY_API_BASE_URL not set; Copilot will not have user profile. Set it in .env (e.g. http://localhost:3000).")
        return None
    token = auth_token.strip()
    if token.startswith("Bearer "):
        token = token[7:].strip()
    if not token:
        return None
    url = f"{SMARTPAY_API_BASE_URL}/api/v1/mobile/user/profile"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                url,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            )
        if r.status_code != 200:
            logger.info("User profile fetch returned %s: %s", r.status_code, r.text[:200])
            return None
        data = r.json()
        user = data.get("user")
        if not user or not isinstance(user, dict):
            return None
        return user
    except Exception as e:
        logger.warning("Failed to fetch user profile from Node API: %s", e)
        return None


def _display_name_and_details(profile: Dict[str, Any]) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
    """Extract name, phone, smartpay_id, kyc_status from profile (DRY). Returns (display_name, phone, smartpay_id, kyc_status)."""
    name = profile.get("name") or (
        " ".join(filter(None, [profile.get("first_name"), profile.get("last_name")])).strip() or None
    )
    phone = profile.get("phone")
    smartpay_id = profile.get("smartpay_id") or profile.get("smartpayId")
    kyc_status = profile.get("kyc_status") or profile.get("kycStatus")
    return (name, phone, smartpay_id, kyc_status)


def format_user_context(profile: Dict[str, Any]) -> str:
    """One-line summary for injecting into the conversation so the model sees user context without calling the tool."""
    name, phone, smartpay_id, kyc_status = _display_name_and_details(profile)
    parts = []
    if name:
        parts.append(f"name is {name}")
    if phone:
        parts.append(f"phone is {phone}")
    if smartpay_id:
        parts.append(f"SmartpayID is {smartpay_id}")
    if kyc_status:
        parts.append(f"KYC status is {kyc_status}")
    if not parts:
        return ""
    return f"[Current user: {'; '.join(parts)}.]"


def format_user_info_response(profile: Optional[Dict[str, Any]]) -> str:
    """Format profile for the get_user_info tool response. Single place for tool copy (DRY)."""
    if profile is None:
        return (
            "I don't have access to the current user's profile. "
            "The user can see their name and details in the Smartpay app profile section."
        )
    name, phone, smartpay_id, kyc_status = _display_name_and_details(profile)
    parts = []
    if name:
        parts.append(f"Name: {name}")
    if phone:
        parts.append(f"Phone: {phone}")
    if smartpay_id:
        parts.append(f"SmartpayID: {smartpay_id}")
    if kyc_status:
        parts.append(f"KYC Status: {kyc_status}")
    
    # Add Namibian context with centralized limits (PSD-6 compliance)
    parts.append("\nNote: This is a Namibian digital payment platform using NAD (N$).")
    
    # Use centralized transaction limits (DRY Violation #4 fix)
    try:
        if kyc_status in ["basic", "Basic"]:
            limits = get_limits_for_tier(KYCTier.BASIC.value)
            parts.append(
                f"User has Basic KYC tier: "
                f"N${limits.max_wallet_balance:,.0f} max balance, "
                f"N${limits.max_single_transaction:,.0f} per transaction, "
                f"N${limits.max_daily_transaction:,.0f} daily limit."
            )
        elif kyc_status in ["standard", "Standard"]:
            limits = get_limits_for_tier(KYCTier.STANDARD.value)
            parts.append(
                f"User has Standard KYC tier: "
                f"N${limits.max_wallet_balance:,.0f} max balance, "
                f"N${limits.max_single_transaction:,.0f} per transaction, "
                f"N${limits.max_daily_transaction:,.0f} daily limit."
            )
        elif kyc_status in ["premium", "Premium"]:
            limits = get_limits_for_tier(KYCTier.PREMIUM.value)
            parts.append(
                f"User has Premium KYC tier: "
                f"N${limits.max_wallet_balance:,.0f} max balance, "
                f"N${limits.max_single_transaction:,.0f} per transaction, "
                f"N${limits.max_daily_transaction:,.0f} daily limit."
            )
    except Exception as e:
        # Fallback to generic message if limits unavailable
        logger.warning(f"Failed to get tier limits for {kyc_status}: {e}")
        if kyc_status:
            parts.append(f"User has {kyc_status} KYC tier.")
    
    if not parts:
        return "The user's profile is available but name and phone are not set yet (e.g. onboarding not complete)."
    return "\n".join(parts)
