import axios from 'axios';

// Define the PCCParams type to match backend
export interface PCCParams {
  bending_angles: number[];
  rotation_angles: number[];
  backbone_lengths: number[];
  coupling_lengths: number[];
  discretization_steps: number;
}

// Define the API response type
export interface PCCResponse {
  segments: number[][][];
}

// Retry configuration interface
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
  retryableErrors: string[];
}

// Default retry configuration
const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNABORTED', 'ETIMEDOUT', 'NETWORK_ERROR']
};

// Check if an error should be retried
function isRetryableError(error: any, config: RetryConfig): boolean {
  // Network errors
  if (!error.response && error.code) {
    return config.retryableErrors.includes(error.code);
  }

  // HTTP status codes
  if (error.response?.status) {
    return config.retryableStatusCodes.includes(error.response.status);
  }

  // Timeout errors
  return error.code === 'ECONNABORTED';
}

// Calculate delay with exponential backoff
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

// Retry wrapper with exponential backoff
async function withRetry<T>(
  apiCall: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...defaultRetryConfig, ...config };
  let lastError: any;

  for (let attempt = 1; attempt <= retryConfig.maxRetries + 1; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      // Stop if max retries reached or error is not retryable
      if (attempt > retryConfig.maxRetries || !isRetryableError(lastError, retryConfig)) {
        throw lastError;
      }

      // Log retry attempt (only in development)
      if (import.meta.env.DEV) {
        console.warn(`API retry ${attempt}/${retryConfig.maxRetries + 1}:`, {
          status: lastError.response?.status,
          message: lastError.message
        });
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, calculateDelay(attempt, retryConfig)));
    }
  }

  throw lastError!;
}

// Configure axios client
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log server errors in development
    if (import.meta.env.DEV && error.response?.status === 500) {
      console.error('Server error:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// API methods with retry support
export const robotAPI = {
  computePCC: async (params: PCCParams, retryConfig?: Partial<RetryConfig>): Promise<PCCResponse> => {
    return withRetry(
      async () => {
        const response = await apiClient.post('/pcc', params);
        return response.data as PCCResponse;
      },
      retryConfig
    );
  }
};

// Export for external use
export { defaultRetryConfig };
