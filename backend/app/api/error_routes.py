"""
API routes for client-side error tracking.

This module provides endpoints for receiving and logging client-side errors
from the frontend application.
"""

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.api.responses import success_response
from app.utils.logging import LogContext, default_logger

router = APIRouter(prefix="/api/errors", tags=["errors"])


class ErrorReport(BaseModel):
    """Error report from client-side error boundary."""

    errorId: str = Field(..., description="Unique error identifier")
    error: dict = Field(..., description="Error details (name, message, stack)")
    errorInfo: dict = Field(default_factory=dict, description="React error info")
    context: dict = Field(..., description="Context information (userAgent, url, etc.)")


@router.post("")
async def report_error(error_report: ErrorReport, request: Request):
    """
    Receive and log client-side errors from the frontend.

    This endpoint accepts error reports from the React ErrorBoundary component
    and logs them for debugging purposes. It always returns success to avoid
    breaking the error reporting flow.
    """
    try:
        # Extract context information
        error_name = error_report.error.get("name", "UnknownError")
        error_message = error_report.error.get("message", "No message")
        error_stack = error_report.error.get("stack", "")
        component_stack = error_report.errorInfo.get("componentStack", "")

        context = error_report.context
        user_agent = context.get("userAgent", "Unknown")
        url = context.get("url", "Unknown")
        timestamp = context.get("timestamp", "")
        retry_count = context.get("retryCount", 0)

        # Log the error with full context
        default_logger.error(
            LogContext.API,
            f"Client-side error: {error_name} - {error_message}",
            {
                "error_id": error_report.errorId,
                "error_name": error_name,
                "error_message": error_message,
                "error_stack": error_stack,
                "component_stack": component_stack,
                "user_agent": user_agent,
                "url": url,
                "timestamp": timestamp,
                "retry_count": retry_count,
                "request_id": getattr(request.state, "request_id", None),
            },
            "API",
            "client_error",
        )
    except Exception as e:
        # Even if logging fails, don't break the error reporting flow
        # Log the logging failure separately
        error_id = (
            error_report.errorId if hasattr(error_report, "errorId") else "unknown"
        )
        default_logger.error(
            LogContext.API,
            f"Failed to log client error report: {str(e)}",
            {
                "error_id": error_id,
                "request_id": getattr(request.state, "request_id", None),
            },
            "API",
            "error_logging_failure",
        )

    # Always return success to avoid breaking error reporting
    return success_response(
        data={"errorId": error_report.errorId},
        message="Error report received",
        request=request,
    )
