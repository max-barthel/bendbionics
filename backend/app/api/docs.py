"""
API Documentation

This module provides comprehensive documentation for the Soft Robot Simulation API.
It includes response schemas, error codes, and usage examples.
"""

from datetime import datetime
from typing import Any, Dict, List

from pydantic import BaseModel, Field


class APIResponseSchema(BaseModel):
    """Standard API response schema for all endpoints."""

    success: bool = Field(description="Whether the request was successful")
    data: Any = Field(description="Response data (varies by endpoint)")
    message: str = Field(description="Human-readable message")
    timestamp: datetime = Field(description="Response timestamp")
    request_id: str = Field(description="Unique request identifier")


class ErrorResponseSchema(BaseModel):
    """Standard error response schema."""

    success: bool = Field(default=False, description="Always false for errors")
    error: str = Field(description="Error type/code")
    message: str = Field(description="Human-readable error message")
    details: Dict[str, Any] = Field(description="Additional error details")
    timestamp: datetime = Field(description="Error timestamp")
    request_id: str = Field(description="Unique request identifier")


class PaginatedResponseSchema(BaseModel):
    """Paginated response schema for list endpoints."""

    success: bool = Field(
        default=True, description="Whether the request was successful"
    )
    data: List[Any] = Field(description="List of items")
    pagination: Dict[str, Any] = Field(description="Pagination information")
    message: str = Field(description="Human-readable message")
    timestamp: datetime = Field(description="Response timestamp")
    request_id: str = Field(description="Unique request identifier")


