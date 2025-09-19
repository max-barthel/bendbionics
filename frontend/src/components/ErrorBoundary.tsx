import { Component, ErrorInfo, ReactNode } from 'react';
import logger, { LogContext } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  enableReporting?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, enableReporting = true } = this.props;
    const { errorId } = this.state;

    // Log the error
    logger.error(
      LogContext.ERROR,
      'Error boundary caught an error',
      {
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
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
      'ErrorBoundary',
      'componentDidCatch'
    );

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to external service if enabled
    if (enableReporting) {
      this.reportError(error, errorInfo, errorId);
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
          url: window.location.href,
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
      logger.error(
        LogContext.ERROR,
        'Failed to report error to external service',
        { error: reportingError, originalErrorId: errorId },
        'ErrorBoundary',
        'reportError'
      );
    }
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });

      logger.info(
        LogContext.ERROR,
        'Error boundary retry attempted',
        { retryCount: this.retryCount },
        'ErrorBoundary',
        'handleRetry'
      );
    }
  };

  private handleReload = () => {
    logger.info(
      LogContext.ERROR,
      'Page reload requested due to error',
      { errorId: this.state.errorId },
      'ErrorBoundary',
      'handleReload'
    );
    window.location.reload();
  };

  private handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const bugReport = {
      errorId,
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // Copy to clipboard
    navigator.clipboard
      .writeText(JSON.stringify(bugReport, null, 2))
      .then(() => {
        logger.info(
          LogContext.ERROR,
          'Bug report copied to clipboard',
          { errorId },
          'ErrorBoundary',
          'handleReportBug'
        );
        alert('Bug report copied to clipboard. Please paste it in your bug report.');
      })
      .catch(() => {
        // Fallback: open email client
        const subject = encodeURIComponent(`Bug Report - Error ID: ${errorId}`);
        const body = encodeURIComponent(JSON.stringify(bugReport, null, 2));
        window.open(`mailto:support@softrobot.app?subject=${subject}&body=${body}`);
      });
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
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
                We're sorry, but something unexpected happened. Our team has been
                notified.
              </p>
              {errorId && (
                <p className="mt-1 text-xs text-gray-500">Error ID: {errorId}</p>
              )}
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex flex-col space-y-2">
                {this.retryCount < this.maxRetries && (
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </button>
                )}

                <button
                  onClick={this.handleReload}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Reload Page
                </button>

                <button
                  onClick={this.handleReportBug}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Report Bug
                </button>
              </div>

              {showDetails && error && (
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
              )}
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
