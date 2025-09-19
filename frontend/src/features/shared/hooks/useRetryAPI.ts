import { useCallback, useState } from 'react';
import type { PCCParams, PCCResponse, RetryConfig } from '../../../api/client';
import { defaultRetryConfig, robotAPI } from '../../../api/client';

interface UseRetryAPIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseRetryAPIReturn<T> extends UseRetryAPIState<T> {
  execute: (params: PCCParams, retryConfig?: Partial<RetryConfig>) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook for making PCC API calls with retry logic
 */
export function useRetryAPI<T = PCCResponse>(
  initialRetryConfig?: Partial<RetryConfig>
): UseRetryAPIReturn<T> {
  const [state, setState] = useState<UseRetryAPIState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (
      params: PCCParams,
      retryConfig?: Partial<RetryConfig>
    ): Promise<T | null> => {
      const config = { ...defaultRetryConfig, ...initialRetryConfig, ...retryConfig };

      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const result = await robotAPI.computePCC(params, config);
        setState(prev => ({
          ...prev,
          data: result as T,
          loading: false,
          error: null,
        }));
        return result as T;
      } catch (error: unknown) {
        const errorMessage =
          error.response?.data?.detail || error.message || 'An error occurred';
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        return null;
      }
    },
    [initialRetryConfig]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
