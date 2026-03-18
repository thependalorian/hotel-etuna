"""
Security Guardian agent: Pydantic AI agent and run_security_guardian.

Location: backend_python/smartpay_ai/agents/security_guardian/agent.py
Purpose: Protect users from fraud and provide security guidance.

REFACTORED: Now uses BaseAgent to eliminate boilerplate duplication.

COMPLIANCE INTEGRATION:
- PSD-1: Secondary transaction limit validation
- PSD-6: Violation logging to Node.js backend
- PSD-12: Dynamic fraud threshold synchronization
- FIA: Security alert persistence for STR/CTR reporting
"""

import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional

from pydantic_ai import Agent, RunContext

from smartpay_ai.agents.base_agent import BaseAgent, BaseAgentDeps, ComplianceHelperMixin
from smartpay_ai.providers import get_llm_model
from smartpay_ai.compliance.validator import ComplianceValidator
from smartpay_ai.compliance.config_sync import get_config_sync

from .models import (
    SecurityAssessmentResponse,
    SecurityAlert,
    RiskFactor,
    SecurityRecommendation,
)
from .prompts import SECURITY_GUARDIAN_SYSTEM_PROMPT
from . import tools

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------

@dataclass
class SecurityGuardianDeps(BaseAgentDeps):
    """Dependencies injected into the Security Guardian agent."""
    pass  # All common fields inherited from BaseAgentDeps


# ---------------------------------------------------------------------------
# Security Guardian Agent Implementation
# ---------------------------------------------------------------------------

