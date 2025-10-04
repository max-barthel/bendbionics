"""
Error tracking and reporting utilities for the Soft Robot App
"""

import asyncio
import traceback
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional

import aiohttp  # type: ignore[import-untyped]
from fastapi import HTTPException

from app.utils.logger import (
    LogContext,
    default_logger,
    request_id_var,
    session_id_var,
    user_id_var,
)
from app.utils.timezone import now_utc


class ErrorSeverity(Enum):
    """Error severity levels"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ErrorCategory(Enum):
    """Error categories"""

    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    VALIDATION = "validation"
    DATABASE = "database"
    EXTERNAL_API = "external_api"
    INTERNAL = "internal"
    PERFORMANCE = "performance"
    SECURITY = "security"
    USER_INPUT = "user_input"
    SYSTEM = "system"


@dataclass
class ErrorReport:
    """Error report data structure"""

    error_id: str
    timestamp: datetime
    severity: ErrorSeverity
    category: ErrorCategory
    error_type: str
    error_message: str
    stack_trace: Optional[str]
    context: Dict[str, Any]
    request_id: Optional[str]
    user_id: Optional[str]
    session_id: Optional[str]
    component: Optional[str]
    action: Optional[str]
    environment: str
    version: str
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    notes: Optional[str] = None


class ErrorTracker:
    """Error tracking and reporting system"""

    def __init__(
        self,
        enable_remote_reporting: bool = True,
        remote_endpoint: Optional[str] = None,
        enable_local_storage: bool = True,
        max_local_errors: int = 1000,
        enable_email_alerts: bool = False,
        email_recipients: Optional[List[str]] = None,
        critical_error_threshold: int = 5,  # Alert after 5 critical errors
        alert_time_window: int = 300,  # 5 minutes
    ):
        self.enable_remote_reporting = enable_remote_reporting
        self.remote_endpoint = remote_endpoint
        self.enable_local_storage = enable_local_storage
        self.max_local_errors = max_local_errors
        self.enable_email_alerts = enable_email_alerts
        self.email_recipients = email_recipients or []
        self.critical_error_threshold = critical_error_threshold
        self.alert_time_window = alert_time_window

        self.error_counts = {}  # Track error counts for alerting
        self.local_errors: List[ErrorReport] = []

        # Load existing errors from local storage
        if self.enable_local_storage:
            self._load_local_errors()

    def _load_local_errors(self):
        """Load errors from local storage"""
        try:
            # In a real implementation, this would load from a database
            # For now, we'll use a simple in-memory storage
            pass
        except Exception as e:
            default_logger.error(
                LogContext.ERROR,
                "Failed to load local errors",
                {"error": str(e)},
                "ErrorTracker",
                "_load_local_errors",
                exception=e,
            )

    def _save_local_errors(self):
        """Save errors to local storage"""
        try:
            # In a real implementation, this would save to a database
            # For now, we'll use a simple in-memory storage
            pass
        except Exception as e:
            default_logger.error(
                LogContext.ERROR,
                "Failed to save local errors",
                {"error": str(e)},
                "ErrorTracker",
                "_save_local_errors",
                exception=e,
            )

    def _determine_severity(
        self, error: Exception, category: ErrorCategory
    ) -> ErrorSeverity:
        """Determine error severity based on error type and category"""

        # Critical errors
        if isinstance(error, (SystemExit, KeyboardInterrupt)):
            return ErrorSeverity.CRITICAL

        # High severity errors
        if isinstance(error, (MemoryError, OSError, ConnectionError)):
            return ErrorSeverity.HIGH

        if category in [ErrorCategory.SECURITY, ErrorCategory.SYSTEM]:
            return ErrorSeverity.HIGH

        # Medium severity errors
        if isinstance(error, (ValueError, TypeError, AttributeError)):
            return ErrorSeverity.MEDIUM

        if category in [ErrorCategory.DATABASE, ErrorCategory.EXTERNAL_API]:
            return ErrorSeverity.MEDIUM

        # Low severity errors
        if isinstance(error, (HTTPException,)):
            return ErrorSeverity.LOW

        if category in [ErrorCategory.USER_INPUT, ErrorCategory.VALIDATION]:
            return ErrorSeverity.LOW

        return ErrorSeverity.MEDIUM

    def _determine_category(
        self, error: Exception, context: Dict[str, Any]
    ) -> ErrorCategory:
        """Determine error category based on error type and context"""

        # Check context for hints
        if "auth" in str(context).lower() or "login" in str(context).lower():
            return ErrorCategory.AUTHENTICATION

        if "permission" in str(context).lower() or "access" in str(context).lower():
            return ErrorCategory.AUTHORIZATION

        if "validation" in str(context).lower() or "input" in str(context).lower():
            return ErrorCategory.VALIDATION

        if "database" in str(context).lower() or "sql" in str(context).lower():
            return ErrorCategory.DATABASE

        if "api" in str(context).lower() or "http" in str(context).lower():
            return ErrorCategory.EXTERNAL_API

        if "security" in str(context).lower():
            return ErrorCategory.SECURITY

        if "performance" in str(context).lower():
            return ErrorCategory.PERFORMANCE

        # Check error type
        if isinstance(error, (ConnectionError, TimeoutError)):
            return ErrorCategory.EXTERNAL_API

        if isinstance(error, (ValueError, TypeError)):
            return ErrorCategory.USER_INPUT

        if isinstance(error, (PermissionError, OSError)):
            return ErrorCategory.SYSTEM

        return ErrorCategory.INTERNAL

    def track_error(
        self,
        error: Exception,
        context: Optional[Dict[str, Any]] = None,
        severity: Optional[ErrorSeverity] = None,
        category: Optional[ErrorCategory] = None,
        component: Optional[str] = None,
        action: Optional[str] = None,
        additional_data: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Track an error and return error ID"""

        # Generate unique error ID
        error_id = str(uuid.uuid4())

        # Determine severity and category if not provided
        if severity is None:
            severity = self._determine_severity(
                error, category or ErrorCategory.INTERNAL
            )

        if category is None:
            category = self._determine_category(error, context or {})

        # Prepare context data
        error_context = {
            "request_id": request_id_var.get(),
            "user_id": user_id_var.get(),
            "session_id": session_id_var.get(),
            "timestamp": now_utc().isoformat(),
            "environment": "development",  # In production, get from environment
            "version": "1.0.0",  # In production, get from version file
        }

        if context:
            error_context.update(context)

        if additional_data:
            error_context.update(additional_data)

        # Create error report
        error_report = ErrorReport(
            error_id=error_id,
            timestamp=now_utc(),
            severity=severity,
            category=category,
            error_type=type(error).__name__,
            error_message=str(error),
            stack_trace=traceback.format_exc(),
            context=error_context,
            request_id=request_id_var.get(),
            user_id=user_id_var.get(),
            session_id=session_id_var.get(),
            component=component,
            action=action,
            environment="development",
            version="1.0.0",
        )

        # Log the error
        default_logger.error(
            LogContext.ERROR,
            f"Error tracked: {error_report.error_type}",
            {
                "error_id": error_id,
                "severity": severity.value,
                "category": category.value,
                "component": component,
                "action": action,
                "context": error_context,
            },
            component or "ErrorTracker",
            action or "track_error",
            exception=error,
        )

        # Store locally
        if self.enable_local_storage:
            self.local_errors.append(error_report)
            if len(self.local_errors) > self.max_local_errors:
                self.local_errors = self.local_errors[-self.max_local_errors :]
            self._save_local_errors()

        # Report remotely
        if self.enable_remote_reporting and self.remote_endpoint:
            task = asyncio.create_task(self._report_error_remote(error_report))
            # Keep reference to prevent garbage collection
            self._pending_tasks = getattr(self, "_pending_tasks", set())
            self._pending_tasks.add(task)
            task.add_done_callback(self._pending_tasks.discard)

        # Check for alerting
        self._check_alerts(error_report)

        return error_id

    async def _report_error_remote(self, error_report: ErrorReport):
        """Report error to remote endpoint"""
        try:
            async with (
                aiohttp.ClientSession() as session,
                session.post(
                    self.remote_endpoint,
                    json=asdict(error_report),
                    headers={"Content-Type": "application/json"},
                ) as response,
            ):
                if response.status != 200:
                    default_logger.warning(
                        LogContext.ERROR,
                        "Failed to report error to remote endpoint",
                        {
                            "error_id": error_report.error_id,
                            "status_code": response.status,
                            "response": await response.text(),
                        },
                        "ErrorTracker",
                        "_report_error_remote",
                    )
        except Exception as e:
            default_logger.error(
                LogContext.ERROR,
                "Error reporting to remote endpoint failed",
                {
                    "error_id": error_report.error_id,
                    "error": str(e),
                },
                "ErrorTracker",
                "_report_error_remote",
                exception=e,
            )

    def _check_alerts(self, error_report: ErrorReport):
        """Check if alerts should be sent"""

        # Track error counts
        current_time = now_utc()
        error_key = f"{error_report.category.value}:{error_report.severity.value}"

        if error_key not in self.error_counts:
            self.error_counts[error_key] = []

        self.error_counts[error_key].append(current_time)

        # Clean old errors
        cutoff_time = current_time - timedelta(seconds=self.alert_time_window)
        self.error_counts[error_key] = [
            timestamp
            for timestamp in self.error_counts[error_key]
            if timestamp > cutoff_time
        ]

        # Check if threshold exceeded
        if (
            error_report.severity == ErrorSeverity.CRITICAL
            and len(self.error_counts[error_key]) >= self.critical_error_threshold
        ):
            self._send_alert(error_report, len(self.error_counts[error_key]))

    def _send_alert(self, error_report: ErrorReport, count: int):
        """Send alert for critical errors"""

        alert_message = (
            f"Critical error threshold exceeded: {count} "
            f"{error_report.severity.value} errors in "
            f"{self.alert_time_window} seconds"
        )

        default_logger.critical(
            LogContext.ERROR,
            alert_message,
            {
                "error_id": error_report.error_id,
                "error_count": count,
                "category": error_report.category.value,
                "severity": error_report.severity.value,
                "time_window": self.alert_time_window,
            },
            "ErrorTracker",
            "_send_alert",
        )

        # Send email alert if enabled
        if self.enable_email_alerts and self.email_recipients:
            self._send_email_alert(error_report, count)

    def _send_email_alert(self, error_report: ErrorReport, count: int):
        """Send email alert for critical errors"""
        try:
            # In a real implementation, this would send an email
            # For now, we'll just log it
            default_logger.info(
                LogContext.ERROR,
                "Email alert would be sent",
                {
                    "error_id": error_report.error_id,
                    "error_count": count,
                    "recipients": self.email_recipients,
                },
                "ErrorTracker",
                "_send_email_alert",
            )
        except Exception as e:
            default_logger.error(
                LogContext.ERROR,
                "Failed to send email alert",
                {"error": str(e)},
                "ErrorTracker",
                "_send_email_alert",
                exception=e,
            )

    def get_errors(
        self,
        severity: Optional[ErrorSeverity] = None,
        category: Optional[ErrorCategory] = None,
        limit: int = 100,
        resolved: Optional[bool] = None,
    ) -> List[ErrorReport]:
        """Get filtered list of errors"""

        errors = self.local_errors.copy()

        # Filter by severity
        if severity:
            errors = [e for e in errors if e.severity == severity]

        # Filter by category
        if category:
            errors = [e for e in errors if e.category == category]

        # Filter by resolved status
        if resolved is not None:
            errors = [e for e in errors if e.resolved == resolved]

        # Sort by timestamp (newest first)
        errors.sort(key=lambda x: x.timestamp, reverse=True)

        # Limit results
        return errors[:limit]

    def resolve_error(
        self, error_id: str, resolved_by: str, notes: Optional[str] = None
    ):
        """Mark an error as resolved"""

        for error in self.local_errors:
            if error.error_id == error_id:
                error.resolved = True
                error.resolved_at = now_utc()
                error.resolved_by = resolved_by
                error.notes = notes
                break

        self._save_local_errors()

        default_logger.info(
            LogContext.ERROR,
            "Error marked as resolved",
            {
                "error_id": error_id,
                "resolved_by": resolved_by,
                "notes": notes,
            },
            "ErrorTracker",
            "resolve_error",
        )

    def get_error_stats(self) -> Dict[str, Any]:
        """Get error statistics"""

        total_errors = len(self.local_errors)
        resolved_errors = len([e for e in self.local_errors if e.resolved])
        unresolved_errors = total_errors - resolved_errors

        # Count by severity
        severity_counts = {}
        for severity in ErrorSeverity:
            severity_counts[severity.value] = len(
                [e for e in self.local_errors if e.severity == severity]
            )

        # Count by category
        category_counts = {}
        for category in ErrorCategory:
            category_counts[category.value] = len(
                [e for e in self.local_errors if e.category == category]
            )

        # Recent errors (last 24 hours)
        recent_cutoff = now_utc() - timedelta(hours=24)
        recent_errors = len(
            [e for e in self.local_errors if e.timestamp > recent_cutoff]
        )

        return {
            "total_errors": total_errors,
            "resolved_errors": resolved_errors,
            "unresolved_errors": unresolved_errors,
            "recent_errors_24h": recent_errors,
            "severity_counts": severity_counts,
            "category_counts": category_counts,
        }


