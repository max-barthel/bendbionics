import { errorBoundaryVariants } from '@/styles/design-tokens';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import logger, { LogContext } from '../utils/logger';

// Constants for error ID generation
const RADIX_BASE = 36;
const RANDOM_STRING_START = 2;
const RANDOM_STRING_LENGTH = 9;

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  enableReporting?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  readonly maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(RADIX_BASE).substring(RANDOM_STRING_START, RANDOM_STRING_LENGTH)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, enableReporting = true } = this.props;
    const { errorId } = this.state;

    // Log the error
    logger.error('Error boundary caught an error', LogContext.GENERAL, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      errorId,
      retryCount: this.retryCount,
      userAgent: navigator.userAgent,
      url: globalThis.location.href,
      timestamp: new Date().toISOString(),
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
    });

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to external service if enabled
    if (enableReporting && errorId) {
      void this.reportError(error, errorInfo, errorId);
    }

    this.setState({ errorInfo });
  }

  private async reportError(error: Error, errorInfo: ErrorInfo, errorId: string) {
    try {
      const errorReport = {
        errorId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        context: {
          userAgent: navigator.userAgent,
          url: globalThis.location.href,
          timestamp: new Date().toISOString(),
          retryCount: this.retryCount,
        },
      };

      // Send to error reporting service
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (reportingError) {
      logger.error('Failed to report error to external service', LogContext.GENERAL, {
        error: reportingError,
        originalErrorId: errorId,
        component: 'ErrorBoundary',
        action: 'reportError',
      });
    }
  }

  readonly handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });

      logger.info('Error boundary retry attempted', LogContext.GENERAL, {
        retryCount: this.retryCount,
        component: 'ErrorBoundary',
        action: 'handleRetry',
      });
    }
  };

  readonly handleReload = () => {
    logger.info('Page reload requested due to error', LogContext.GENERAL, {
      errorId: this.state.errorId,
      component: 'ErrorBoundary',
      action: 'handleReload',
    });
    globalThis.location.reload();
  };

  readonly handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const bugReport = {
      errorId,
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: globalThis.location.href,
      timestamp: new Date().toISOString(),
    };

    // Copy to clipboard
    navigator.clipboard
      .writeText(JSON.stringify(bugReport, null, 2))
      .then(() => {
        logger.info('Bug report copied to clipboard', LogContext.GENERAL, {
          errorId,
          component: 'ErrorBoundary',
          action: 'handleReportBug',
        });
        alert('Bug report copied to clipboard. Please paste it in your bug report.');
      })
      .catch(() => {
        // Fallback: open email client
        const subject = encodeURIComponent(`Bug Report - Error ID: ${errorId}`);
        const body = encodeURIComponent(JSON.stringify(bugReport, null, 2));
        window.open(`mailto:support@softrobot.app?subject=${subject}&body=${body}`);
      });
  };

  private renderErrorHeader(errorId: string | null): ReactNode {
    return (
      <div className="text-center">
        <div className="mx-auto h-12 w-12 text-red-500">
          <svg
            className="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          We're sorry, but something unexpected happened. Our team has been notified.
        </p>
        {errorId && <p className="mt-1 text-xs text-gray-500">Error ID: {errorId}</p>}
      </div>
    );
  }

  private renderErrorActions(): ReactNode {
    return (
      <div className="flex flex-col space-y-2">
        {this.retryCount < this.maxRetries && (
          <button
            onClick={this.handleRetry}
            className={errorBoundaryVariants.primaryButton}
          >
            Try Again ({this.maxRetries - this.retryCount} attempts left)
          </button>
        )}

        <button
          onClick={this.handleReload}
          className={errorBoundaryVariants.secondaryButton}
        >
          Reload Page
        </button>

        <button
          onClick={this.handleReportBug}
          className={errorBoundaryVariants.secondaryButton}
        >
          Report Bug
        </button>
      </div>
    );
  }

  private renderErrorDetails(error: Error, errorInfo: ErrorInfo | null): ReactNode {
    return (
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
          Technical Details
        </summary>
        <div className="mt-2 p-4 bg-gray-100 rounded-md">
          <div className="text-sm text-gray-600">
            <p className="font-medium">Error: {error.name}</p>
            <p className="mt-1">{error.message}</p>
            {error.stack && (
              <pre className="mt-2 text-xs overflow-auto">{error.stack}</pre>
            )}
            {errorInfo?.componentStack && (
              <div className="mt-2">
                <p className="font-medium">Component Stack:</p>
                <pre className="mt-1 text-xs overflow-auto">
                  {errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
        </div>
      </details>
    );
  }

  override render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {this.renderErrorHeader(errorId)}

            <div className="mt-8 space-y-4">
              {this.renderErrorActions()}

              {showDetails && error && this.renderErrorDetails(error, errorInfo)}
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                If this problem persists, please contact support with the Error ID
                above.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
