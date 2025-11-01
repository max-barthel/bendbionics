import { useCallback, useState } from 'react';
import {
  defaultRetryConfig,
  robotAPI,
  type PCCParams,
  type PCCResponse,
  type RetryConfig,
} from '@/api/client';

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
          (error as { response?: { data?: { detail?: string } }; message?: string })
            ?.response?.data?.detail ??
          (error as { response?: { data?: { detail?: string } }; message?: string })
            ?.message ??
          'An error occurred';
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
