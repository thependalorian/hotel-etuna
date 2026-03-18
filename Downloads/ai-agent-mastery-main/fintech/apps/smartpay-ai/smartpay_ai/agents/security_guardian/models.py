"""
Pydantic models for the Security Guardian agent.

Location: backend_python/smartpay_ai/agents/security_guardian/models.py
Purpose: Input/output schemas for security assessment.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SecurityAlert(BaseModel):
    """Security alert or warning."""
    alert_type: str  # "fraud", "suspicious", "unusual", "limit", "breach"
    severity: str = "medium"  # "low", "medium", "high", "critical"
    title: str
    description: str
    recommended_action: str
    details: Optional[Dict[str, Any]] = None


class RiskFactor(BaseModel):
    """Individual risk factor contribution."""
    factor: str  # "transaction_velocity", "amount", "recipient", "location", "device"
    weight: float  # 0.0 to 1.0
    description: str
    is_flagged: bool = False


class SecurityRecommendation(BaseModel):
    """Security improvement recommendation."""
    category: str  # "authentication", "monitoring", "behavior", "device", "education"
    title: str
    description: str
    impact: str = "medium"  # "low", "medium", "high"
    effort: str = "medium"  # "low", "medium", "high"
    priority: int = 2  # 1 (highest) to 5 (lowest)


class SecurityAssessmentRequest(BaseModel):
    """Input for security assessment."""
    query: str
    user_id: str
    transaction_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class SecurityAssessmentResponse(BaseModel):
    """Output from security assessment."""
    summary: str
    risk_score: float  # 0.0 (safe) to 1.0 (high risk)
    risk_level: str  # "low", "medium", "high", "critical"
    is_safe: bool = True
    alerts: List[SecurityAlert] = Field(default_factory=list)
    risk_factors: List[RiskFactor] = Field(default_factory=list)
    recommendations: List[SecurityRecommendation] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)
