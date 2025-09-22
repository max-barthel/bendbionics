"""
Performance monitoring utilities for the Soft Robot App
"""

import asyncio
import time
from contextlib import asynccontextmanager, suppress
from dataclasses import dataclass
from datetime import datetime
from functools import wraps
from typing import Any, Callable, Dict, Optional

import psutil

from app.utils.logger import LogContext, default_logger


@dataclass
class PerformanceMetrics:
    """Performance metrics data class"""

    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    memory_available_mb: float
    disk_usage_percent: float
    disk_free_gb: float
    network_sent_mb: float
    network_recv_mb: float
    active_connections: int
    load_average: tuple


class PerformanceMonitor:
    """System performance monitor"""

    def __init__(self, log_interval: int = 60):  # Log every 60 seconds
        self.log_interval = log_interval
        self.is_monitoring = False
        self.monitor_task: Optional[asyncio.Task] = None
        self.last_network_stats = None
        self.start_time = None

    async def start_monitoring(self):
        """Start performance monitoring"""
        if self.is_monitoring:
            return

        self.is_monitoring = True
        self.start_time = time.time()
        self.last_network_stats = psutil.net_io_counters()

        self.monitor_task = asyncio.create_task(self._monitor_loop())
        default_logger.info(
            LogContext.PERFORMANCE,
            "Performance monitoring started",
            {"log_interval": self.log_interval},
            "PerformanceMonitor",
            "start_monitoring",
        )

    async def stop_monitoring(self):
        """Stop performance monitoring"""
        if not self.is_monitoring:
            return

        self.is_monitoring = False

        if self.monitor_task:
            self.monitor_task.cancel()
            with suppress(asyncio.CancelledError):
                await self.monitor_task

        default_logger.info(
            LogContext.PERFORMANCE,
            "Performance monitoring stopped",
            {"duration": (time.time() - self.start_time if self.start_time else 0)},
            "PerformanceMonitor",
            "stop_monitoring",
        )

    async def _monitor_loop(self):
        """Main monitoring loop"""
        while self.is_monitoring:
            try:
                metrics = await self._collect_metrics()
                self._log_metrics(metrics)

                # Check for performance alerts
                await self._check_alerts(metrics)

                await asyncio.sleep(self.log_interval)
            except Exception as e:
                default_logger.error(
                    LogContext.PERFORMANCE,
                    "Error in performance monitoring loop",
                    {"error": str(e)},
                    "PerformanceMonitor",
                    "_monitor_loop",
                    exception=e,
                )
                await asyncio.sleep(self.log_interval)

    async def _collect_metrics(self) -> PerformanceMetrics:
        """Collect system performance metrics"""

        # CPU metrics
        cpu_percent = psutil.cpu_percent(interval=1)

        # Memory metrics
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        memory_used_mb = memory.used / 1024 / 1024
        memory_available_mb = memory.available / 1024 / 1024

        # Disk metrics
        disk = psutil.disk_usage("/")
        disk_usage_percent = (disk.used / disk.total) * 100
        disk_free_gb = disk.free / 1024 / 1024 / 1024

        # Network metrics
        network_stats = psutil.net_io_counters()
        network_sent_mb = 0
        network_recv_mb = 0

        if self.last_network_stats:
            network_sent_mb = (
                (network_stats.bytes_sent - self.last_network_stats.bytes_sent)
                / 1024
                / 1024
            )
            network_recv_mb = (
                (network_stats.bytes_recv - self.last_network_stats.bytes_recv)
                / 1024
                / 1024
            )

        self.last_network_stats = network_stats

        # Connection metrics
        active_connections = len(psutil.net_connections())

        # Load average (Unix only)
        try:
            load_average = psutil.getloadavg()
        except AttributeError:
            load_average = (0, 0, 0)

        return PerformanceMetrics(
            timestamp=datetime.utcnow(),
            cpu_percent=cpu_percent,
            memory_percent=memory_percent,
            memory_used_mb=memory_used_mb,
            memory_available_mb=memory_available_mb,
            disk_usage_percent=disk_usage_percent,
            disk_free_gb=disk_free_gb,
            network_sent_mb=network_sent_mb,
            network_recv_mb=network_recv_mb,
            active_connections=active_connections,
            load_average=load_average,
        )

    def _log_metrics(self, metrics: PerformanceMetrics):
        """Log performance metrics"""
        default_logger.info(
            LogContext.PERFORMANCE,
            "System performance metrics",
            {
                "cpu_percent": metrics.cpu_percent,
                "memory_percent": metrics.memory_percent,
                "memory_used_mb": round(metrics.memory_used_mb, 2),
                "memory_available_mb": round(metrics.memory_available_mb, 2),
                "disk_usage_percent": round(metrics.disk_usage_percent, 2),
                "disk_free_gb": round(metrics.disk_free_gb, 2),
                "network_sent_mb": round(metrics.network_sent_mb, 2),
                "network_recv_mb": round(metrics.network_recv_mb, 2),
                "active_connections": metrics.active_connections,
                "load_average": metrics.load_average,
            },
            "PerformanceMonitor",
            "log_metrics",
        )

    async def _check_alerts(self, metrics: PerformanceMetrics):
        """Check for performance alerts"""

        # CPU alert
        if metrics.cpu_percent > 80:
            default_logger.warning(
                LogContext.PERFORMANCE,
                "High CPU usage detected",
                {"cpu_percent": metrics.cpu_percent, "threshold": 80},
                "PerformanceMonitor",
                "cpu_alert",
            )

        # Memory alert
        if metrics.memory_percent > 85:
            default_logger.warning(
                LogContext.PERFORMANCE,
                "High memory usage detected",
                {"memory_percent": metrics.memory_percent, "threshold": 85},
                "PerformanceMonitor",
                "memory_alert",
            )

        # Disk alert
        if metrics.disk_usage_percent > 90:
            default_logger.warning(
                LogContext.PERFORMANCE,
                "High disk usage detected",
                {
                    "disk_usage_percent": metrics.disk_usage_percent,
                    "threshold": 90,
                },
                "PerformanceMonitor",
                "disk_alert",
            )

        # Load average alert (Unix only)
        if metrics.load_average[0] > 4.0:  # 1-minute load average
            default_logger.warning(
                LogContext.PERFORMANCE,
                "High load average detected",
                {"load_average": metrics.load_average, "threshold": 4.0},
                "PerformanceMonitor",
                "load_alert",
            )