# Global error tracker instance
error_tracker = ErrorTracker(
    enable_remote_reporting=False,  # Set to True in production
    enable_local_storage=True,
    enable_email_alerts=False,  # Set to True in production
    critical_error_threshold=5,
    alert_time_window=300,
)


# Convenience functions
async def track_error(
    error: Exception,
    context: Optional[Dict[str, Any]] = None,
    severity: Optional[ErrorSeverity] = None,
    category: Optional[ErrorCategory] = None,
    component: Optional[str] = None,
    action: Optional[str] = None,
    additional_data: Optional[Dict[str, Any]] = None,
) -> str:
    """Convenience function to track an error"""
    return await error_tracker.track_error(
        error, context, severity, category, component, action, additional_data
    )


def get_errors(
    severity: Optional[ErrorSeverity] = None,
    category: Optional[ErrorCategory] = None,
    limit: int = 100,
    resolved: Optional[bool] = None,
) -> List[ErrorReport]:
    """Convenience function to get errors"""
    return error_tracker.get_errors(severity, category, limit, resolved)


def resolve_error(error_id: str, resolved_by: str, notes: Optional[str] = None):
    """Convenience function to resolve an error"""
    error_tracker.resolve_error(error_id, resolved_by, notes)


def get_error_stats() -> Dict[str, Any]:
    """Convenience function to get error statistics"""
    return error_tracker.get_error_stats()


# Export commonly used items
__all__ = [
    "ErrorTracker",
    "ErrorReport",
    "ErrorSeverity",
    "ErrorCategory",
    "error_tracker",
    "track_error",
    "get_errors",
    "resolve_error",
    "get_error_stats",
]
