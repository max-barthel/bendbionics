import axios from 'axios';
import { tauriClient } from './tauri-client';

// Define the PCCParams type to match backend
export interface PCCParams {
  bending_angles: number[];
  rotation_angles: number[];
  backbone_lengths: number[];
  coupling_lengths: number[];
  discretization_steps: number;
  tendon_config?: TendonConfig;
}

// Define tendon configuration types
export interface TendonConfig {
  count: number;
  radius: number;
  coupling_offset: number;
}

// Define the API response type
export interface PCCResponse {
  segments: number[][][];
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

// Default retry configuration
const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNABORTED', 'ETIMEDOUT', 'NETWORK_ERROR'],
};

// Check if an error should be retried
function isRetryableError(
  error: { response?: unknown; code?: string },
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
  let lastError: unknown;

  for (let attempt = 1; attempt <= retryConfig.maxRetries + 1; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

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

  if (lastError) {throw lastError;}
  throw new Error('All retry attempts failed');
}

// Get API URL dynamically with fallback
function getApiUrl(): string {
  // For desktop app, API is served from the same origin
  if (typeof window !== 'undefined') {
    // Check if we're running in the desktop app (same origin)
    const currentOrigin = window.location.origin;

    // If we're running locally or in the desktop app, use relative URLs
    if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
      return ''; // Empty string means same origin
    }

    // For web deployment, use the configured API URL
    if ((window as { APP_CONFIG?: { API_URL?: string } }).APP_CONFIG?.API_URL) {
      return (window as { APP_CONFIG: { API_URL: string } }).APP_CONFIG.API_URL;
    }
  }

  // Fallback to environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Default fallback for desktop app
  return '';
}

// Create axios client with retry mechanism for API URL
function createApiClient() {
  const apiUrl = getApiUrl();

  const client = axios.create({
    baseURL: apiUrl,
    timeout: 30000,
  });

  // Add request interceptor for authentication
  client.interceptors.request.use(addAuthToken, error => Promise.reject(error));

  // Add response interceptor for error handling
  client.interceptors.response.use(response => response, handleResponseError);

  return client;
}

// Create client dynamically for each request to ensure config is loaded
function getApiClient() {
  return createApiClient();
}

// Helper function to add authentication token to requests
function addAuthToken(config: { headers?: Record<string, string> }) {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

// Helper function to handle response errors
function handleResponseError(error: { response?: { status?: number } }) {
  // Handle 401 Unauthorized - clear token but don't redirect automatically
  // Let individual components handle the error appropriately
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    // Don't automatically redirect - let the component handle it
  }

  // Log server errors in development
  if (import.meta.env.DEV && error.response?.status === 500) {
    console.error('Server error:', error.response.data);
  }
  return Promise.reject(error);
}

// API methods with retry support
export const robotAPI = {
  computePCC: async (
    params: PCCParams,
    retryConfig?: Partial<RetryConfig>
  ): Promise<PCCResponse> => {
    return withRetry(async () => {
      // Use Tauri client for desktop app, fallback to axios for web
      if (
        typeof window !== 'undefined' &&
        (window as { __TAURI__?: unknown }).__TAURI__
      ) {
        const response = await tauriClient.post<PCCResponse>('/pcc', params);
        if (!response.success) {
          throw new Error(response.error ?? 'API call failed');
        }
        return response.data as PCCResponse;
      }
      // Fallback to axios for web development
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
      // Use Tauri client for desktop app, fallback to axios for web
      if (
        typeof window !== 'undefined' &&
        (window as { __TAURI__?: unknown }).__TAURI__
      ) {
        const response = await tauriClient.post<TendonAnalysisResponse>(
          '/pcc-with-tendons',
          params
        );
        if (!response.success) {
          throw new Error(response.error ?? 'API call failed');
        }
        return response.data as TendonAnalysisResponse;
      }
      // Fallback to axios for web development
      const client = getApiClient();
      const response = await client.post('/pcc-with-tendons', params);
      return response.data as TendonAnalysisResponse;
    }, retryConfig);
  },
};

// Export for external use
export { getApiClient as client, defaultRetryConfig };