class SecurityGuardianAgent(BaseAgent[SecurityGuardianDeps, SecurityAssessmentResponse], ComplianceHelperMixin):
    """
    Security Guardian agent using BaseAgent for DRY compliance.
    
    Eliminates ~150 lines of boilerplate by inheriting common patterns
    from BaseAgent and ComplianceHelperMixin.
    """
    
    def __init__(self):
        super().__init__(
            agent_name="security_guardian",
            deps_type=SecurityGuardianDeps,
            output_type=SecurityAssessmentResponse,
            system_prompt=SECURITY_GUARDIAN_SYSTEM_PROMPT,
        )
    
    def _register_tools(self, agent: Agent) -> None:
        """Register security-specific tools."""
        agent.tool(self._assess_transaction_risk)
        agent.tool(self._check_recipient_reputation)
        agent.tool(self._detect_account_anomalies)
        agent.tool(self._get_security_recommendations)
        agent.tool(self._check_device_trust)
    
    def get_default_response(self, error_message: str) -> SecurityAssessmentResponse:
        """Return a safe default security response."""
        return SecurityAssessmentResponse(
            summary=error_message,
            risk_score=0.5,
            risk_level="medium",
            is_safe=False,
        )
    
    # -----------------------------------------------------------------------
    # Tool Implementations
    # -----------------------------------------------------------------------
    
    async def _assess_transaction_risk(
        self,
        ctx: RunContext[SecurityGuardianDeps],
        transaction: Dict[str, Any],
    ) -> str:
        """
        Assess fraud risk for a specific transaction.
        
        COMPLIANCE INTEGRATION:
        - PSD-1: Validates transaction limits as secondary check
        - PSD-6: Logs limit breaches as compliance violations
        - FIA: Persists high-risk alerts for STR/CTR reporting
        """
        compliance = ctx.deps.compliance_validator
        transaction_id = transaction.get("id")
        amount = float(transaction.get("amount", 0))
        
        # Get user history
        user_history = {}
        if ctx.deps.db_pool:
            # Would fetch from database in production
            user_history = {
                "avg_transaction_amount": 500.0,
                "transactions_last_hour": 2,
                "avg_transactions_per_hour": 2,
                "account_age_days": 120,
                "failed_attempts_last_24h": 0,
                "daily_spent": 0.0,
                "monthly_spent": 0.0,
            }
        
        # PSD-1: Secondary transaction limit validation
        if compliance:
            try:
                user_tier = transaction.get("user_tier", "basic")
                limits_check = await compliance.validate_transaction_limits(
                    user_id=ctx.deps.user_id,
                    amount=amount,
                    user_tier=user_tier,
                    daily_spent=user_history.get("daily_spent", 0),
                    monthly_spent=user_history.get("monthly_spent", 0),
                )
                
                if not limits_check.get("allowed"):
                    # PSD-6: Log violation using mixin helper
                    await self.log_compliance_violation(
                        compliance_validator=compliance,
                        violation_type="transaction_limit_breach",
                        psd_reference="PSD-1",
                        severity="moderate",
                        description=f"Transaction N${amount:.2f} exceeds regulatory limit for {user_tier} tier",
                        user_id=ctx.deps.user_id,
                        transaction_id=transaction_id,
                        remediation_action="Transaction blocked by Python backend secondary validation",
                    )
                    
                    return f"""⛔ Transaction BLOCKED: Regulatory Limit Exceeded

{limits_check.get('reason', 'Transaction exceeds your account tier limit')}

This is a regulatory requirement (PSD-1) to protect users.
To increase limits, upgrade your account verification tier.
"""
            except Exception as e:
                logger.error(f"PSD-1 validation failed: {e}")
        
        # Fraud risk assessment
        assessment = await tools.assess_transaction_risk(
            transaction=transaction,
            user_history=user_history,
            ml_service=ctx.deps.ml_service,
        )
        
        risk_score = assessment.get("risk_score", 0)
        risk_level = assessment.get("risk_level", "low")
        is_safe = assessment.get("is_safe", True)
        risk_factors = assessment.get("risk_factors", [])
        
        # FIA: Persist high-risk alerts for STR/CTR reporting
        if compliance and risk_score >= 0.7:
            try:
                alert_result = await compliance.log_security_alert(
                    user_id=ctx.deps.user_id,
                    transaction_id=transaction_id,
                    risk_score=risk_score,
                    risk_level=risk_level,
                    risk_factors=risk_factors,
                    source="security_guardian_ml",
                )
                
                if alert_result.get("str_triggered"):
                    logger.warning(
                        f"FIA STR triggered: transaction_id={transaction_id}, "
                        f"user_id={ctx.deps.user_id}, risk_score={risk_score}"
                    )
            except Exception as e:
                logger.error(f"Failed to log security alert: {e}")
        
        # FIA: Check if transaction meets reporting thresholds
        fia_check = {}
        if compliance:
            fia_check = compliance.check_fia_threshold(amount)
        
        summary = [
            f"Transaction Risk Assessment:",
            f"Risk Score: {risk_score:.2f} ({risk_level.upper()})",
            f"Safe to proceed: {'Yes ✓' if is_safe else 'No ⚠'}",
        ]
        
        # Add FIA threshold notices
        if fia_check.get("str_required"):
            summary.append(f"\nℹ️ High-value transaction (>N$20,000) - Enhanced monitoring applies")
        if fia_check.get("ctr_required"):
            summary.append(f"\nℹ️ Cash transaction reporting threshold met (>N$50,000)")
        
        summary.append(f"\nRisk Factors ({len(risk_factors)}):")
        
        for factor in risk_factors:
            flag = "🚩" if factor.get("is_flagged") else "✓"
            factor_name = factor.get("factor", "Unknown")
            description = factor.get("description", "")
            summary.append(f"{flag} {factor_name}: {description}")
        
        return "\n".join(summary)
    
    async def _check_recipient_reputation(
        self,
        ctx: RunContext[SecurityGuardianDeps],
        recipient_id: str,
    ) -> str:
        """Check recipient's reputation and history."""
        reputation = await tools.check_recipient_reputation(
            recipient_id=recipient_id,
            db_pool=ctx.deps.db_pool,
        )
        
        trust_score = reputation.get("trust_score", 0.5)
        status = reputation.get("status", "unknown")
        txn_count = reputation.get("transaction_count", 0)
        flagged = reputation.get("flagged", False)
        report_count = reputation.get("report_count", 0)
        
        status_icon = "✓" if status == "trusted" else "⚠" if status == "flagged" else "?"
        
        return f"""Recipient Reputation Check:
Status: {status_icon} {status.upper()}
Trust Score: {trust_score:.2f} / 1.00
Transaction History: {txn_count} successful payments
{'⚠ FLAGGED: ' + str(report_count) + ' fraud reports' if flagged else 'Clean record'}

Recommendation: {'Proceed with confidence' if status == 'trusted' else 'Exercise caution - verify recipient identity' if status == 'flagged' else 'First-time recipient - verify before sending'}
"""
    
    async def _detect_account_anomalies(
        self,
        ctx: RunContext[SecurityGuardianDeps],
    ) -> str:
        """
        Detect unusual account activity.
        
        COMPLIANCE INTEGRATION:
        - PSD-6: Logs critical anomalies as compliance violations
        - FIA: High-severity anomalies trigger security alerts
        """
        anomalies = await tools.detect_account_anomalies(
            user_id=ctx.deps.user_id,
            db_pool=ctx.deps.db_pool,
        )
        
        if not anomalies:
            return "No suspicious account activity detected. Your account is secure. ✓"
        
        compliance = ctx.deps.compliance_validator
        
        # Log critical anomalies as compliance violations
        critical_anomalies = [a for a in anomalies if a.get("severity") == "high"]
        if compliance and critical_anomalies:
            for anomaly in critical_anomalies:
                await self.log_compliance_violation(
                    compliance_validator=compliance,
                    violation_type=f"security_anomaly_{anomaly.get('type')}",
                    psd_reference="FIA-2012",
                    severity="serious",
                    description=anomaly.get("description", ""),
                    user_id=ctx.deps.user_id,
                    remediation_action=anomaly.get("recommendation", ""),
                )
        
        summary = [f"⚠ {len(anomalies)} Anomalies Detected:"]
        for i, anomaly in enumerate(anomalies, 1):
            anomaly_type = anomaly.get("type", "unknown")
            severity = anomaly.get("severity", "medium")
            description = anomaly.get("description", "")
            recommendation = anomaly.get("recommendation", "")
            
            severity_icon = "🚨" if severity == "high" else "⚠" if severity == "medium" else "ℹ"
            summary.append(f"\n{i}. {severity_icon} {anomaly_type.upper()}")
            summary.append(f"   {description}")
            summary.append(f"   Action: {recommendation}")
        
        return "\n".join(summary)
    
    async def _get_security_recommendations(
        self,
        ctx: RunContext[SecurityGuardianDeps],
    ) -> str:
        """Get personalized security recommendations."""
        # Get user profile (would fetch from database in production)
        user_profile = {
            "two_factor_enabled": False,
            "biometric_enabled": False,
            "transaction_alerts_enabled": True,
            "password_age_days": 90,
        }
        
        recommendations = await tools.get_security_recommendations(
            user_profile=user_profile,
            db_pool=ctx.deps.db_pool,
        )
        
        if not recommendations:
            return "Your security settings are excellent! Keep up the good work. ✓"
        
        # Sort by priority
        recommendations.sort(key=lambda x: x.get("priority", 5))
        
        summary = [f"Security Recommendations ({len(recommendations)}):"]
        for i, rec in enumerate(recommendations[:5], 1):  # Top 5
            title = rec.get("title", "")
            description = rec.get("description", "")
            impact = rec.get("impact", "medium")
            priority = rec.get("priority", 3)
            
            priority_icon = "🔴" if priority == 1 else "🟡" if priority == 2 else "🟢"
            summary.append(f"\n{i}. {priority_icon} {title} (Impact: {impact})")
            summary.append(f"   {description}")
        
        return "\n".join(summary)
    
    async def _check_device_trust(
        self,
        ctx: RunContext[SecurityGuardianDeps],
        device_id: str,
    ) -> str:
        """Check if device is trusted for this user."""
        device_info = await tools.check_device_trust(
            device_id=device_id,
            user_id=ctx.deps.user_id,
            db_pool=ctx.deps.db_pool,
        )
        
        is_trusted = device_info.get("is_trusted", False)
        status = device_info.get("status", "unknown")
        login_count = device_info.get("login_count", 0)
        days_known = device_info.get("days_known", 0)
        
        status_icon = "✓" if is_trusted else "⚠" if status == "known_device" else "🆕"
        
        return f"""Device Trust Check:
Status: {status_icon} {status.upper()}
Trusted: {'Yes' if is_trusted else 'No'}
Login Count: {login_count}
Days Known: {days_known}

{
    'This is a trusted device for your account.' if is_trusted 
    else f'This device has been used {login_count} times but needs more history to be trusted.' if status == 'known_device'
    else 'This is a new device. Extra verification recommended.'
}
"""


