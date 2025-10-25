"""
Unified API Middleware

This module provides middleware for consistent error handling, logging,
and request/response processing across all API endpoints.
"""

import traceback
import uuid
from typing import Callable

from fastapi import HTTPException, Request, Response

# JSONResponse imported in responses.py
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.responses import APIException, error_response
from app.utils.logging import logger


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware to add unique request IDs to all requests."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Add request ID to response headers
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id

        return response


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware for unified error handling across all endpoints."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)

        except APIException as e:
            # Handle our custom API exceptions
            logger.error(
                f"API Error: {e.error_type} - {e.detail}",
                extra={
                    "request_id": getattr(request.state, "request_id", None),
                    "error_type": e.error_type,
                    "details": e.details,
                    "status_code": e.status_code,
                },
            )

            return error_response(
                error_type=e.error_type,
                message=str(e.detail),
                status_code=e.status_code,
                details=e.details,
                request_id=getattr(request.state, "request_id", None),
            )

        except HTTPException as e:
            # Handle FastAPI HTTP exceptions
            logger.error(
                f"HTTP Error: {e.status_code} - {e.detail}",
                extra={
                    "request_id": getattr(request.state, "request_id", None),
                    "status_code": e.status_code,
                },
            )

            return error_response(
                error_type="http_error",
                message=str(e.detail),
                status_code=e.status_code,
                request_id=getattr(request.state, "request_id", None),
            )

        except Exception as e:
            # Handle unexpected errors
            logger.error(
                f"Unexpected error: {str(e)}",
                extra={
                    "request_id": getattr(request.state, "request_id", None),
                    "traceback": traceback.format_exc(),
                },
            )

            return error_response(
                error_type="internal_error",
                message="An unexpected error occurred. Please try again later.",
                status_code=500,
                details=(
                    {"error": str(e)} if logger.level <= 10 else None
                ),  # Only in debug mode
                request_id=getattr(request.state, "request_id", None),
            )


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for request/response logging."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Log request
        logger.info(
            f"Request: {request.method} {request.url.path}",
            extra={
                "request_id": getattr(request.state, "request_id", None),
                "method": request.method,
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "client_ip": request.client.host if request.client else None,
            },
        )

        # Process request
        response = await call_next(request)

        # Log response
        logger.info(
            f"Response: {response.status_code}",
            extra={
                "request_id": getattr(request.state, "request_id", None),
                "status_code": response.status_code,
                "response_size": response.headers.get("content-length", "unknown"),
            },
        )

        return response


class CORSMiddleware(BaseHTTPMiddleware):
    """Enhanced CORS middleware with proper headers."""

    def __init__(
        self,
        app,
        allow_origins: list | None = None,
        allow_methods: list | None = None,
        allow_headers: list | None = None,
    ):
        super().__init__(app)
        self.allow_origins = allow_origins or ["*"]
        self.allow_methods = allow_methods or [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS",
        ]
        self.allow_headers = allow_headers or ["*"]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Determine the appropriate origin
        origin = request.headers.get("origin")
        allow_origin = "*"
        
        if origin and "*" not in self.allow_origins:
            # If specific origins are configured, check if request origin is allowed
            if origin in self.allow_origins:
                allow_origin = origin
            else:
                # Origin not allowed, use first configured origin as fallback
                allow_origin = self.allow_origins[0] if self.allow_origins else "*"
        elif self.allow_origins and "*" not in self.allow_origins:
            # No origin header but specific origins configured
            allow_origin = self.allow_origins[0]

        # Handle preflight requests
        if request.method == "OPTIONS":
            response = Response()
            response.headers["Access-Control-Allow-Origin"] = allow_origin
            response.headers["Access-Control-Allow-Methods"] = ", ".join(
                self.allow_methods
            )
            response.headers["Access-Control-Allow-Headers"] = ", ".join(
                self.allow_headers
            )
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Max-Age"] = "86400"  # 24 hours
            return response

        # Process request
        response = await call_next(request)

        # Add CORS headers to response
        response.headers["Access-Control-Allow-Origin"] = allow_origin
        response.headers["Access-Control-Allow-Methods"] = ", ".join(self.allow_methods)
        response.headers["Access-Control-Allow-Headers"] = ", ".join(self.allow_headers)
        response.headers["Access-Control-Allow-Credentials"] = "true"

        return response
