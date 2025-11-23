import { useCallback, useState } from 'react';
import {
  defaultRetryConfig,
  robotAPI,
  type PCCParams,
  type PCCResponse,
  type RetryConfig,
} from '@/api/client';
import type { ErrorState } from './useUnifiedErrorHandler';
import { useAsyncOperation } from './useAsyncOperation';

interface UseRetryAPIState<T> {
  data: T | null;
}

interface UseRetryAPIReturn<T> extends UseRetryAPIState<T> {
  loading: boolean;
  error: ErrorState;
  execute: (params: PCCParams, retryConfig?: Partial<RetryConfig>) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook for making PCC API calls with retry logic
 *
 * Refactored to use useAsyncOperation internally for consistent error handling
 * via useUnifiedErrorHandler. This ensures all async operations follow the same
 * error handling patterns.
 */
export function useRetryAPI<T = PCCResponse>(
  initialRetryConfig?: Partial<RetryConfig>
): UseRetryAPIReturn<T> {
  const [data, setData] = useState<T | null>(null);

  const { isLoading, error, execute: executeAsync, hideError } = useAsyncOperation<T>({
    onSuccess: result => {
      setData(result as T);
    },
    onStart: () => {
      // Clear data on new execution attempt
    },
  });

  const execute = useCallback(
    async (
      params: PCCParams,
      retryConfig?: Partial<RetryConfig>
    ): Promise<T | null> => {
      const config = { ...defaultRetryConfig, ...initialRetryConfig, ...retryConfig };

      const result = await executeAsync(async () => {
        return (await robotAPI.computeKinematics(params, config)) as T;
      });

      return result ?? null;
    },
    [executeAsync, initialRetryConfig]
  );

  const reset = useCallback(() => {
    setData(null);
    hideError();
  }, [hideError]);

  return {
    data,
    loading: isLoading,
    error,
    execute,
    reset,
  };
}
