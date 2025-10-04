"""
Advanced logging utility for the Soft Robot App backend
Provides structured logging with different levels, contexts, and remote reporting
"""

import asyncio
import json
import logging
import sys
import traceback
from contextvars import ContextVar
from dataclasses import asdict, dataclass
from enum import Enum
from pathlib import Path
from typing import Any, Dict, Optional

from app.utils.timezone import now_utc

# Context variables for request tracking
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)
user_id_var: ContextVar[Optional[str]] = ContextVar("user_id", default=None)
session_id_var: ContextVar[Optional[str]] = ContextVar("session_id", default=None)


class LogLevel(Enum):
    """Log levels"""

    DEBUG = 10
    INFO = 20
    WARNING = 30
    ERROR = 40
    CRITICAL = 50


class LogContext(Enum):
    """Log contexts"""

    GENERAL = "general"
    API = "api"
    DATABASE = "database"
    AUTH = "auth"
    PERFORMANCE = "performance"
    ERROR = "error"
    SECURITY = "security"
    EXTERNAL = "external"


@dataclass
class LogEntry:
    """Structured log entry"""

    timestamp: str
    level: str
    context: str
    message: str
    data: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    component: Optional[str] = None
    action: Optional[str] = None
    stack_trace: Optional[str] = None
    duration: Optional[float] = None
    memory_usage: Optional[float] = None
    cpu_usage: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)

    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps(self.to_dict(), default=str)


@dataclass
class FileConfig:
    """File logging configuration"""
    log_file_path: str = "logs/app.log"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    backup_count: int = 5


@dataclass
class RemoteConfig:
    """Remote logging configuration"""
    remote_endpoint: Optional[str] = None
    batch_size: int = 10
    flush_interval: float = 5.0


@dataclass
class FeatureConfig:
    """Feature toggles configuration"""
    enable_console: bool = True
    enable_file: bool = True
    enable_remote: bool = False
    enable_performance_logging: bool = True
    enable_error_tracking: bool = True
    enable_user_tracking: bool = True
    enable_sql_logging: bool = False


class LoggerConfig:
    """Logger configuration"""

    def __init__(
        self,
        level: LogLevel = LogLevel.INFO,
        file_config: Optional[FileConfig] = None,
        remote_config: Optional[RemoteConfig] = None,
        feature_config: Optional[FeatureConfig] = None,
    ):
        self.level = level
        self.file_config = file_config or FileConfig()
        self.remote_config = remote_config or RemoteConfig()
        self.feature_config = feature_config or FeatureConfig()

        # Backward compatibility properties
        self.enable_console = self.feature_config.enable_console
        self.enable_file = self.feature_config.enable_file
        self.enable_remote = self.feature_config.enable_remote
        self.log_file_path = self.file_config.log_file_path
        self.max_file_size = self.file_config.max_file_size
        self.backup_count = self.file_config.backup_count
        self.remote_endpoint = self.remote_config.remote_endpoint
        self.batch_size = self.remote_config.batch_size
        self.flush_interval = self.remote_config.flush_interval
        self.enable_performance_logging = self.feature_config.enable_performance_logging
        self.enable_error_tracking = self.feature_config.enable_error_tracking
        self.enable_user_tracking = self.feature_config.enable_user_tracking
        self.enable_sql_logging = self.feature_config.enable_sql_logging


class AsyncLogHandler:
    """Asynchronous log handler for remote logging"""

    def __init__(self, config: LoggerConfig):
        self.config = config
        self.log_queue: asyncio.Queue = asyncio.Queue()
        self.flush_task: Optional[asyncio.Task] = None
        self.start_flush_task()

    def start_flush_task(self):
        """Start the flush task"""
        if self.config.enable_remote and self.config.remote_endpoint:
            self.flush_task = asyncio.create_task(self._flush_loop())

    async def _flush_loop(self):
        """Flush logs periodically"""
        while True:
            try:
                await asyncio.sleep(self.config.flush_interval)
                await self.flush_logs()
            except Exception:
                pass

    async def add_log(self, log_entry: LogEntry):
        """Add log to queue"""
        await self.log_queue.put(log_entry)

        if self.log_queue.qsize() >= self.config.batch_size:
            await self.flush_logs()

    async def flush_logs(self):
        """Flush logs to remote endpoint"""
        if not self.config.remote_endpoint:
            return

        logs_to_send = []
        while not self.log_queue.empty():
            try:
                log_entry = self.log_queue.get_nowait()
                logs_to_send.append(log_entry.to_dict())
            except asyncio.QueueEmpty:
                break

        if logs_to_send:
            try:
                import aiohttp  # type: ignore[import-untyped]

                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        self.config.remote_endpoint,
                        json={"logs": logs_to_send},
                        headers={"Content-Type": "application/json"},
                    ) as response:
                        if response.status != 200:
                            # Log failed remote send - will retry later
                            pass
            except Exception:
                # Re-queue logs for retry
                for log_dict in logs_to_send:
                    log_entry = LogEntry(**log_dict)
                    await self.log_queue.put(log_entry)

    def stop(self):
        """Stop the flush task"""
        if self.flush_task:
            self.flush_task.cancel()


