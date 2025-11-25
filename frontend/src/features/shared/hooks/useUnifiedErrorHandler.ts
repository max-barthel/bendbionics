import { HTTP_STATUS } from '@/constants/httpStatus';
import { useCallback, useState } from 'react';

export type ErrorType = 'network' | 'validation' | 'server' | 'auth' | 'unknown';

export interface ErrorState {
  type: ErrorType;
  message: string;
  visible: boolean;
  details?: string;
}

export interface UseUnifiedErrorHandlerOptions {
  autoHide?: boolean;
  autoHideDelay?: number;
  onError?: (error: ErrorState) => void;
}

/**
 * Unified Error Handler Hook
 *
 * This hook provides consistent error handling across all components with:
 * - Standardized error types and messages
 * - Automatic error categorization
 * - Consistent error display patterns
 * - Optional auto-hide functionality
 * - Support for both web and desktop environments
 */
export function useUnifiedErrorHandler(options: UseUnifiedErrorHandlerOptions = {}) {
  const { autoHide = true, autoHideDelay = 5000, onError } = options;

  const [error, setError] = useState<ErrorState>({
    type: 'unknown',
    message: '',
    visible: false,
  });

  const showError = useCallback(
    (type: ErrorType, message: string, details?: string) => {
      const errorState: ErrorState = {
        type,
        message,
        visible: true,
        ...(details && { details }),
      };

      setError(errorState);
      onError?.(errorState);

      // Auto-hide error after specified delay
      if (autoHide) {
        setTimeout(() => {
          setError(prev => ({ ...prev, visible: false }));
        }, autoHideDelay);
      }
    },
    [autoHide, autoHideDelay, onError]
  );

  const hideError = useCallback(() => {
    setError(prev => ({ ...prev, visible: false }));
  }, []);

  const clearError = useCallback(() => {
    setError({
      type: 'unknown',
      message: '',
      visible: false,
    });
  }, []);

  // Type guard for error objects
  type ApiErrorData = {
    detail?: string | Array<{ loc: string[]; msg: string; type: string }>;
    message?: string;
  };

  type ApiError = Error & {
    code?: string;
    response?: {
      status: number;
      data?: ApiErrorData;
    };
  };

  const isApiError = useCallback((error: unknown): error is ApiError => {
    return error instanceof Error || (typeof error === 'object' && error !== null);
  }, []);

  // Extract error message from response data
  const extractErrorMessage = useCallback(
    (
      data?: ApiErrorData,
      fallback: string = 'An unexpected error occurred. Please try again.'
    ): string => {
      if (!data) {
        return fallback;
      }

      if (data.detail) {
        if (typeof data.detail === 'string') {
          return data.detail;
        }
        if (Array.isArray(data.detail)) {
          const messages = data.detail
            .map(
              (item: { loc: string[]; msg: string; type: string }) =>
                `${item.loc.join('.')}: ${item.msg}`
            )
            .join(', ');
          return `Validation error: ${messages}`;
        }
      }
      if (data.message) {
        return data.message;
      }
      return fallback;
    },
    []
  );

  // Handle network errors
  const handleNetworkError = useCallback(
    (err: ApiError) => {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        showError(
          'network',
          'Request timed out. Please check your connection and try again.'
        );
        return true;
      }
      if (!err.response) {
        showError(
          'network',
          'Unable to connect to server. Please check your connection.'
        );
        return true;
      }
      return false;
    },
    [showError]
  );

  // Handle server errors
  const handleServerError = useCallback(
    (err: ApiError): boolean => {
      const status = err.response?.status;
      if (status === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
        showError(
          'server',
          'Server error occurred. Please try again later or contact support.'
        );
        return true;
      }
      if (status === HTTP_STATUS.NOT_FOUND) {
        showError('server', 'Service not found. Please check if the backend is running.');
        return true;
      }
      return false;
    },
    [showError]
  );

  // Handle validation errors
  const handleValidationError = useCallback(
    (err: ApiError): boolean => {
      const status = err.response?.status;
      if (
        status === HTTP_STATUS.BAD_REQUEST ||
        status === HTTP_STATUS.UNPROCESSABLE_ENTITY
      ) {
        const defaultMessage =
          'Invalid parameters provided. Please check your input values.';
        const message = extractErrorMessage(err.response?.data, defaultMessage);
        showError('validation', message);
        return true;
      }
      return false;
    },
    [showError, extractErrorMessage]
  );

  // Handle authentication errors
  const handleAuthErrorByStatus = useCallback(
    (err: ApiError): boolean => {
      const status = err.response?.status;
      if (status === HTTP_STATUS.UNAUTHORIZED) {
        showError(
          'auth',
          'Authentication failed. Please check your credentials and try again.'
        );
        return true;
      }
      if (status === HTTP_STATUS.FORBIDDEN) {
        showError(
          'auth',
          "Access denied. You don't have permission to perform this action."
        );
        return true;
      }
      return false;
    },
    [showError]
  );

  // Helper function to handle API errors consistently
  const handleApiError = useCallback(
    (err: unknown, context?: string) => {
      const contextSuffix = context ? ` in ${context}` : '';
      console.error(`API Error${contextSuffix}:`, err);

      if (!isApiError(err)) {
        showError('unknown', 'An unexpected error occurred. Please try again.');
        return;
      }

      // Try to handle by error category (early returns reduce nesting)
      if (handleNetworkError(err)) return;
      if (handleServerError(err)) return;
      if (handleValidationError(err)) return;
      if (handleAuthErrorByStatus(err)) return;

      // Handle unknown errors with message extraction
      const errorMessage = extractErrorMessage(
        err.response?.data,
        err.message || 'An unexpected error occurred. Please try again.'
      );
      showError('unknown', errorMessage);
    },
    [
      showError,
      extractErrorMessage,
      handleAuthErrorByStatus,
      handleNetworkError,
      handleServerError,
      handleValidationError,
      isApiError,
    ]
  );

  // Handle auth-specific status codes
  const handleAuthSpecificError = useCallback(
    (err: ApiError): boolean => {
    const status = err.response?.status;
    if (status === HTTP_STATUS.UNAUTHORIZED) {
      showError(
        'auth',
        'Invalid username or password. Please check your credentials and try again.'
      );
      return true;
    }
    if (status === HTTP_STATUS.BAD_REQUEST) {
      const detail = err.response?.data?.detail;
      const message =
        typeof detail === 'string'
          ? detail
          : 'Account is not active. Please contact support.';
      showError('auth', message);
      return true;
    }
    if (status === HTTP_STATUS.CONFLICT) {
      showError(
        'auth',
        'An account with this username already exists. Please try logging in instead.'
      );
      return true;
    }
    return false;
  },
    [showError]
  );

  // Helper function to handle authentication-specific errors
  const handleAuthError = useCallback(
    (err: unknown) => {
      console.error('Authentication Error:', err);

      if (!isApiError(err)) {
        showError(
          'unknown',
          'An unexpected authentication error occurred. Please try again.'
        );
        return;
      }

      if (!handleAuthSpecificError(err)) {
        handleApiError(err, 'authentication');
      }
    },
    [showError, handleApiError, handleAuthSpecificError, isApiError]
  );

  return {
    // State
    error,

    // Actions
    showError,
    hideError,
    clearError,

    // Helper functions
    handleApiError,
    handleAuthError,
  };
}
