"""
Generated Pydantic models from JSON Schema
Generated at: 2026-03-18T12:10:23.831693
@generated DO NOT EDIT MANUALLY
"""

from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field


from pydantic import BaseModel, Field


class ApiResponse(BaseModel):
    """
    ApiResponse
    
    @generated Generated from JSON Schema - DO NOT EDIT MANUALLY
    """

    success: bool = Field(..., description="Whether the operation was successful")
    message: Optional[str] = Field(None, description="Human-readable message")
    data: Optional[Any] = Field(None, description="Response data payload")
    error: Optional[str] = Field(None, description="Error message if failed")
    code: Optional[str] = Field(None, description="Error code if failed")


from pydantic import BaseModel, Field


class TransactionResult(BaseModel):
    """
    TransactionResult
    
    @generated Generated from JSON Schema - DO NOT EDIT MANUALLY
    """

    success: bool = Field(..., description="Whether the transaction was successful")
    data: Optional[Any] = Field(None, description="Transaction data")
    error: Optional[str] = Field(None, description="Error message if failed")


from typing import List
from pydantic import BaseModel, Field


class PaginatedResponse(BaseModel):
    """
    PaginatedResponse
    
    @generated Generated from JSON Schema - DO NOT EDIT MANUALLY
    """

    data: List[Any] = Field(..., description="Array of data items")
    pagination: object
