"""
Unified API Response System

This module provides consistent response formats across all API endpoints.
It standardizes success responses, error handling, and data serialization.
"""

from datetime import UTC, datetime
from typing import Any, Dict, Generic, List, Optional, TypeVar

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.utils.serialization import convert_numpy_to_serializable

# Generic type for response data
T = TypeVar("T")

# Constants
REQUEST_ID_DESCRIPTION = "Unique request identifier"


class APIResponse(BaseModel, Generic[T]):
    """Standard API response format for all endpoints."""

    success: bool = Field(description="Whether the request was successful")
    data: Optional[T] = Field(default=None, description="Response data")
    message: Optional[str] = Field(default=None, description="Human-readable message")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Response timestamp",
    )
    request_id: Optional[str] = Field(default=None, description=REQUEST_ID_DESCRIPTION)


class ErrorResponse(BaseModel):
    """Standard error response format."""

    success: bool = Field(default=False, description="Always false for errors")
    error: str = Field(description="Error type/code")
    message: str = Field(description="Human-readable error message")
    details: Optional[Dict[str, Any]] = Field(
        default=None, description="Additional error details"
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(UTC), description="Error timestamp"
    )
    request_id: Optional[str] = Field(default=None, description=REQUEST_ID_DESCRIPTION)


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response format for list endpoints."""

    success: bool = Field(
        default=True, description="Whether the request was successful"
    )
    data: List[T] = Field(description="List of items")
    pagination: Dict[str, Any] = Field(description="Pagination information")
    message: Optional[str] = Field(default=None, description="Human-readable message")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Response timestamp",
    )
    request_id: Optional[str] = Field(default=None, description=REQUEST_ID_DESCRIPTION)


# Helper function to extract request_id from Request or string
def get_request_id(request_or_id: Optional[Request | str] = None) -> Optional[str]:
    """Extract request_id from Request object or return string if provided."""
    if request_or_id is None:
        return None
    if isinstance(request_or_id, Request):
        return getattr(request_or_id.state, "request_id", None)
    return request_or_id


def serialize_response_data(data: Any) -> Any:
    """Serialize response data, handling Pydantic models and numpy arrays.

    Args:
        data: Data to serialize (can be Pydantic model, dict, list,
            numpy array, or primitive)

    Returns:
        Serialized data ready for JSON response
    """
    if data is None:
        return None

    # Handle Pydantic models first - convert to dict then serialize numpy arrays
    if isinstance(data, BaseModel):
        # Convert Pydantic model to dict, then serialize any numpy arrays within
        return convert_numpy_to_serializable(data.model_dump(mode="json"))

    # Delegate numpy array and nested structure handling to
    # convert_numpy_to_serializable
    # This handles numpy arrays, scalars, lists, tuples, and dicts recursively
    return convert_numpy_to_serializable(data)


# Response helper functions
def success_response(
    data: Any = None,
    message: str = "Request completed successfully",
    request: Optional[Request | str] = None,
) -> JSONResponse:
    """Create a standardized success response.

    Args:
        data: Response data (automatically serialized if Pydantic model)
        message: Human-readable message
        request: Request object or request_id string to extract ID from
    """

    request_id = get_request_id(request)
    serialized_data = serialize_response_data(data)
    response = APIResponse(
        success=True, data=serialized_data, message=message, request_id=request_id
    )

    return JSONResponse(status_code=200, content=response.model_dump(mode="json"))


def created_response(
    data: Any = None,
    message: str = "Resource created successfully",
    request: Optional[Request | str] = None,
) -> JSONResponse:
    """Create a standardized created response.

    Args:
        data: Response data (automatically serialized if Pydantic model)
        message: Human-readable message
        request: Request object or request_id string to extract ID from
    """

    request_id = get_request_id(request)
    serialized_data = serialize_response_data(data)
    response = APIResponse(
        success=True, data=serialized_data, message=message, request_id=request_id
    )

    return JSONResponse(status_code=201, content=response.model_dump(mode="json"))


def error_response(
    error_type: str,
    message: str,
    status_code: int = 400,
    details: Optional[Dict[str, Any]] = None,
    request: Optional[Request | str] = None,
) -> JSONResponse:
    """Create a standardized error response.

    Args:
        error_type: Error type/code
        message: Human-readable error message
        status_code: HTTP status code
        details: Additional error details
        request: Request object or request_id string to extract ID from
    """

    request_id = get_request_id(request)
    response = ErrorResponse(
        error=error_type,
        message=message,
        details=details,
        request_id=request_id,
    )

    # Convert to dict with proper datetime serialization
    content = response.model_dump(by_alias=True, exclude_none=True, mode="json")
    return JSONResponse(
        status_code=status_code, content=content, media_type="application/json"
    )


def paginated_response(
    data: List[Any],
    page: int = 1,
    per_page: int = 10,
    total: Optional[int] = None,
    message: Optional[str] = None,
    request: Optional[Request | str] = None,
) -> JSONResponse:
    """Create a standardized paginated response.

    Args:
        data: List of items (automatically serialized if Pydantic models)
        page: Current page number
        per_page: Items per page
        total: Total number of items
        message: Human-readable message
        request: Request object or request_id string to extract ID from
    """

    request_id = get_request_id(request)
    if total is None:
        total = len(data)

    serialized_data = serialize_response_data(data)
    pagination = {
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": (total + per_page - 1) // per_page,
        "has_next": page * per_page < total,
        "has_prev": page > 1,
    }

    response = PaginatedResponse(
        data=serialized_data,
        pagination=pagination,
        message=message,
        request_id=request_id,
    )

    return JSONResponse(status_code=200, content=response.model_dump(mode="json"))


# Exception classes for consistent error handling
class APIException(HTTPException):
    """Base API exception with standardized error format."""

    def __init__(
        self,
        error_type: str,
        message: str,
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.error_type = error_type
        self.details = details
        super().__init__(status_code=status_code, detail=message)


class ValidationError(APIException):
    """Validation error exception."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            error_type="validation_error",
            message=message,
            status_code=400,
            details=details,
        )


class AuthenticationError(APIException):
    """Authentication error exception."""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            error_type="authentication_error", message=message, status_code=401
        )


class AuthorizationError(APIException):
    """Authorization error exception."""

    def __init__(self, message: str = "Access denied"):
        super().__init__(
            error_type="authorization_error", message=message, status_code=403
        )


class NotFoundError(APIException):
    """Resource not found error exception."""

    def __init__(self, message: str = "Resource not found"):
        super().__init__(error_type="not_found_error", message=message, status_code=404)


class ServerError(APIException):
    """Internal server error exception."""

    def __init__(
        self,
        message: str = "Internal server error",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            error_type="server_error",
            message=message,
            status_code=500,
            details=details,
        )


class ComputationError(APIException):
    """Computation error exception."""

    def __init__(
        self,
        message: str = "Computation failed",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            error_type="computation_error",
            message=message,
            status_code=500,
            details=details,
        )