# ---------------------------------------------------------------------------
# Agent Instance
# ---------------------------------------------------------------------------

_security_guardian_instance = None

def get_security_guardian_agent() -> SecurityGuardianAgent:
    """Get singleton instance of SecurityGuardianAgent."""
    global _security_guardian_instance
    if _security_guardian_instance is None:
        _security_guardian_instance = SecurityGuardianAgent()
    return _security_guardian_instance


# ---------------------------------------------------------------------------
# Public Run Function (Backward Compatible)
# ---------------------------------------------------------------------------

async def run_security_guardian(
    query: str,
    user_id: str,
    transaction_id: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
    db_pool: Optional[Any] = None,
    ml_service: Optional[Any] = None,
    compliance_validator: Optional[ComplianceValidator] = None,
) -> SecurityAssessmentResponse:
    """
    Run the Security Guardian agent with compliance integration.
    
    BACKWARD COMPATIBLE: This function maintains the same signature as before
    but now uses the refactored BaseAgent implementation internally.
    
    COMPLIANCE FEATURES:
    - PSD-1: Secondary transaction limit validation
    - PSD-6: Automatic violation logging
    - PSD-12: Dynamic fraud thresholds from Node.js KRI config
    - FIA: Security alert persistence with database fallback for audit trail
    
    Args:
        query: User's security question
        user_id: User ID
        transaction_id: Optional specific transaction to assess
        context: Additional context (transaction details, etc.)
        db_pool: Database connection pool
        ml_service: ML service for fraud detection
        compliance_validator: ComplianceValidator instance (created if None)
    
    Returns:
        SecurityAssessmentResponse with risk assessment and recommendations
    """
    agent = get_security_guardian_agent()
    
    # Initialize compliance validator if not provided
    if compliance_validator is None:
        compliance_validator = await agent.initialize_compliance()
    
    # PSD-12: Sync fraud detection thresholds from Node.js KRI config
    config_sync = get_config_sync()
    try:
        thresholds = await config_sync.get_fraud_thresholds()
        if ml_service and hasattr(ml_service, "update_thresholds"):
            ml_service.update_thresholds(thresholds)
        logger.debug(f"Fraud thresholds synced: {thresholds}")
    except Exception as e:
        logger.warning(f"Failed to sync fraud thresholds: {e}")
    
    # Build dependencies
    deps = SecurityGuardianDeps(
        user_id=user_id,
        db_pool=db_pool,
        ml_service=ml_service,
        compliance_validator=compliance_validator,
    )
    
    # Build context with transaction_id if provided
    full_context = context.copy() if context else {}
    if transaction_id:
        full_context["transaction_id"] = transaction_id
    
    # Run agent with BaseAgent's standardized error handling
    return await agent.run(query, deps, full_context)
