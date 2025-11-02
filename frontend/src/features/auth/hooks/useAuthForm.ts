import type { ErrorState } from '@/features/shared';
import { useAsyncOperation, useUnifiedErrorHandler } from '@/features/shared';
import { useCallback } from 'react';

/**
 * Options for useAuthForm hook
 */
export interface UseAuthFormOptions<TResult = void> {
  /**
   * Function to execute on successful submission
   */
  readonly onSubmit: () => Promise<TResult>;

  /**
   * Optional validation function called before submission
   * Should return true if validation passes, false otherwise
   * Can also return a Promise<boolean> for async validation
   */
  readonly validate?: () => boolean | Promise<boolean>;

  /**
   * Optional validation error handler (for showing validation errors before async operation)
   * If provided, validation errors will be shown via this handler instead of blocking submission
   */
  readonly onValidationError?: (error: string) => void;

  /**
   * Success callback invoked after successful submission
   */
  readonly onSuccess?: (result: TResult) => void | Promise<void>;

  /**
   * Callback invoked before submission starts (e.g., to clear previous state)
   */
  readonly onStart?: () => void;

  /**
   * Whether to use auth-specific error handling (default: true)
   */
  readonly useAuthErrorHandler?: boolean;
}

/**
 * Return type for useAuthForm hook
 */
export interface UseAuthFormReturn {
  /**
   * Current loading state
   */
  readonly isLoading: boolean;

  /**
   * Error state from unified error handler
   */
  readonly error: ErrorState;

  /**
   * Handle form submission with validation and async operation
   */
  readonly handleSubmit: (e: React.FormEvent) => Promise<void>;

  /**
   * Hide current error
   */
  readonly hideError: () => void;
}

/**
 * Hook for handling authentication form submission with consistent patterns
 *
 * This hook provides:
 * - Form submission handling with preventDefault
 * - Optional validation before submission
 * - Integration with useAsyncOperation for loading/error states
 * - Auth-specific error handling by default
 *
 * @example
 * ```tsx
 * const { isLoading, error, handleSubmit } = useAuthForm({
 *   onSubmit: async () => await login({ username, password }),
 *   validate: () => username.length > 0 && password.length > 0,
 *   onSuccess: () => navigate('/'),
 * });
 *
 * <form onSubmit={handleSubmit}>
 *   ...
 * </form>
 * ```
 */
export function useAuthForm<TResult = void>(
  options: UseAuthFormOptions<TResult>
): UseAuthFormReturn {
  const {
    onSubmit,
    validate,
    onValidationError,
    onSuccess,
    onStart,
    useAuthErrorHandler = true,
  } = options;

  // Create separate error handler for auth-specific errors and validation
  const errorHandler = useUnifiedErrorHandler();

  // Build options object conditionally to satisfy exactOptionalPropertyTypes
  const asyncOperationOptions: Parameters<typeof useAsyncOperation<TResult>>[0] = {
    ...(onSuccess && { onSuccess }),
    ...(onStart && { onStart }),
    ...(useAuthErrorHandler && {
      onError: (err: unknown) => {
        errorHandler.handleAuthError(err);
      },
    }),
  };

  const { isLoading, error, execute, hideError } =
    useAsyncOperation<TResult>(asyncOperationOptions);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Run validation if provided
      if (validate) {
        const validationResult = await Promise.resolve(validate());
        if (!validationResult) {
          // If validation fails and onValidationError is provided, use it
          // Otherwise, validation failure just blocks submission
          if (onValidationError) {
            onValidationError('Validation failed. Please check your input.');
          }
          return;
        }
      }

      await execute(onSubmit);
    },
    [validate, onValidationError, execute, onSubmit]
  );

  return {
    isLoading,
    error,
    handleSubmit,
    hideError,
  };
}

