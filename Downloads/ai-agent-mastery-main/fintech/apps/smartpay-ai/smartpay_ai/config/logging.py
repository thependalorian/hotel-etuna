"""
Audit Logging Configuration for Smartpay AI Backend.

Location: backend_python/smartpay_ai/config/logging.py
Purpose: Centralized audit logging for security events, authentication, and financial operations.
         PSD-12 compliance for audit trail requirements.
"""

import os
import json
import logging
from typing import Any, Dict, Optional
from datetime import datetime
import httpx

_log = logging.getLogger(__name__)


class AuditLogger:
    """
    Centralized audit logging for security and financial events.
    
    Logs to:
    1. Local file system (development)
    2. Database via Node.js API (production)
    3. SIEM integration (future)
    """
    
    def __init__(self, node_api_base_url: Optional[str] = None):
        """
        Initialize audit logger.
        
        Args:
            node_api_base_url: Base URL for Node.js backend API
        """
        self.node_api_base_url = node_api_base_url or os.getenv(
            "SMARTPAY_API_BASE_URL",
            "http://localhost:4000"
        )
        self.log_to_file = os.getenv("AUDIT_LOG_TO_FILE", "true").lower() == "true"
        self.log_file_path = os.getenv(
            "AUDIT_LOG_FILE",
            "/var/log/smartpay/audit.log"
        )
        
        # Create log directory if needed
        if self.log_to_file:
            log_dir = os.path.dirname(self.log_file_path)
            if log_dir and not os.path.exists(log_dir):
                try:
                    os.makedirs(log_dir, exist_ok=True)
                except Exception as e:
                    _log.warning("Could not create audit log directory: %s", e)
                    self.log_to_file = False
    
    async def log_event(
        self,
        event_type: str,
        user_id: Optional[str] = None,
        event_data: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        severity: str = "INFO"
    ) -> None:
        """
        Log audit event.
        
        Args:
            event_type: Type of event (e.g., AUTHENTICATION_SUCCESS, PAYMENT_INITIATED)
            user_id: User ID associated with event
            event_data: Additional event data
            ip_address: Client IP address
            user_agent: User agent string
            severity: Log severity (INFO, WARNING, ERROR, CRITICAL)
        """
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "user_id": user_id,
            "event_data": event_data or {},
            "ip_address": ip_address,
            "user_agent": user_agent,
            "severity": severity,
            "source": "python_backend"
        }
        
        # Log to file
        if self.log_to_file:
            try:
                with open(self.log_file_path, "a") as f:
                    f.write(json.dumps(audit_entry) + "\n")
            except Exception as e:
                _log.error("Failed to write audit log to file: %s", e)
        
        # Log to database via Node.js API (async, non-blocking)
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{self.node_api_base_url}/api/audit/log",
                    json=audit_entry
                )
        except Exception as e:
            # Don't fail request if audit logging fails
            _log.warning("Failed to send audit log to Node API: %s", e)
        
        # Also log to application logger
        _log.info(
            "AUDIT [%s] %s - User: %s - IP: %s",
            severity,
            event_type,
            user_id or "anonymous",
            ip_address or "unknown"
        )
    
    async def log_authentication(
        self,
        success: bool,
        user_id: Optional[str],
        ip_address: str,
        user_agent: str,
        error_message: Optional[str] = None
    ) -> None:
        """Log authentication attempt."""
        event_type = "AUTHENTICATION_SUCCESS" if success else "AUTHENTICATION_FAILURE"
        severity = "INFO" if success else "WARNING"
        
        await self.log_event(
            event_type=event_type,
            user_id=user_id,
            event_data={
                "success": success,
                "error_message": error_message
            },
            ip_address=ip_address,
            user_agent=user_agent,
            severity=severity
        )
    
    async def log_2fa_verification(
        self,
        success: bool,
        user_id: str,
        method: str,
        ip_address: str,
        user_agent: str,
        error_message: Optional[str] = None
    ) -> None:
        """Log 2FA verification attempt."""
        event_type = "TWO_FACTOR_AUTH_SUCCESS" if success else "TWO_FACTOR_AUTH_FAILURE"
        severity = "INFO" if success else "WARNING"
        
        await self.log_event(
            event_type=event_type,
            user_id=user_id,
            event_data={
                "success": success,
                "method": method,
                "error_message": error_message
            },
            ip_address=ip_address,
            user_agent=user_agent,
            severity=severity
        )
    
    async def log_payment_operation(
        self,
        operation: str,
        user_id: str,
        amount: float,
        currency: str,
        payment_id: str,
        ip_address: str,
        success: bool,
        fraud_risk_score: Optional[int] = None,
        twofa_verified: bool = False,
        error_message: Optional[str] = None
    ) -> None:
        """Log financial operation."""
        event_type = f"PAYMENT_{operation.upper()}"
        severity = "INFO" if success else "ERROR"
        
        await self.log_event(
            event_type=event_type,
            user_id=user_id,
            event_data={
                "operation": operation,
                "amount": amount,
                "currency": currency,
                "payment_id": payment_id,
                "success": success,
                "fraud_risk_score": fraud_risk_score,
                "twofa_verified": twofa_verified,
                "error_message": error_message
            },
            ip_address=ip_address,
            user_agent=None,
            severity=severity
        )
    
    async def log_fraud_detection(
        self,
        payment_id: str,
        user_id: str,
        risk_score: int,
        action_taken: str,
        rules_triggered: list,
        fraud_indicators: list,
        ip_address: str
    ) -> None:
        """Log fraud detection event."""
        severity = "CRITICAL" if action_taken == "BLOCKED" else "WARNING"
        
        await self.log_event(
            event_type="FRAUD_DETECTION",
            user_id=user_id,
            event_data={
                "payment_id": payment_id,
                "risk_score": risk_score,
                "action_taken": action_taken,
                "rules_triggered": rules_triggered,
                "fraud_indicators": fraud_indicators
            },
            ip_address=ip_address,
            user_agent=None,
            severity=severity
        )
    
    async def log_rate_limit_exceeded(
        self,
        user_id: Optional[str],
        endpoint: str,
        ip_address: str,
        retry_after: int
    ) -> None:
        """Log rate limit violation."""
        await self.log_event(
            event_type="RATE_LIMIT_EXCEEDED",
            user_id=user_id,
            event_data={
                "endpoint": endpoint,
                "retry_after_seconds": retry_after
            },
            ip_address=ip_address,
            user_agent=None,
            severity="WARNING"
        )
    
    async def log_security_violation(
        self,
        violation_type: str,
        user_id: Optional[str],
        details: Dict[str, Any],
        ip_address: str,
        user_agent: Optional[str] = None
    ) -> None:
        """Log security violation."""
        await self.log_event(
            event_type=f"SECURITY_VIOLATION_{violation_type.upper()}",
            user_id=user_id,
            event_data=details,
            ip_address=ip_address,
            user_agent=user_agent,
            severity="CRITICAL"
        )


# Singleton instance
_audit_logger: Optional[AuditLogger] = None


def get_audit_logger() -> AuditLogger:
    """Get or create singleton audit logger instance."""
    global _audit_logger
    if _audit_logger is None:
        _audit_logger = AuditLogger()
    return _audit_logger
