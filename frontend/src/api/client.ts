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

// Get API URL dynamically with fallback
function getApiUrl(): string {
  console.log('getApiUrl called');
  console.log('window.APP_CONFIG:', (window as any).APP_CONFIG);

  // Try to get from runtime config first
  if (typeof window !== 'undefined' && (window as any).APP_CONFIG?.API_URL) {
    const url = (window as any).APP_CONFIG.API_URL;
    console.log('Using APP_CONFIG API_URL:', url);
    return url;
  }

  // Fallback to environment variable
  if (import.meta.env.VITE_API_URL) {
    console.log('Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  // Default fallback
  console.log('Using default API_URL: http://localhost:8000');
  return 'http://localhost:8000';
}

// Create axios client with retry mechanism for API URL
function createApiClient() {
  const apiUrl = getApiUrl();
  console.log('Creating API client with URL:', apiUrl);

  const client = axios.create({
    baseURL: apiUrl,
    timeout: 30000,
  });

  // Add request interceptor for authentication
  client.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));

  // Add response interceptor for error handling
  client.interceptors.response.use((response) => response, handleResponseError);

  return client;
}

// Create client dynamically for each request to ensure config is loaded
function getApiClient() {
  return createApiClient();
}

// Helper function to add authentication token to requests
function addAuthToken(config: any) {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

// Helper function to handle response errors
function handleResponseError(error: any) {
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
  computePCC: async (params: PCCParams, retryConfig?: Partial<RetryConfig>): Promise<PCCResponse> => {
    return withRetry(
      async () => {
        const client = getApiClient();
        const response = await client.post('/pcc', params);
        return response.data as PCCResponse;
      },
      retryConfig
    );
  }
};

// Export for external use
export { getApiClient as client, defaultRetryConfig };

