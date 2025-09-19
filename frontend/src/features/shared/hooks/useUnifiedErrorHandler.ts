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
        details,
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

  // Helper function to handle API errors consistently
  const handleApiError = useCallback(
    (err: unknown, context?: string) => {
      console.error(`API Error${context ? ` in ${context}` : ''}:`, err);

      // Type guard for error objects
      const isError = (
        error: unknown
      ): error is Error & {
        code?: string;
        response?: { status: number; data?: { detail?: string } };
      } => {
        return error instanceof Error || (typeof error === 'object' && error !== null);
      };

      if (!isError(err)) {
        showError('unknown', 'An unexpected error occurred. Please try again.');
        return;
      }

      // Network errors
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        showError(
          'network',
          'Request timed out. Please check your connection and try again.'
        );
      } else if (!err.response) {
        showError(
          'network',
          'Unable to connect to server. Please check your connection.'
        );
      }
      // Server errors
      else if (err.response?.status === 500) {
        showError(
          'server',
          'Server error occurred. Please try again later or contact support.'
        );
      } else if (err.response?.status === 404) {
        showError(
          'server',
          'Service not found. Please check if the backend is running.'
        );
      }
      // Validation errors
      else if (err.response?.status === 400) {
        showError(
          'validation',
          err.response?.data?.detail ||
            'Invalid parameters provided. Please check your input values.'
        );
      }
      // Authentication errors
      else if (err.response?.status === 401) {
        showError(
          'auth',
          'Authentication failed. Please check your credentials and try again.'
        );
      } else if (err.response?.status === 403) {
        showError(
          'auth',
          "Access denied. You don't have permission to perform this action."
        );
      }
      // Unknown errors
      else {
        showError(
          'unknown',
          err.response?.data?.detail ||
            err.message ||
            'An unexpected error occurred. Please try again.'
        );
      }
    },
    [showError]
  );

  // Helper function to handle authentication-specific errors
  const handleAuthError = useCallback(
    (err: unknown) => {
      console.error('Authentication Error:', err);

      // Type guard for error objects
      const isError = (
        error: unknown
      ): error is Error & {
        response?: { status: number; data?: { detail?: string } };
      } => {
        return error instanceof Error || (typeof error === 'object' && error !== null);
      };

      if (!isError(err)) {
        showError(
          'unknown',
          'An unexpected authentication error occurred. Please try again.'
        );
        return;
      }

      if (err.response?.status === 401) {
        showError(
          'auth',
          'Invalid username or password. Please check your credentials and try again.'
        );
      } else if (err.response?.status === 400) {
        showError(
          'auth',
          err.response?.data?.detail || 'Account is not active. Please contact support.'
        );
      } else if (err.response?.status === 409) {
        showError(
          'auth',
          'An account with this username already exists. Please try logging in instead.'
        );
      } else {
        handleApiError(err, 'authentication');
      }
    },
    [showError, handleApiError]
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
