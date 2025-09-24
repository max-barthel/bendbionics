import { invoke } from '@tauri-apps/api/tauri';
import logger from '../utils/logger';

// Constants for error messages
const ERROR_MESSAGES = {
  UNKNOWN_ERROR: 'Unknown error',
} as const;

// Constants for token display
const TOKEN_DISPLAY_LENGTH = 20;

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
    if (process.env.NODE_ENV === 'development') {
      logger.debug(
        'TauriApiClient: localStorage test - stored:',
        testValue,
        'retrieved:',
        retrievedValue
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
      return token.replace(/^"|"$/g, ''); // Remove leading and trailing quotes
    }
  }

  private logTokenDebug(token: string | null): void {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    logger.debug('=== getAuthToken Debug ===');
    logger.debug(
      'localStorage token:',
      localStorage.getItem('token') ? 'EXISTS' : 'NULL'
    );
    logger.debug(
      'sessionStorage token:',
      sessionStorage.getItem('token') ? 'EXISTS' : 'NULL'
    );
    logger.debug(
      'window.authToken:',
      (window as { authToken?: string }).authToken ? 'EXISTS' : 'NULL'
    );
    logger.debug(
      'Final token:',
      token ? `"${token.substring(0, TOKEN_DISPLAY_LENGTH)}..."` : 'NULL'
    );
    logger.debug('Token length:', token ? token.length : 0);
    logger.debug('Token starts with quote:', token ? token.startsWith('"') : false);
    logger.debug('Token ends with quote:', token ? token.endsWith('"') : false);
    logger.debug(
      'Token first 20 chars:',
      token ? token.substring(0, TOKEN_DISPLAY_LENGTH) : 'NULL'
    );
    logger.debug(
      'Token last 20 chars:',
      token ? token.substring(token.length - TOKEN_DISPLAY_LENGTH) : 'NULL'
    );
    logger.debug('========================');
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
      if (process.env.NODE_ENV === 'development') {
        logger.debug(
          `Tauri GET ${endpoint} - Auth token:`,
          authToken
            ? `Bearer ${authToken.substring(0, TOKEN_DISPLAY_LENGTH)}...`
            : 'None'
        );
        logger.debug(
          `Tauri GET ${endpoint} - Auth token passed to Rust:`,
          authToken ? 'YES' : 'NO'
        );
        logger.debug(`Tauri GET ${endpoint} - Auth token type:`, typeof authToken);
        logger.debug(`Tauri GET ${endpoint} - Auth token is null:`, authToken === null);
        logger.debug(
          `Tauri GET ${endpoint} - Auth token is undefined:`,
          authToken === undefined
        );
      }

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
      if (process.env.NODE_ENV === 'development') {
        logger.debug(
          `Tauri POST ${endpoint} - Auth token:`,
          authToken
            ? `Bearer ${authToken.substring(0, TOKEN_DISPLAY_LENGTH)}...`
            : 'None'
        );
        logger.debug(
          `Tauri POST ${endpoint} - Auth token passed to Rust:`,
          authToken ? 'YES' : 'NO'
        );
        logger.debug(`Tauri POST ${endpoint} - Auth token type:`, typeof authToken);
        logger.debug(
          `Tauri POST ${endpoint} - Auth token is null:`,
          authToken === null
        );
        logger.debug(
          `Tauri POST ${endpoint} - Auth token is undefined:`,
          authToken === undefined
        );
      }

      return await invoke<ApiResponse<T>>('call_backend_api', {
        endpoint,
        data,
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

  async put<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.post<T>(endpoint, { ...data, _method: 'PUT' });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const authToken = this.getAuthToken();
      if (process.env.NODE_ENV === 'development') {
        logger.debug(
          `Tauri DELETE ${endpoint} - Auth token:`,
          authToken
            ? `Bearer ${authToken.substring(0, TOKEN_DISPLAY_LENGTH)}...`
            : 'None'
        );
      }

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
