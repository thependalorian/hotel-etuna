"""
Tools for the Security Guardian agent.

Location: backend_python/smartpay_ai/agents/security_guardian/tools.py
Purpose: Fraud detection and risk assessment utilities.

MIGRATION NOTE:
Risk thresholds now centralized in config.transaction_limits module.
This ensures consistency with compliance validators and eliminates DRY violations.
"""

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta

# Import centralized risk configuration (PSD-6 compliance)
from smartpay_ai.config.transaction_limits import (
    DEFAULT_RISK_THRESHOLDS,
    get_risk_level_from_score,
)

logger = logging.getLogger(__name__)


async def assess_transaction_risk(
    transaction: Dict[str, Any],
    user_history: Dict[str, Any],
    ml_service: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Assess fraud risk for a specific transaction.
    
    Args:
        transaction: Transaction details
        user_history: User's historical patterns
        ml_service: Optional ML service for fraud detection
    
    Returns:
        Risk assessment with score and factors
    """
    risk_factors = []
    total_risk = 0.0
    
    # Factor 1: Transaction amount (weight: 0.25)
    amount = float(transaction.get("amount", 0))
    avg_amount = float(user_history.get("avg_transaction_amount", 0))
    
    if avg_amount > 0:
        amount_ratio = amount / avg_amount
        if amount_ratio > 3.0:
            amount_risk = min(amount_ratio / 10, 1.0)
            total_risk += amount_risk * 0.25
            risk_factors.append({
                "factor": "transaction_amount",
                "weight": 0.25,
                "description": f"Amount (N${amount:.2f}) is {amount_ratio:.1f}x your average",
                "is_flagged": amount_ratio > 3.0,
            })
    
    # Factor 2: Recipient history (weight: 0.20)
    is_new_recipient = transaction.get("is_new_recipient", False)
    recipient_trust_score = transaction.get("recipient_trust_score", 0.5)
    
    if is_new_recipient:
        recipient_risk = 1.0 - recipient_trust_score
        total_risk += recipient_risk * 0.20
        risk_factors.append({
            "factor": "recipient_history",
            "weight": 0.20,
            "description": "First time sending to this recipient",
            "is_flagged": True,
        })
    
    # Factor 3: Transaction velocity (weight: 0.15)
    recent_count = int(user_history.get("transactions_last_hour", 0))
    normal_count = int(user_history.get("avg_transactions_per_hour", 0)) or 2
    
    if recent_count > normal_count * 3:
        velocity_risk = min(recent_count / (normal_count * 5), 1.0)
        total_risk += velocity_risk * 0.15
        risk_factors.append({
            "factor": "transaction_velocity",
            "weight": 0.15,
            "description": f"{recent_count} transactions in last hour (normal: {normal_count})",
            "is_flagged": True,
        })
    
    # Factor 4: Location consistency (weight: 0.10)
    location = transaction.get("location", {})
    home_location = user_history.get("home_location", {})
    
    if location and home_location:
        location_distance = _calculate_distance(location, home_location)
        if location_distance > 100:  # > 100km from home
            location_risk = min(location_distance / 1000, 1.0)
            total_risk += location_risk * 0.10
            risk_factors.append({
                "factor": "location_consistency",
                "weight": 0.10,
                "description": f"Transaction from {location_distance:.0f}km away from usual location",
                "is_flagged": location_distance > 100,
            })
    
    # Factor 5: Device trust (weight: 0.10)
    is_trusted_device = transaction.get("is_trusted_device", True)
    if not is_trusted_device:
        total_risk += 0.10
        risk_factors.append({
            "factor": "device_trust",
            "weight": 0.10,
            "description": "Transaction from new or untrusted device",
            "is_flagged": True,
        })
    
    # Factor 6: Time of day (weight: 0.05)
    hour = datetime.now().hour
    if hour < 5 or hour > 23:  # Late night/early morning
        total_risk += 0.05
        risk_factors.append({
            "factor": "time_of_day",
            "weight": 0.05,
            "description": f"Unusual transaction time: {hour:02d}:00",
            "is_flagged": True,
        })
    
    # Factor 7: Account age (weight: 0.05)
    account_age_days = int(user_history.get("account_age_days", 365))
    if account_age_days < 30:
        account_risk = 1.0 - (account_age_days / 30)
        total_risk += account_risk * 0.05
        risk_factors.append({
            "factor": "account_age",
            "weight": 0.05,
            "description": f"Account is only {account_age_days} days old",
            "is_flagged": True,
        })
    
    # Factor 8: Failed attempts (weight: 0.10)
    failed_attempts = int(user_history.get("failed_attempts_last_24h", 0))
    if failed_attempts > 3:
        failure_risk = min(failed_attempts / 10, 1.0)
        total_risk += failure_risk * 0.10
        risk_factors.append({
            "factor": "failed_attempts",
            "weight": 0.10,
            "description": f"{failed_attempts} failed login/transaction attempts in last 24h",
            "is_flagged": True,
        })
    
    # Use ML service if available
    if ml_service:
        try:
            ml_result = ml_service.predict("fraud_detection", transaction)
            ml_risk_score = ml_result.get("risk_score", total_risk)
            total_risk = (total_risk + ml_risk_score) / 2  # Average rule-based and ML
        except Exception as e:
            logger.debug(f"ML fraud detection failed: {e}")
    
    # Determine risk level using centralized thresholds (PSD-6 compliance)
    risk_level = get_risk_level_from_score(total_risk).value
    
    # Check if transaction is safe (uses centralized medium threshold)
    is_safe = total_risk < DEFAULT_RISK_THRESHOLDS.medium_threshold
    
    return {
        "risk_score": total_risk,
        "risk_level": risk_level,
        "is_safe": is_safe,
        "risk_factors": risk_factors,
    }


async def check_recipient_reputation(
    recipient_id: str,
    db_pool: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Check recipient's reputation and history.
    
    Args:
        recipient_id: Recipient user ID or phone number
        db_pool: Database connection pool
    
    Returns:
        Reputation details
    
    NOTE: Migrated to use TransactionRepository for reusable query patterns.
    See: smartpay_ai/repositories/transaction_repository.py
    """
    if not db_pool:
        return {
            "trust_score": 0.5,
            "transaction_count": 0,
            "flagged": False,
            "status": "unknown",
        }
    
    try:
        from smartpay_ai.repositories import TransactionRepository
        
        txn_repo = TransactionRepository(db_pool)
        
        # Check fraud reports (still custom query - no repository method yet)
        async with db_pool.acquire() as conn:
            flag_query = """
                SELECT COUNT(*) as report_count
                FROM fraud_reports
                WHERE reported_user_id = $1
                AND status != 'resolved'
            """
            flag_row = await conn.fetchrow(flag_query, recipient_id)
            report_count = int(flag_row["report_count"]) if flag_row else 0
        
        # Get transaction history using repository (eliminates duplicate query)
        recipient_txns = await txn_repo.get_recipient_transaction_history(
            recipient_id=recipient_id,
            limit=100
        )
        
        txn_count = len(recipient_txns)
        avg_amount = (
            sum(float(txn["amount"]) for txn in recipient_txns) / txn_count
            if txn_count > 0 else 0.0
        )
        
        # Calculate trust score
        trust_score = 0.5  # Base score
        
        # Increase trust with transaction history
        if txn_count > 0:
            trust_score += min(txn_count / 100, 0.3)
        
        # Decrease trust if flagged
        if report_count > 0:
            trust_score -= min(report_count / 5, 0.8)
        
        trust_score = max(0.0, min(1.0, trust_score))
        
        return {
            "trust_score": trust_score,
            "transaction_count": txn_count,
            "flagged": report_count > 0,
            "report_count": report_count,
            "avg_transaction": avg_amount,
            "status": "trusted" if trust_score > 0.7 else "flagged" if report_count > 0 else "neutral",
        }
    except Exception as e:
        logger.exception(f"Failed to check recipient reputation: {e}")
        return {
            "trust_score": 0.5,
            "transaction_count": 0,
            "flagged": False,
            "status": "unknown",
        }


async def detect_account_anomalies(
    user_id: str,
    db_pool: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """
    Detect unusual account activity.
    
    Args:
        user_id: User ID
        db_pool: Database connection pool
    
    Returns:
        List of anomalies detected
    
    NOTE: Migrated to use UserRepository for reusable query patterns.
    See: smartpay_ai/repositories/user_repository.py
    """
    anomalies = []
    
    if not db_pool:
        return anomalies
    
    try:
        from smartpay_ai.repositories import UserRepository
        
        user_repo = UserRepository(db_pool)
        
        # Check for multiple failed login attempts (uses repository)
        failed_logins = await user_repo.get_failed_login_attempts(user_id, hours=24)
        
        if failed_logins > 5:
            anomalies.append({
                "type": "multiple_failed_logins",
                "severity": "high",
                "description": f"{failed_logins} failed login attempts in last 24 hours",
                "recommendation": "Change your password and enable 2FA immediately",
            })
        
        # Check for unusual transaction patterns (uses repository)
        stats = await user_repo.get_transaction_history_stats(user_id, days=1)
        recent_txns = stats.get("transactions_last_hour", 0)
        
        if recent_txns > 10:
            anomalies.append({
                "type": "high_transaction_velocity",
                "severity": "medium",
                "description": f"{recent_txns} transactions in the last hour",
                "recommendation": "Verify all recent transactions are authorized",
            })
        
        # Check for new devices (uses repository)
        device_count = await user_repo.get_device_count(user_id, days=7)
        
        if device_count > 3:
            anomalies.append({
                "type": "multiple_new_devices",
                "severity": "medium",
                "description": f"Account accessed from {device_count} different devices in last 7 days",
                "recommendation": "Review device list and remove unfamiliar devices",
            })
    
    except Exception as e:
        logger.exception(f"Failed to detect anomalies: {e}")
    
    return anomalies


async def get_security_recommendations(
    user_profile: Dict[str, Any],
    db_pool: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """
    Generate personalized security recommendations.
    
    Args:
        user_profile: User profile data
        db_pool: Database connection pool
    
    Returns:
        List of security recommendations
    """
    recommendations = []
    
    # Check 2FA status
    if not user_profile.get("two_factor_enabled", False):
        recommendations.append({
            "category": "authentication",
            "title": "Enable Two-Factor Authentication",
            "description": "Add an extra layer of security by requiring a verification code when you log in. This prevents unauthorized access even if your password is stolen.",
            "impact": "high",
            "effort": "low",
            "priority": 1,
        })
    
    # Check biometric status
    if not user_profile.get("biometric_enabled", False):
        recommendations.append({
            "category": "authentication",
            "title": "Enable Biometric Login",
            "description": "Use fingerprint or face recognition for quick and secure access. Much safer than PIN alone.",
            "impact": "high",
            "effort": "low",
            "priority": 1,
        })
    
    # Check notification settings
    if not user_profile.get("transaction_alerts_enabled", True):
        recommendations.append({
            "category": "monitoring",
            "title": "Enable Transaction Alerts",
            "description": "Get instant SMS/push notifications for every transaction. Helps you catch fraud immediately.",
            "impact": "high",
            "effort": "low",
            "priority": 2,
        })
    
    # Check password age
    password_age_days = user_profile.get("password_age_days", 0)
    if password_age_days > 180:
        recommendations.append({
            "category": "authentication",
            "title": "Update Your Password",
            "description": f"Your password is {password_age_days} days old. Change it regularly (every 6 months) to stay secure.",
            "impact": "medium",
            "effort": "low",
            "priority": 3,
        })
    
    # General education
    recommendations.append({
        "category": "education",
        "title": "Learn to Spot Scams",
        "description": "Never share your PIN, don't click suspicious links, and verify callers claiming to be from banks or government.",
        "impact": "high",
        "effort": "low",
        "priority": 2,
    })
    
    return recommendations


def _calculate_distance(
    loc1: Dict[str, Any],
    loc2: Dict[str, Any],
) -> float:
    """
    Calculate approximate distance between two locations in km.
    
    Args:
        loc1: Location dict with lat/lon
        loc2: Location dict with lat/lon
    
    Returns:
        Distance in kilometers
    """
    from math import radians, sin, cos, sqrt, atan2
    
    lat1 = float(loc1.get("latitude", 0))
    lon1 = float(loc1.get("longitude", 0))
    lat2 = float(loc2.get("latitude", 0))
    lon2 = float(loc2.get("longitude", 0))
    
    if lat1 == 0 or lat2 == 0:
        return 0.0
    
    # Haversine formula
    R = 6371  # Earth radius in km
    
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    distance = R * c
    return distance


async def check_device_trust(
    device_id: str,
    user_id: str,
    db_pool: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Check if device is trusted for this user.
    
    Args:
        device_id: Device identifier
        user_id: User ID
        db_pool: Database connection pool
    
    Returns:
        Device trust status
    
    NOTE: Migrated to use UserRepository for reusable query patterns.
    See: smartpay_ai/repositories/user_repository.py
    """
    if not db_pool:
        return {
            "is_trusted": False,
            "first_seen": None,
            "last_seen": None,
            "login_count": 0,
        }
    
    try:
        from smartpay_ai.repositories import UserRepository
        
        user_repo = UserRepository(db_pool)
        
        # Use repository method (eliminates duplicate query)
        is_trusted, device_info = await user_repo.is_device_trusted(user_id, device_id)
        
        return device_info
    except Exception as e:
        logger.exception(f"Failed to check device trust: {e}")
        return {
            "is_trusted": False,
            "first_seen": None,
            "last_seen": None,
            "login_count": 0,
        }
