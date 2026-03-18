"""
Generated Pydantic models from JSON Schema
Generated at: 2026-03-18T12:10:23.830152
@generated DO NOT EDIT MANUALLY
"""

from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field


from typing import Literal
from pydantic import BaseModel, Field


class ApiError(BaseModel):
    """
    ApiError
    
    @generated Generated from JSON Schema - DO NOT EDIT MANUALLY
    """

    code: Literal["VALIDATION_ERROR", "NOT_FOUND", "UNAUTHORIZED", "FORBIDDEN", "CONFLICT", "INSUFFICIENT_FUNDS", "RATE_LIMIT_EXCEEDED", "INTERNAL_ERROR", "SERVICE_UNAVAILABLE", "BAD_REQUEST", "TIMEOUT", "COMPLIANCE_VIOLATION"] = Field(..., description="Error code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    field: Optional[str] = Field(None, description="Field that caused the error (for validation errors)")
    timestamp: Optional[str] = Field(None, description="Error timestamp")


from pydantic import BaseModel, Field


class ValidationError(BaseModel):
    """
    ValidationError
    
    @generated Generated from JSON Schema - DO NOT EDIT MANUALLY
    """

    code: Literal["VALIDATION_ERROR"] = Field(..., description="Validation error code")
    message: str = Field(..., description="Validation error message")
    field: str = Field(..., description="Field that failed validation")
    constraint: Optional[str] = Field(None, description="Validation constraint that was violated")


from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """
    ErrorResponse
    
    @generated Generated from JSON Schema - DO NOT EDIT MANUALLY
    """

    success: Literal["False"] = Field(..., description="Always false for error responses")
    error: Any