class FunctionProfiler:
    """Function execution profiler"""

    def __init__(
        self, log_threshold: float = 0.1
    ):  # Log functions taking more than 100ms
        self.log_threshold = log_threshold

    def profile(
        self,
        context: LogContext = LogContext.PERFORMANCE,
        component: str = "FunctionProfiler",
    ):
        """Decorator to profile function execution time"""

        def decorator(func: Callable):
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    duration = time.time() - start_time

                    if duration > self.log_threshold:
                        default_logger.performance(
                            f"Function {func.__name__} completed",
                            duration,
                            {
                                "function": func.__name__,
                                "module": func.__module__,
                                "args_count": len(args),
                                "kwargs_count": len(kwargs),
                            },
                            component,
                            "function_profile",
                        )

                    return result
                except Exception as e:
                    duration = time.time() - start_time
                    default_logger.error(
                        context,
                        f"Function {func.__name__} failed",
                        {
                            "function": func.__name__,
                            "module": func.__module__,
                            "duration": duration,
                            "error": str(e),
                        },
                        component,
                        "function_profile",
                        exception=e,
                    )
                    raise

            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    duration = time.time() - start_time

                    if duration > self.log_threshold:
                        default_logger.performance(
                            f"Function {func.__name__} completed",
                            duration,
                            {
                                "function": func.__name__,
                                "module": func.__module__,
                                "args_count": len(args),
                                "kwargs_count": len(kwargs),
                            },
                            component,
                            "function_profile",
                        )

                    return result
                except Exception as e:
                    duration = time.time() - start_time
                    default_logger.error(
                        context,
                        f"Function {func.__name__} failed",
                        {
                            "function": func.__name__,
                            "module": func.__module__,
                            "duration": duration,
                            "error": str(e),
                        },
                        component,
                        "function_profile",
                        exception=e,
                    )
                    raise

            return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

        return decorator


