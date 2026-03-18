"""
Compliance module for Smartpay Python backend.

Implements Bank of Namibia (BoN) regulatory compliance:
- PSD-1: E-Money transaction limits
- PSD-6: Penalty tracking and violation logging
- PSD-11: Interchange fee awareness
- PSD-12: Cybersecurity standards and KRI thresholds
- FIA: Financial Intelligence Act (AML/CTR/STR)
"""

from .validator import ComplianceValidator
from .config_sync import ConfigSync

__all__ = ["ComplianceValidator", "ConfigSync"]