# API Documentation
API_DOCUMENTATION = {
    "title": "Soft Robot Simulation API",
    "version": "1.0.0",
    "description": """
    A comprehensive API for soft robot simulation and analysis.

    ## Features
    - PCC (Piecewise Constant Curvature) robot computation
    - Tendon analysis and actuation calculations
    - User authentication and preset management
    - Real-time 3D visualization data

    ## Response Format
    All API responses follow a consistent format:

    ### Success Response
    ```json
    {
        "success": true,
        "data": { ... },
        "message": "Operation completed successfully",
        "timestamp": "2024-01-01T00:00:00Z",
        "request_id": "uuid-string"
    }
    ```

    ### Error Response
    ```json
    {
        "success": false,
        "error": "error_type",
        "message": "Human-readable error message",
        "details": { ... },
        "timestamp": "2024-01-01T00:00:00Z",
        "request_id": "uuid-string"
    }
    ```

    ## Error Types
    - `validation_error`: Input validation failed (400)
    - `authentication_error`: Authentication failed (401)
    - `authorization_error`: Access denied (403)
    - `not_found_error`: Resource not found (404)
    - `computation_error`: Computation failed (500)
    - `server_error`: Internal server error (500)
    - `network_error`: Network/connection issues
    - `unknown`: Unexpected errors

    ## Authentication
    Most endpoints require authentication using Bearer tokens.
    Include the token in the Authorization header:
    ```
    Authorization: Bearer <your-token>
    ```

    ## Rate Limiting
    API requests are rate-limited to prevent abuse.
    Rate limit headers are included in responses:
    - `X-RateLimit-Limit`: Requests per time window
    - `X-RateLimit-Remaining`: Remaining requests
    - `X-RateLimit-Reset`: Time when limit resets
    """,
    "endpoints": {
        "computation": {
            "description": "Robot computation endpoints",
            "endpoints": [
                {
                    "path": "/pcc",
                    "method": "POST",
                    "description": "Compute PCC robot configuration",
                    "request_body": {
                        "bending_angles": "List[float]",
                        "rotation_angles": "List[float]",
                        "backbone_lengths": "List[float]",
                        "coupling_lengths": "List[float]",
                        "discretization_steps": "int",
                    },
                    "response": {
                        "success": True,
                        "data": {"segments": "List[List[List[float]]]"},
                        "message": "PCC computation completed successfully",
                    },
                },
                {
                    "path": "/pcc-with-tendons",
                    "method": "POST",
                    "description": "Compute PCC with tendon analysis",
                    "request_body": {
                        "bending_angles": "List[float]",
                        "rotation_angles": "List[float]",
                        "backbone_lengths": "List[float]",
                        "coupling_lengths": "List[float]",
                        "discretization_steps": "int",
                        "tendon_config": "Dict[str, Any]",
                    },
                    "response": {
                        "success": True,
                        "data": {
                            "result": {
                                "robot_positions": "List[List[List[float]]]",
                                "coupling_data": "Dict[str, Any]",
                                "tendon_analysis": "Dict[str, Any]",
                                "actuation_commands": "Dict[str, Any]",
                            }
                        },
                        "message": "PCC with tendons computation completed successfully",
                    },
                },
            ],
        },
        "tendons": {
            "description": "Tendon analysis endpoints",
            "authentication": "Required",
            "endpoints": [
                {
                    "path": "/tendons/calculate",
                    "method": "POST",
                    "description": "Calculate tendon lengths and actuation",
                    "request_body": "PCCParams",
                    "response": {
                        "success": True,
                        "data": "TendonCalculationResult",
                        "message": "Tendon calculation completed successfully",
                    },
                },
                {
                    "path": "/tendons/analyze",
                    "method": "POST",
                    "description": "Analyze tendon configuration",
                    "request_body": "PCCParams",
                    "response": {
                        "success": True,
                        "data": {
                            "coupling_data": "Dict[str, Any]",
                            "tendon_analysis": "Dict[str, Any]",
                            "actuation_commands": "Dict[str, Any]",
                            "tendon_config": "Dict[str, Any]",
                        },
                        "message": "Tendon analysis completed successfully",
                    },
                },
            ],
        },
        "authentication": {
            "description": "User authentication endpoints",
            "endpoints": [
                {
                    "path": "/auth/register",
                    "method": "POST",
                    "description": "Register a new user",
                    "request_body": {
                        "username": "str",
                        "password": "str",
                        "email": "str (optional)",
                    },
                    "response": {
                        "success": True,
                        "data": "UserResponse",
                        "message": "User registered successfully",
                    },
                },
                {
                    "path": "/auth/login",
                    "method": "POST",
                    "description": "Login user",
                    "request_body": {"username": "str", "password": "str"},
                    "response": {
                        "success": True,
                        "data": {
                            "access_token": "str",
                            "token_type": "bearer",
                            "user": "UserResponse",
                        },
                        "message": "Login successful",
                    },
                },
                {
                    "path": "/auth/me",
                    "method": "GET",
                    "description": "Get current user info",
                    "authentication": "Required",
                    "response": {
                        "success": True,
                        "data": "UserResponse",
                        "message": "User info retrieved successfully",
                    },
                },
            ],
        },
        "presets": {
            "description": "Preset management endpoints",
            "authentication": "Required",
            "endpoints": [
                {
                    "path": "/presets/",
                    "method": "POST",
                    "description": "Create a new preset",
                    "request_body": {
                        "name": "str",
                        "description": "str",
                        "is_public": "bool",
                        "configuration": "Dict[str, Any]",
                    },
                    "response": {
                        "success": True,
                        "data": "PresetResponse",
                        "message": "Preset created successfully",
                    },
                },
                {
                    "path": "/presets/",
                    "method": "GET",
                    "description": "Get user's presets",
                    "response": {
                        "success": True,
                        "data": "List[PresetResponse]",
                        "message": "User presets retrieved successfully",
                    },
                },
                {
                    "path": "/presets/public",
                    "method": "GET",
                    "description": "Get public presets",
                    "response": {
                        "success": True,
                        "data": "List[PresetResponse]",
                        "message": "Public presets retrieved successfully",
                    },
                },
                {
                    "path": "/presets/{preset_id}",
                    "method": "GET",
                    "description": "Get specific preset",
                    "response": {
                        "success": True,
                        "data": "PresetResponse",
                        "message": "Preset retrieved successfully",
                    },
                },
                {
                    "path": "/presets/{preset_id}",
                    "method": "PUT",
                    "description": "Update preset",
                    "request_body": "PresetUpdate",
                    "response": {
                        "success": True,
                        "data": "PresetResponse",
                        "message": "Preset updated successfully",
                    },
                },
                {
                    "path": "/presets/{preset_id}",
                    "method": "DELETE",
                    "description": "Delete preset",
                    "response": {
                        "success": True,
                        "data": {"deleted_id": "int"},
                        "message": "Preset deleted successfully",
                    },
                },
            ],
        },
    },
    "examples": {
        "pcc_computation": {
            "request": {
                "bending_angles": [0.628, 0.628, 0.628, 0.628, 0.628],
                "rotation_angles": [0, 0, 0, 0, 0],
                "backbone_lengths": [0.07, 0.07, 0.07, 0.07, 0.07],
                "coupling_lengths": [0.03, 0.03, 0.03, 0.03, 0.03, 0.03],
                "discretization_steps": 1000,
            },
            "response": {
                "success": True,
                "data": {
                    "segments": [
                        [[0.0, 0.0, 0.0], [0.01, 0.0, 0.0], ...],
                        [[0.01, 0.0, 0.0], [0.02, 0.0, 0.0], ...],
                        ...,
                    ]
                },
                "message": "PCC computation completed successfully",
                "timestamp": "2024-01-01T00:00:00Z",
                "request_id": "123e4567-e89b-12d3-a456-426614174000",
            },
        },
        "error_response": {
            "request": {"bending_angles": "invalid_data"},
            "response": {
                "success": False,
                "error": "validation_error",
                "message": "Invalid parameters provided. Please check your input values.",
                "details": {
                    "field": "bending_angles",
                    "error": "Expected list of numbers",
                },
                "timestamp": "2024-01-01T00:00:00Z",
                "request_id": "123e4567-e89b-12d3-a456-426614174000",
            },
        },
    },
}
