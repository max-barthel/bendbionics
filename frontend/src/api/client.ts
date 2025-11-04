import { HTTP_STATUS } from '@/constants/httpStatus';
import type { TendonConfig } from '@/types';
import axios from 'axios';

// Define the PCCParams type to match backend
export interface PCCParams {
  bending_angles: number[];
  rotation_angles: number[];
  backbone_lengths: number[];
  coupling_lengths: number[];
  discretization_steps: number;
  tendon_config?: TendonConfig;
}

// Define the API response type
export interface PCCResponse {
  success: boolean;
  data: {
    segments: number[][][];
  };
  message: string;
  timestamp: string;
  request_id: string | null;
}

// Define tendon analysis response type
export interface TendonAnalysisResponse {
  result: {
    robot_positions: number[][][];
    coupling_data: {
      positions: number[][];
      orientations: number[][][];
    };
    tendon_analysis: {
      segment_lengths: number[][];
      total_lengths: number[][];
      length_changes: number[][];
      routing_points: number[][][][];
    };
    actuation_commands: Record<
      string,
      {
        length_change_m: number;
        pull_direction: string;
        magnitude: number;
      }
    >;
    model_type: string;
    tendon_config: TendonConfig;
  };
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

// Retry configuration constants
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,
  MAX_DELAY: 10000,
  BACKOFF_MULTIPLIER: 2,
} as const;

// API configuration constants
const API_CONFIG = {
  TIMEOUT: 30000,
} as const;

// Default retry configuration
const defaultRetryConfig: RetryConfig = {
  maxRetries: RETRY_CONFIG.MAX_RETRIES,
  baseDelay: RETRY_CONFIG.BASE_DELAY,
  maxDelay: RETRY_CONFIG.MAX_DELAY,
  backoffMultiplier: RETRY_CONFIG.BACKOFF_MULTIPLIER,
  retryableStatusCodes: [
    HTTP_STATUS.REQUEST_TIMEOUT,
    HTTP_STATUS.TOO_MANY_REQUESTS,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    HTTP_STATUS.BAD_GATEWAY,
    HTTP_STATUS.SERVICE_UNAVAILABLE,
    HTTP_STATUS.GATEWAY_TIMEOUT,
  ],
  retryableErrors: ['ECONNABORTED', 'ETIMEDOUT', 'NETWORK_ERROR'],
};

// Check if an error should be retried
function isRetryableError(
  error: { response?: { status?: number }; code?: string },
  config: RetryConfig
): boolean {
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
  let lastError: { response?: { status?: number }; message?: string } | undefined;

  for (let attempt = 1; attempt <= retryConfig.maxRetries + 1; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error as { response?: { status?: number }; message?: string };

      // Stop if max retries reached or error is not retryable
      if (
        attempt > retryConfig.maxRetries ||
        !isRetryableError(lastError, retryConfig)
      ) {
        throw lastError;
      }

      // Log retry attempt (only in development)
      if (import.meta.env.DEV) {
        console.warn(`API retry ${attempt}/${retryConfig.maxRetries + 1}:`, {
          status: lastError.response?.status,
          message: lastError.message,
        });
      }

      // Wait before retrying
      await new Promise(resolve =>
        setTimeout(resolve, calculateDelay(attempt, retryConfig))
      );
    }
  }

  if (lastError) {
    throw lastError;
  }
  throw new Error('All retry attempts failed');
}

// Get API URL dynamically with fallback
function getApiUrl(): string {
  // First priority: Check environment variable (for development)
  if (import.meta.env['VITE_API_URL']) {
    return import.meta.env['VITE_API_URL'] as string;
  }

  // For web app, API is served from the same origin or configured URL
  if (typeof globalThis !== 'undefined') {
    // For web deployment, use the configured API URL
    if ((globalThis as { APP_CONFIG?: { API_URL?: string } }).APP_CONFIG?.API_URL) {
      return (globalThis as unknown as { APP_CONFIG: { API_URL: string } }).APP_CONFIG
        .API_URL;
    }

    // Check if we're running locally or in production
    const currentOrigin = globalThis.location.origin;

    // If we're running locally and no env var is set, use relative URLs
    if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
      return ''; // Empty string means same origin
    }
  }

  // Default fallback for web app
  return '';
}

// Create axios client with retry mechanism for API URL
function createApiClient() {
  const apiUrl = getApiUrl();

  const client = axios.create({
    baseURL: apiUrl,
    timeout: API_CONFIG.TIMEOUT,
  });

  // Add request interceptor for authentication
  client.interceptors.request.use(
    config => {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    error => Promise.reject(error instanceof Error ? error : new Error(String(error)))
  );

  // Add response interceptor for error handling
  client.interceptors.response.use(response => response, handleResponseError);

  return client;
}

// Create client dynamically for each request to ensure config is loaded
function getApiClient() {
  return createApiClient();
}

// Helper function to handle response errors
function handleResponseError(error: {
  response?: { status?: number };
  config?: { url?: string };
}) {
  // Handle 401 Unauthorized - only clear token for authentication endpoints
  // This prevents clearing tokens on temporary server issues for other endpoints
  if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
    const url = error.config?.url || '';

    // Only clear token for authentication-related endpoints
    if (url.includes('/auth/login') || url.includes('/auth/register')) {
      localStorage.removeItem('token');
      console.warn('Authentication failed - token cleared');
    }
    // For other endpoints (like /auth/me), let the component handle the error
    // This prevents automatic logout on temporary server issues
  }

  // Log server errors in development
  if (
    import.meta.env.DEV &&
    error.response?.status === HTTP_STATUS.INTERNAL_SERVER_ERROR
  ) {
    console.error('Server error:', (error.response as { data?: unknown }).data);
  }
  return Promise.reject(
    error instanceof Error ? error : new Error('API request failed')
  );
}

// API methods with retry support
export const robotAPI = {
  computePCC: async (
    params: PCCParams,
    retryConfig?: Partial<RetryConfig>
  ): Promise<PCCResponse> => {
    return withRetry(async () => {
      const client = getApiClient();
      const response = await client.post('/pcc', params);
      return response.data as PCCResponse;
    }, retryConfig);
  },
  computePCCWithTendons: async (
    params: PCCParams,
    retryConfig?: Partial<RetryConfig>
  ): Promise<TendonAnalysisResponse> => {
    return withRetry(async () => {
      const client = getApiClient();
      const response = await client.post('/pcc-with-tendons', params);
      return response.data as TendonAnalysisResponse;
    }, retryConfig);
  },
};

// Export for external use
export { getApiClient as client, defaultRetryConfig };
