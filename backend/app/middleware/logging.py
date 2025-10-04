"""
FastAPI middleware for request/response logging and monitoring
"""

import time
import uuid
from typing import Callable, Optional

from app.utils.logger import (
    LogContext,
    default_logger,
    request_id_var,
    session_id_var,
    user_id_var,
)
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging HTTP requests and responses"""

    def __init__(
        self,
        app: ASGIApp,
        log_requests: bool = True,
        log_responses: bool = True,
        log_request_body: bool = False,
        log_response_body: bool = False,
        exclude_paths: Optional[list] = None,
        max_body_size: int = 1024,  # Max size to log in bytes
    ):
        super().__init__(app)
        self.log_requests = log_requests
        self.log_responses = log_responses
        self.log_request_body = log_request_body
        self.log_response_body = log_response_body
        self.exclude_paths = exclude_paths or [
            "/health",
            "/metrics",
            "/docs",
            "/openapi.json",
        ]
        self.max_body_size = max_body_size

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip logging for excluded paths
        if request.url.path in self.exclude_paths:
            return await call_next(request)

        # Generate request ID
        request_id = str(uuid.uuid4())
        request_id_var.set(request_id)

        # Extract user information from request
        user_id = None
        session_id = None

        # Try to get user ID from Authorization header or JWT token
        auth_header = request.headers.get("authorization")
        if auth_header:
            # Extract user ID from JWT token (simplified)
            try:
                # This is a simplified example - in real implementation,
                # you would decode the JWT token properly
                if auth_header.startswith("Bearer "):
                    # token = auth_header.split(" ")[1]
                    # Decode JWT and extract user_id
                    # user_id = decode_jwt_token(token).get("user_id")
                    pass
            except Exception:
                pass

        # Try to get session ID from cookies
        session_id = request.cookies.get("session_id")

        # Set context variables
        user_id_var.set(user_id)
        session_id_var.set(session_id)

        # Log request
        if self.log_requests:
            await self._log_request(request, request_id, user_id, session_id)

        # Process request
        start_time = time.time()

        try:
            response = await call_next(request)
            duration = time.time() - start_time

            # Log response
            if self.log_responses:
                await self._log_response(
                    request, response, duration, request_id, user_id
                )

            return response

        except Exception as e:
            duration = time.time() - start_time

            # Log error
            default_logger.error(
                LogContext.API,
                f"Request failed: {request.method} {request.url.path}",
                {
                    "request_id": request_id,
                    "user_id": user_id,
                    "session_id": session_id,
                    "duration": duration,
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
                "API",
                "request_error",
            )

            # Return error response
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal server error",
                    "request_id": request_id,
                    "message": "An unexpected error occurred",
                },
            )

        finally:
            # Clear context variables
            request_id_var.set(None)
            user_id_var.set(None)
            session_id_var.set(None)

    async def _log_request(
        self,
        request: Request,
        request_id: str,
        user_id: Optional[str],
        session_id: Optional[str],
    ):
        """Log incoming request"""

        # Prepare request data
        request_data = {
            "request_id": request_id,
            "method": request.method,
            "url": str(request.url),
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "headers": dict(request.headers),
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
        }

        if user_id:
            request_data["user_id"] = user_id
        if session_id:
            request_data["session_id"] = session_id

        # Log request body if enabled and size is within limit
        if self.log_request_body:
            try:
                body = await request.body()
                if len(body) <= self.max_body_size:
                    try:
                        import json

                        request_data["body"] = json.loads(body.decode())
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        request_data["body"] = body.decode(errors="replace")
                else:
                    request_data["body"] = f"<body too large: {len(body)} bytes>"
            except Exception as e:
                request_data["body_error"] = str(e)

        default_logger.info(
            LogContext.API,
            f"Request: {request.method} {request.url.path}",
            request_data,
            "API",
            "request",
        )

    async def _log_response(
        self,
        request: Request,
        response: Response,
        duration: float,
        request_id: str,
        user_id: Optional[str],
    ):
        """Log outgoing response"""

        # Prepare response data
        response_data = {
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration": duration,
            "headers": dict(response.headers),
        }

        if user_id:
            response_data["user_id"] = user_id

        # Add response body if enabled
        if self.log_response_body:
            self._add_response_body(response, response_data)

        # Log using appropriate level
        self._log_response_by_status(request, response, response_data)

    def _add_response_body(self, response: Response, response_data: dict):
        """Add response body to log data"""
        if not hasattr(response, "body"):
            return

        try:
            body = response.body
            if len(body) <= self.max_body_size:
                try:
                    import json

                    response_data["body"] = json.loads(body.decode())
                except (json.JSONDecodeError, UnicodeDecodeError):
                    response_data["body"] = body.decode(errors="replace")
            else:
                response_data["body"] = f"<body too large: {len(body)} bytes>"
        except Exception as e:
            response_data["body_error"] = str(e)

    def _log_response_by_status(
        self, request: Request, response: Response, response_data: dict
    ):
        """Log response using appropriate level based on status code"""
        message = (
            f"Response: {request.method} {request.url.path} - {response.status_code}"
        )

        if response.status_code >= 500:
            default_logger.error(
                LogContext.API, message, response_data, "API", "response"
            )
        elif response.status_code >= 400:
            default_logger.warning(
                LogContext.API, message, response_data, "API", "response"
            )
        else:
            default_logger.info(
                LogContext.API, message, response_data, "API", "response"
            )


class PerformanceMiddleware(BaseHTTPMiddleware):
    """Middleware for performance monitoring"""

    def __init__(
        self,
        app: ASGIApp,
        slow_request_threshold: float = 1.0,  # seconds
        log_slow_requests: bool = True,
    ):
        super().__init__(app)
        self.slow_request_threshold = slow_request_threshold
        self.log_slow_requests = log_slow_requests

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()

        response = await call_next(request)

        duration = time.time() - start_time

        # Log slow requests
        if self.log_slow_requests and duration > self.slow_request_threshold:
            default_logger.warning(
                LogContext.PERFORMANCE,
                f"Slow request detected: {request.method} {request.url.path}",
                {
                    "method": request.method,
                    "path": request.url.path,
                    "duration": duration,
                    "threshold": self.slow_request_threshold,
                    "request_id": request_id_var.get(),
                    "user_id": user_id_var.get(),
                },
                "Performance",
                "slow_request",
            )

        # Add performance headers
        response.headers["X-Response-Time"] = str(duration)
        response.headers["X-Request-ID"] = request_id_var.get() or ""

        return response


class SecurityMiddleware(BaseHTTPMiddleware):
    """Middleware for security monitoring"""

    def __init__(
        self,
        app: ASGIApp,
        log_suspicious_requests: bool = True,
        rate_limit_requests: bool = True,
        max_requests_per_minute: int = 100,
    ):
        super().__init__(app)
        self.log_suspicious_requests = log_suspicious_requests
        self.rate_limit_requests = rate_limit_requests
        self.max_requests_per_minute = max_requests_per_minute
        self.request_counts = {}  # In production, use Redis or similar

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()

        # Rate limiting
        if self.rate_limit_requests:
            if await self._is_rate_limited(client_ip, current_time):
                default_logger.security_event(
                    "rate_limit_exceeded",
                    f"Rate limit exceeded for IP: {client_ip}",
                    {
                        "client_ip": client_ip,
                        "path": request.url.path,
                        "user_agent": request.headers.get("user-agent"),
                    },
                )

                return JSONResponse(
                    status_code=429,
                    content={
                        "error": "Rate limit exceeded",
                        "retry_after": 60,
                    },
                )

        # Check for suspicious patterns
        if self.log_suspicious_requests:
            await self._check_suspicious_patterns(request, client_ip)

        response = await call_next(request)

        # Log security events based on response
        if response.status_code == 401:
            default_logger.security_event(
                "unauthorized_access",
                f"Unauthorized access attempt: {request.method} {request.url.path}",
                {
                    "client_ip": client_ip,
                    "path": request.url.path,
                    "user_agent": request.headers.get("user-agent"),
                    "request_id": request_id_var.get(),
                },
            )
        elif response.status_code == 403:
            default_logger.security_event(
                "forbidden_access",
                f"Forbidden access attempt: {request.method} {request.url.path}",
                {
                    "client_ip": client_ip,
                    "path": request.url.path,
                    "user_agent": request.headers.get("user-agent"),
                    "request_id": request_id_var.get(),
                },
            )

        return response

    async def _is_rate_limited(self, client_ip: str, current_time: float) -> bool:
        """Check if client is rate limited"""
        minute = int(current_time // 60)
        key = f"{client_ip}:{minute}"

        if key not in self.request_counts:
            self.request_counts[key] = 0

        self.request_counts[key] += 1

        # Clean up old entries
        old_minutes = [
            k for k in self.request_counts if int(k.split(":")[1]) < minute - 1
        ]
        for old_key in old_minutes:
            del self.request_counts[old_key]

        return self.request_counts[key] > self.max_requests_per_minute

    async def _check_suspicious_patterns(self, request: Request, client_ip: str):
        """Check for suspicious request patterns"""
        path = request.url.path.lower()
        user_agent = request.headers.get("user-agent", "").lower()

        # Check for common attack patterns
        suspicious_patterns = [
            "..",  # Path traversal
            "script",  # XSS attempts
            "union",  # SQL injection
            "select",  # SQL injection
            "drop",  # SQL injection
            "delete",  # SQL injection
            "insert",  # SQL injection
            "update",  # SQL injection
            "exec",  # Command injection
            "eval",  # Code injection
        ]

        for pattern in suspicious_patterns:
            if pattern in path or pattern in user_agent:
                default_logger.security_event(
                    "suspicious_pattern",
                    f"Suspicious pattern detected: {pattern}",
                    {
                        "client_ip": client_ip,
                        "path": request.url.path,
                        "user_agent": request.headers.get("user-agent"),
                        "pattern": pattern,
                        "request_id": request_id_var.get(),
                    },
                )
                break
