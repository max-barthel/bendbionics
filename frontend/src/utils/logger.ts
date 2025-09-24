// Simple logger for startup development
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export enum LogContext {
  GENERAL = 'general',
  API = 'api',
  UI = 'ui',
  PERFORMANCE = 'performance',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  timestamp: Date;
  data?: unknown;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableLocalStorage: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableLocalStorage: false,
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private log(
    level: LogLevel,
    message: string,
    context: LogContext = LogContext.GENERAL,
    data?: unknown
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date(),
      data,
    };

    if (this.config.enableConsole) {
      const levelName = LogLevel[level];
      const timestamp = entry.timestamp.toISOString();
      console.warn(`[${timestamp}] [${levelName}] [${context}] ${message}`, data ?? '');
    }
  }

  debug(
    message: string,
    context: LogContext = LogContext.GENERAL,
    data?: unknown
  ): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(
    message: string,
    context: LogContext = LogContext.GENERAL,
    data?: unknown
  ): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(
    message: string,
    context: LogContext = LogContext.GENERAL,
    data?: unknown
  ): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(
    message: string,
    context: LogContext = LogContext.GENERAL,
    data?: unknown
  ): void {
    this.log(LogLevel.ERROR, message, context, data);
  }
}

// Create default logger instance
const defaultLogger = new Logger({
  level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableLocalStorage: false,
});

export default defaultLogger;
