import { useCallback, useState } from 'react';
import type { ErrorState } from './useUnifiedErrorHandler';
import { useUnifiedErrorHandler } from './useUnifiedErrorHandler';

/**
 * Options for useAsyncOperation hook
 */
export interface UseAsyncOperationOptions<TResult = void> {
  /**
   * Callback invoked on successful operation completion
   */
  readonly onSuccess?: (result: TResult) => void | Promise<void>;

  /**
   * Callback invoked before the operation starts (e.g., to clear previous state)
   */
  readonly onStart?: () => void;

  /**
   * Whether to hide errors automatically before starting operation
   * @default true
   */
  readonly autoHideError?: boolean;

  /**
   * Custom error handler function (overrides default from useUnifiedErrorHandler)
   */
  readonly onError?: (error: unknown) => void;
}

/**
 * Return type for useAsyncOperation hook
 */
export interface UseAsyncOperationReturn<TResult = void> {
  /**
   * Current loading state
   */
  readonly isLoading: boolean;

  /**
   * Error state from unified error handler
   */
  readonly error: ErrorState;

  /**
   * Execute the async operation with automatic loading and error handling
   */
  readonly execute: (operation: () => Promise<TResult>) => Promise<TResult | undefined>;

  /**
   * Hide current error
   */
  readonly hideError: () => void;

  /**
   * Additional error handler methods from useUnifiedErrorHandler
   */
  readonly handleAuthError: (err: unknown) => void;
  readonly handleApiError: (err: unknown, context?: string) => void;
}

/**
 * Generic hook for handling async operations with consistent loading states,
 * error handling, and success callbacks.
 *
 * This hook consolidates the common pattern of:
 * - Managing loading state
 * - Handling errors via unified error handler
 * - Invoking success callbacks
 * - Proper cleanup in finally blocks
 *
 * @example
 * ```tsx
 * const { isLoading, error, execute } = useAsyncOperation({
 *   onSuccess: (result) => navigate('/success'),
 *   onStart: () => setSuccess(''),
 * });
 *
 * const handleSubmit = async () => {
 *   await execute(async () => {
 *     return await api.createItem(data);
 *   });
 * };
 * ```
 */
export function useAsyncOperation<TResult = void>(
  options: UseAsyncOperationOptions<TResult> = {}
): UseAsyncOperationReturn<TResult> {
  const { onSuccess, onStart, autoHideError = true, onError } = options;

  const [isLoading, setIsLoading] = useState(false);
  // useUnifiedErrorHandler is used for error state management
  // Custom onError from useAsyncOperation is handled separately in the catch block
  const errorHandler = useUnifiedErrorHandler();

  const execute = useCallback(
    async (operation: () => Promise<TResult>): Promise<TResult | undefined> => {
      // Clear previous state and errors
      if (autoHideError) {
        errorHandler.hideError();
      }
      onStart?.();

      setIsLoading(true);

      try {
        const result = await operation();
        await onSuccess?.(result);
        return result;
      } catch (err: unknown) {
        // Error handling: use custom handler if provided, otherwise use default
        if (onError) {
          onError(err);
        } else {
          // Use default API error handling from unified error handler
          errorHandler.handleApiError(err);
        }
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onStart, autoHideError, onError, errorHandler]
  );

  return {
    isLoading,
    error: errorHandler.error,
    execute,
    hideError: errorHandler.hideError,
    handleAuthError: errorHandler.handleAuthError,
    handleApiError: errorHandler.handleApiError,
  };
}