class Logger:
    """Advanced logger with structured logging and remote reporting"""

    def __init__(self, name: str, config: Optional[LoggerConfig] = None):
        self.name = name
        self.config = config or LoggerConfig()
        self.async_handler = AsyncLogHandler(self.config)
        self._setup_logger()

    def _setup_logger(self):
        """Setup the logger with handlers"""
        self._logger = logging.getLogger(self.name)
        self._logger.setLevel(self.config.level.value)

        # Clear existing handlers
        self._logger.handlers.clear()

        # Console handler
        if self.config.enable_console:
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(self.config.level.value)
            console_formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
            console_handler.setFormatter(console_formatter)
            self._logger.addHandler(console_handler)

        # File handler
        if self.config.enable_file:
            # Create logs directory if it doesn't exist
            log_path = Path(self.config.log_file_path)
            log_path.parent.mkdir(parents=True, exist_ok=True)

            file_handler = logging.handlers.RotatingFileHandler(
                self.config.log_file_path,
                maxBytes=self.config.max_file_size,
                backupCount=self.config.backup_count,
            )
            file_handler.setLevel(self.config.level.value)
            file_formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
            file_handler.setFormatter(file_formatter)
            self._logger.addHandler(file_handler)

    def _create_log_entry(
        self,
        level: LogLevel,
        context: LogContext,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        component: Optional[str] = None,
        action: Optional[str] = None,
        exception: Optional[Exception] = None,
        duration: Optional[float] = None,
    ) -> LogEntry:
        """Create a structured log entry"""

        # Get context variables
        request_id = request_id_var.get()
        user_id = user_id_var.get()
        session_id = session_id_var.get()

        # Get stack trace if exception provided
        stack_trace = None
        if exception:
            stack_trace = traceback.format_exc()

        # Get system metrics
        memory_usage = None
        cpu_usage = None
        if self.config.enable_performance_logging:
            try:
                import psutil  # type: ignore[import-untyped]

                process = psutil.Process()
                memory_usage = process.memory_info().rss / 1024 / 1024  # MB
                cpu_usage = process.cpu_percent()
            except ImportError:
                pass

        return LogEntry(
            timestamp=now_utc().isoformat(),
            level=level.name,
            context=context.value,
            message=message,
            data=data,
            request_id=request_id,
            user_id=user_id,
            session_id=session_id,
            component=component,
            action=action,
            stack_trace=stack_trace,
            duration=duration,
            memory_usage=memory_usage,
            cpu_usage=cpu_usage,
        )

    def _log(
        self,
        level: LogLevel,
        context: LogContext,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        component: Optional[str] = None,
        action: Optional[str] = None,
        exception: Optional[Exception] = None,
        duration: Optional[float] = None,
    ):
        """Internal logging method"""

        # Create log entry
        log_entry = self._create_log_entry(
            level,
            context,
            message,
            data,
            component,
            action,
            exception,
            duration,
        )

        # Log to standard logger
        log_message = f"[{context.value}] {message}"
        if data:
            log_message += f" | Data: {json.dumps(data, default=str)}"

        if exception:
            self._logger.log(level.value, log_message, exc_info=exception)
        else:
            self._logger.log(level.value, log_message)

        # Send to async handler for remote logging
        if self.config.enable_remote:
            task = asyncio.create_task(self.async_handler.add_log(log_entry))
            # Keep reference to prevent garbage collection
            self._pending_tasks = getattr(self, "_pending_tasks", set())
            self._pending_tasks.add(task)
            task.add_done_callback(self._pending_tasks.discard)

    def debug(
        self,
        context: LogContext,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        component: Optional[str] = None,
        action: Optional[str] = None,
    ):
        """Log debug message"""
        self._log(LogLevel.DEBUG, context, message, data, component, action)

    def info(
        self,
        context: LogContext,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        component: Optional[str] = None,
        action: Optional[str] = None,
        duration: Optional[float] = None,
    ):
        """Log info message"""
        self._log(
            LogLevel.INFO,
            context,
            message,
            data,
            component,
            action,
            duration=duration,
        )

    def warning(
        self,
        context: LogContext,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        component: Optional[str] = None,
        action: Optional[str] = None,
    ):
        """Log warning message"""
        self._log(LogLevel.WARNING, context, message, data, component, action)

    def error(
        self,
        context: LogContext,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        component: Optional[str] = None,
        action: Optional[str] = None,
        exception: Optional[Exception] = None,
    ):
        """Log error message"""
        self._log(
            LogLevel.ERROR,
            context,
            message,
            data,
            component,
            action,
            exception,
        )

    def critical(
        self,
        context: LogContext,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        component: Optional[str] = None,
        action: Optional[str] = None,
        exception: Optional[Exception] = None,
    ):
        """Log critical message"""
        self._log(
            LogLevel.CRITICAL,
            context,
            message,
            data,
            component,
            action,
            exception,
        )

    def performance(
        self,
        message: str,
        duration: float,
        data: Optional[Dict[str, Any]] = None,
        component: Optional[str] = None,
        action: Optional[str] = None,
    ):
        """Log performance metrics"""
        if self.config.enable_performance_logging:
            self.info(
                LogContext.PERFORMANCE,
                message,
                data,
                component,
                action,
                duration=duration,
            )

    def sql(
        self,
        query: str,
        duration: Optional[float] = None,
        params: Optional[Dict[str, Any]] = None,
    ):
        """Log SQL queries"""
        if self.config.enable_sql_logging:
            data = {"query": query}
            if params:
                data["params"] = params
            if duration:
                data["duration"] = duration

            self.debug(
                LogContext.DATABASE,
                "SQL query executed",
                data,
                "Database",
                "query",
            )

    def api_request(
        self,
        method: str,
        path: str,
        status_code: int,
        duration: float,
        user_id: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
    ):
        """Log API request"""
        request_data = {
            "method": method,
            "path": path,
            "status_code": status_code,
            "duration": duration,
        }
        if user_id:
            request_data["user_id"] = user_id
        if data:
            request_data.update(data)

        level = LogLevel.INFO if status_code < 400 else LogLevel.WARNING
        context = LogContext.API

        self._log(
            level,
            context,
            f"API {method} {path}",
            request_data,
            "API",
            "request",
        )

    def security_event(
        self,
        event_type: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
    ):
        """Log security event"""
        security_data = {"event_type": event_type}
        if user_id:
            security_data["user_id"] = user_id
        if data:
            security_data.update(data)

        self.warning(
            LogContext.SECURITY, message, security_data, "Security", event_type
        )

    def set_request_context(
        self,
        request_id: Optional[str] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
    ):
        """Set request context variables"""
        if request_id:
            request_id_var.set(request_id)
        if user_id:
            user_id_var.set(user_id)
        if session_id:
            session_id_var.set(session_id)

    def clear_context(self):
        """Clear context variables"""
        request_id_var.set(None)
        user_id_var.set(None)
        session_id_var.set(None)

    def stop(self):
        """Stop the logger and cleanup resources"""
        self.async_handler.stop()


# Create default logger instance
default_logger = Logger(
    "soft-robot-app",
    LoggerConfig(
        level=LogLevel.INFO,
        enable_console=True,
        enable_file=True,
        enable_remote=False,
        log_file_path="logs/app.log",
        enable_performance_logging=True,
        enable_error_tracking=True,
        enable_user_tracking=True,
        enable_sql_logging=False,
    ),
)

# Export commonly used items
__all__ = [
    "Logger",
    "LoggerConfig",
    "LogLevel",
    "LogContext",
    "LogEntry",
    "default_logger",
    "request_id_var",
    "user_id_var",
    "session_id_var",
]
