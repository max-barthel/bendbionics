import { invoke } from '@tauri-apps/api/tauri';
import logger from '../utils/logger';

// Constants for error messages
const ERROR_MESSAGES = {
  UNKNOWN_ERROR: 'Unknown error',
} as const;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export class TauriApiClient {
  constructor() {
    // Test localStorage functionality once on initialization
    const testKey = 'tauri_test';
    const testValue = 'test_value';
    localStorage.setItem(testKey, testValue);
    const retrievedValue = localStorage.getItem(testKey);
    // Only log if localStorage test fails
    if (import.meta.env.DEV && retrievedValue !== testValue) {
      logger.debug(
        `TauriApiClient: localStorage test failed - stored: ${testValue}, retrieved: ${retrievedValue}`
      );
    }
  }

  private getTokenFromStorage(): string | null {
    let token = localStorage.getItem('token');
    token ??= sessionStorage.getItem('token');
    return token;
  }

  private getTokenFromWindow(): string | null {
    if (
      typeof window !== 'undefined' &&
      (window as { __TAURI__?: unknown }).__TAURI__
    ) {
      return (window as { authToken?: string }).authToken ?? null;
    }
    return null;
  }

  private cleanToken(token: string): string {
    try {
      return JSON.parse(token) as string;
    } catch {
      return token.replace(/(^"|"$)/g, ''); // Remove leading and trailing quotes
    }
  }

  private logTokenDebug(token: string | null): void {
    // Only log token debug info if there's an issue
    if (import.meta.env.DEV && token && token.length > 0) {
      // Only log if token has unexpected format
      if (token.startsWith('"') || token.endsWith('"')) {
        logger.debug(`Token format issue detected: ${token.substring(0, 20)}...`);
      }
    }
  }

  private getAuthToken(): string | null {
    // Try multiple ways to get the token
    let token = this.getTokenFromStorage();

    // If still no token, try to get it from the AuthProvider context
    token ??= this.getTokenFromWindow();

    // Clean the token - remove any extra quotes and parse if needed
    if (token) {
      token = this.cleanToken(token);
    }

    // Debug: Log all storage methods (only in development)
    this.logTokenDebug(token);

    return token;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const authToken = this.getAuthToken();

      return await invoke<ApiResponse<T>>('call_backend_api', {
        endpoint,
        data: null,
        auth_token: authToken ?? null,
        token: authToken ?? null, // Try alternative parameter name
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    try {
      const authToken = this.getAuthToken();

      return await invoke<ApiResponse<T>>('call_backend_api', {
        endpoint,
        data: data,
        auth_token: authToken ?? null,
        token: authToken ?? null, // Try alternative parameter name
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  async put<T>(endpoint: string, _data: unknown): Promise<ApiResponse<T>> {
    return this.post<T>(endpoint, {
      ...(_data as Record<string, unknown>),
      _method: 'PUT',
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const authToken = this.getAuthToken();

      return await invoke<ApiResponse<T>>('call_backend_api', {
        endpoint,
        data: { _method: 'DELETE' },
        auth_token: authToken ?? null,
        token: authToken ?? null,
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      return {
        success: false,
        error: errorMsg,
      };
    }
  }
}

export const tauriClient = new TauriApiClient();
