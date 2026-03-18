"""
Configuration module for Smartpay AI Backend.

Contains:
- Audit logging configuration
- Security settings
- Environment-specific configs
"""

from .logging import AuditLogger, get_audit_logger

__all__ = ["AuditLogger", "get_audit_logger"]
