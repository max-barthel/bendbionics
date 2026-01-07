"""
Unified API Middleware

This module provides middleware for consistent error handling, logging,
and request/response processing across all API endpoints.
"""

import traceback
import uuid
from typing import Callable, Optional

from fastapi import HTTPException, Request, Response

# JSONResponse imported in responses.py
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.responses import APIException, error_response
from app.utils.logging import LogContext, default_logger


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
            default_logger.error(
                LogContext.API,
                f"API Error: {e.error_type} - {e.detail}",
                {
                    "request_id": getattr(request.state, "request_id", None),
                    "error_type": e.error_type,
                    "details": e.details,
                    "status_code": e.status_code,
                },
                "API",
                "api_error",
            )

            return error_response(
                error_type=e.error_type,
                message=str(e.detail),
                status_code=e.status_code,
                details=e.details,
                request=request,
            )

        except HTTPException as e:
            # Handle FastAPI HTTP exceptions
            default_logger.error(
                LogContext.API,
                f"HTTP Error: {e.status_code} - {e.detail}",
                {
                    "request_id": getattr(request.state, "request_id", None),
                    "status_code": e.status_code,
                },
                "API",
                "http_error",
            )

            return error_response(
                error_type="http_error",
                message=str(e.detail),
                status_code=e.status_code,
                request=request,
            )

        except Exception as e:
            # Handle unexpected errors
            default_logger.error(
                LogContext.API,
                f"Unexpected error: {str(e)}",
                {
                    "request_id": getattr(request.state, "request_id", None),
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "traceback": traceback.format_exc(),
                },
                "API",
                "unexpected_error",
            )

            return error_response(
                error_type="internal_error",
                message="An unexpected error occurred. Please try again later.",
                status_code=500,
                details=(
                    {"error": str(e)} if default_logger.logger.level <= 10 else None
                ),  # Only in debug mode
                request=request,
            )


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for request/response logging with path exclusions."""

    def __init__(
        self,
        app,
        exclude_paths: Optional[list] = None,
    ):
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/health",
            "/metrics",
            "/docs",
            "/openapi.json",
            "/redoc",
        ]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip logging for excluded paths
        if request.url.path in self.exclude_paths:
            return await call_next(request)

        request_id = getattr(request.state, "request_id", None)

        # Log request
        default_logger.info(
            LogContext.API,
            f"Request: {request.method} {request.url.path}",
            {
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "client_ip": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
            },
            "API",
            "request",
        )

        # Process request
        response = await call_next(request)

        # Log response
        if response.status_code >= 500:
            log_level = "error"
        elif response.status_code >= 400:
            log_level = "warning"
        else:
            log_level = "info"

        getattr(default_logger, log_level)(
            LogContext.API,
            f"Response: {request.method} {request.url.path} - {response.status_code}",
            {
                "request_id": request_id,
                "status_code": response.status_code,
                "response_size": response.headers.get("content-length", "unknown"),
            },
            "API",
            "response",
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
            response.headers["Access-Control-Allow-Methods"] = ", ".join(self.allow_methods)
            response.headers["Access-Control-Allow-Headers"] = ", ".join(self.allow_headers)
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
