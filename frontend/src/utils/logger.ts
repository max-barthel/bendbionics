/**
 * Advanced logging utility for the Soft Robot App
 * Provides structured logging with different levels, contexts, and remote reporting
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export enum LogContext {
  GENERAL = 'general',
  API = 'api',
  UI = 'ui',
  AUTH = 'auth',
  PERFORMANCE = 'performance',
  ERROR = 'error',
  SECURITY = 'security',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: LogContext;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  stack?: string;
  component?: string;
  action?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  enableLocalStorage: boolean;
  maxLocalStorageEntries: number;
  remoteEndpoint?: string;
  batchSize: number;
  flushInterval: number;
  enablePerformanceLogging: boolean;
  enableErrorTracking: boolean;
  enableUserTracking: boolean;
}

class Logger {
  private config: LoggerConfig;
  private logQueue: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private userId: string | null = null;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableRemote: false,
      enableLocalStorage: true,
      maxLocalStorageEntries: 1000,
      batchSize: 10,
      flushInterval: 5000,
      enablePerformanceLogging: true,
      enableErrorTracking: true,
      enableUserTracking: true,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.initializeLogger();
  }

  private initializeLogger(): void {
    // Load existing logs from localStorage
    if (this.config.enableLocalStorage) {
      this.loadFromLocalStorage();
    }

    // Set up global error handlers
    if (this.config.enableErrorTracking) {
      this.setupGlobalErrorHandlers();
    }

    // Set up performance monitoring
    if (this.config.enablePerformanceLogging) {
      this.setupPerformanceMonitoring();
    }

    // Start flush timer
    this.startFlushTimer();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Global error handler
    window.addEventListener('error', event => {
      this.error(LogContext.ERROR, 'Uncaught error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', event => {
      this.error(LogContext.ERROR, 'Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise,
      });
    });
  }

  private setupPerformanceMonitoring(): void {
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.info(LogContext.PERFORMANCE, 'Page load performance', {
            loadTime: navigation.loadEventEnd - navigation.loadEventStart,
            domContentLoaded:
              navigation.domContentLoadedEventEnd -
              navigation.domContentLoadedEventStart,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint(),
            largestContentfulPaint: this.getLargestContentfulPaint(),
          });
        }
      }, 0);
    });

    // Monitor resource loading
    const observer = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.debug(LogContext.PERFORMANCE, 'Resource loaded', {
            name: resourceEntry.name,
            duration: resourceEntry.duration,
            size: resourceEntry.transferSize,
            type: this.getResourceType(resourceEntry.name),
          });
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  private getFirstPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  private getFirstContentfulPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(
      entry => entry.name === 'first-contentful-paint'
    );
    return firstContentfulPaint ? firstContentfulPaint.startTime : null;
  }

  private getLargestContentfulPaint(): number | null {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    return lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : null;
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (
      url.includes('.png') ||
      url.includes('.jpg') ||
      url.includes('.jpeg') ||
      url.includes('.gif') ||
      url.includes('.svg')
    )
      return 'image';
    if (
      url.includes('.woff') ||
      url.includes('.woff2') ||
      url.includes('.ttf') ||
      url.includes('.otf')
    )
      return 'font';
    return 'other';
  }

  private createLogEntry(
    level: LogLevel,
    context: LogContext,
    message: string,
    data?: any,
    component?: string,
    action?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
      userId: this.userId || undefined,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      stack: level >= LogLevel.ERROR ? new Error().stack : undefined,
      component,
      action,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private log(
    level: LogLevel,
    context: LogContext,
    message: string,
    data?: any,
    component?: string,
    action?: string
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, context, message, data, component, action);

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Add to queue for remote logging
    if (this.config.enableRemote) {
      this.logQueue.push(entry);
      if (this.logQueue.length >= this.config.batchSize) {
        this.flushLogs();
      }
    }

    // Local storage logging
    if (this.config.enableLocalStorage) {
      this.logToLocalStorage(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${levelName}] [${entry.context}]`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, entry.message, entry.data, entry.stack);
        break;
    }
  }

  private logToLocalStorage(entry: LogEntry): void {
    try {
      const logs = this.getLocalStorageLogs();
      logs.push(entry);

      // Keep only the most recent entries
      if (logs.length > this.config.maxLocalStorageEntries) {
        logs.splice(0, logs.length - this.config.maxLocalStorageEntries);
      }

      localStorage.setItem('soft-robot-logs', JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to log to localStorage:', error);
    }
  }

  private getLocalStorageLogs(): LogEntry[] {
    try {
      const logs = localStorage.getItem('soft-robot-logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.warn('Failed to read logs from localStorage:', error);
      return [];
    }
  }

  private loadFromLocalStorage(): void {
    const logs = this.getLocalStorageLogs();
    this.logQueue.push(...logs);
  }

  private startFlushTimer(): void {
    if (this.config.enableRemote && this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flushLogs();
      }, this.config.flushInterval);
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0 || !this.config.remoteEndpoint) return;

    const logsToFlush = this.logQueue.splice(0, this.config.batchSize);

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToFlush }),
      });
    } catch (error) {
      console.warn('Failed to send logs to remote endpoint:', error);
      // Re-add logs to queue for retry
      this.logQueue.unshift(...logsToFlush);
    }
  }

  // Public methods
  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public debug(
    context: LogContext,
    message: string,
    data?: any,
    component?: string,
    action?: string
  ): void {
    this.log(LogLevel.DEBUG, context, message, data, component, action);
  }

  public info(
    context: LogContext,
    message: string,
    data?: any,
    component?: string,
    action?: string
  ): void {
    this.log(LogLevel.INFO, context, message, data, component, action);
  }

  public warn(
    context: LogContext,
    message: string,
    data?: any,
    component?: string,
    action?: string
  ): void {
    this.log(LogLevel.WARN, context, message, data, component, action);
  }

  public error(
    context: LogContext,
    message: string,
    data?: any,
    component?: string,
    action?: string
  ): void {
    this.log(LogLevel.ERROR, context, message, data, component, action);
  }

  public fatal(
    context: LogContext,
    message: string,
    data?: any,
    component?: string,
    action?: string
  ): void {
    this.log(LogLevel.FATAL, context, message, data, component, action);
  }

  public getLogs(level?: LogLevel, context?: LogContext, limit?: number): LogEntry[] {
    let logs = this.getLocalStorageLogs();

    if (level !== undefined) {
      logs = logs.filter(log => log.level >= level);
    }

    if (context !== undefined) {
      logs = logs.filter(log => log.context === context);
    }

    if (limit !== undefined) {
      logs = logs.slice(-limit);
    }

    return logs;
  }

  public clearLogs(): void {
    localStorage.removeItem('soft-robot-logs');
    this.logQueue = [];
  }

  public exportLogs(): string {
    const logs = this.getLocalStorageLogs();
    return JSON.stringify(logs, null, 2);
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushLogs();
  }
}

// Create default logger instance
const defaultLogger = new Logger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === 'production',
  enableLocalStorage: true,
  remoteEndpoint: process.env.REACT_APP_LOG_ENDPOINT,
});

export default defaultLogger;
export { LogContext, LogLevel, Logger };
export type { LogEntry, LoggerConfig };