class DatabaseProfiler:
    """Database query profiler"""

    def __init__(
        self, log_threshold: float = 0.05
    ):  # Log queries taking more than 50ms
        self.log_threshold = log_threshold
        self.query_count = 0
        self.total_query_time = 0.0

    def profile_query(self, query: str, params: Optional[Dict[str, Any]] = None):
        """Context manager to profile database queries"""

        @asynccontextmanager
        async def _profile():
            start_time = time.time()
            self.query_count += 1

            try:
                yield
                duration = time.time() - start_time
                self.total_query_time += duration

                if duration > self.log_threshold:
                    default_logger.performance(
                        "Database query executed",
                        duration,
                        {
                            "query": (
                                query[:200] + "..." if len(query) > 200 else query
                            ),
                            "params": params,
                            "query_count": self.query_count,
                            "total_query_time": self.total_query_time,
                        },
                        "Database",
                        "query_profile",
                    )
            except Exception as e:
                duration = time.time() - start_time
                default_logger.error(
                    LogContext.DATABASE,
                    "Database query failed",
                    {
                        "query": (query[:200] + "..." if len(query) > 200 else query),
                        "params": params,
                        "duration": duration,
                        "error": str(e),
                    },
                    "Database",
                    "query_profile",
                    exception=e,
                )
                raise

        return _profile()

    def get_stats(self) -> Dict[str, Any]:
        """Get database profiling statistics"""
        avg_query_time = (
            self.total_query_time / self.query_count if self.query_count > 0 else 0
        )

        return {
            "query_count": self.query_count,
            "total_query_time": self.total_query_time,
            "average_query_time": avg_query_time,
        }


class MemoryProfiler:
    """Memory usage profiler"""

    def __init__(self, log_threshold_mb: float = 10.0):  # Log memory changes > 10MB
        self.log_threshold_mb = log_threshold_mb
        self.baseline_memory = None

    def start_profiling(self):
        """Start memory profiling"""
        process = psutil.Process()
        self.baseline_memory = process.memory_info().rss / 1024 / 1024  # MB

        default_logger.info(
            LogContext.PERFORMANCE,
            "Memory profiling started",
            {"baseline_memory_mb": self.baseline_memory},
            "MemoryProfiler",
            "start_profiling",
        )

    def check_memory(self, context: str = "checkpoint"):
        """Check current memory usage"""
        if self.baseline_memory is None:
            return

        process = psutil.Process()
        current_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_diff = current_memory - self.baseline_memory

        if abs(memory_diff) > self.log_threshold_mb:
            default_logger.info(
                LogContext.PERFORMANCE,
                f"Memory usage at {context}",
                {
                    "baseline_memory_mb": self.baseline_memory,
                    "current_memory_mb": current_memory,
                    "memory_diff_mb": memory_diff,
                    "context": context,
                },
                "MemoryProfiler",
                "check_memory",
            )

    def stop_profiling(self):
        """Stop memory profiling and log final stats"""
        if self.baseline_memory is None:
            return

        process = psutil.Process()
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        total_memory_diff = final_memory - self.baseline_memory

        default_logger.info(
            LogContext.PERFORMANCE,
            "Memory profiling completed",
            {
                "baseline_memory_mb": self.baseline_memory,
                "final_memory_mb": final_memory,
                "total_memory_diff_mb": total_memory_diff,
            },
            "MemoryProfiler",
            "stop_profiling",
        )

        self.baseline_memory = None


# Global instances
performance_monitor = PerformanceMonitor()
function_profiler = FunctionProfiler()
database_profiler = DatabaseProfiler()
memory_profiler = MemoryProfiler()


# Convenience functions
def profile_function(
    context: LogContext = LogContext.PERFORMANCE,
    component: str = "FunctionProfiler",
):
    """Convenience function for function profiling"""
    return function_profiler.profile(context, component)


def profile_database_query(query: str, params: Optional[Dict[str, Any]] = None):
    """Convenience function for database query profiling"""
    return database_profiler.profile_query(query, params)


def start_memory_profiling():
    """Convenience function to start memory profiling"""
    memory_profiler.start_profiling()


def check_memory(context: str = "checkpoint"):
    """Convenience function to check memory usage"""
    memory_profiler.check_memory(context)


def stop_memory_profiling():
    """Convenience function to stop memory profiling"""
    memory_profiler.stop_profiling()


# Export commonly used items
__all__ = [
    "PerformanceMonitor",
    "PerformanceMetrics",
    "FunctionProfiler",
    "DatabaseProfiler",
    "MemoryProfiler",
    "performance_monitor",
    "function_profiler",
    "database_profiler",
    "memory_profiler",
    "profile_function",
    "profile_database_query",
    "start_memory_profiling",
    "check_memory",
    "stop_memory_profiling",
]
