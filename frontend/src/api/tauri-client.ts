import { invoke } from '@tauri-apps/api/tauri';



export interface ApiResponse<T = any> {
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
    console.log('TauriApiClient: localStorage test - stored:', testValue, 'retrieved:', retrievedValue);
  }

  private getAuthToken(): string | null {
    // Try multiple ways to get the token
    let token = localStorage.getItem('token');

    // If localStorage doesn't work, try sessionStorage
    if (!token) {
      token = sessionStorage.getItem('token');
    }

    // If still no token, try to get it from the AuthProvider context
    if (!token && typeof window !== 'undefined' && (window as any).__TAURI__) {
      // For Tauri, we might need to use a different approach
      // Let's try to get it from the global state
      token = (window as any).authToken || null;
    }

    // Clean the token - remove any extra quotes and parse if needed
    if (token) {
      // First try to parse as JSON in case it's stringified
      try {
        const parsed = JSON.parse(token);
        token = parsed;
      } catch (e) {
        // If not JSON, just remove quotes
        if (token) {
          token = token.replace(/^"|"$/g, ''); // Remove leading and trailing quotes
        }
      }
    }

    // Debug: Log all storage methods
    console.log('=== getAuthToken Debug ===');
    console.log('localStorage token:', localStorage.getItem('token') ? 'EXISTS' : 'NULL');
    console.log('sessionStorage token:', sessionStorage.getItem('token') ? 'EXISTS' : 'NULL');
    console.log('window.authToken:', (window as any).authToken ? 'EXISTS' : 'NULL');
    console.log('Final token:', token ? `"${token.substring(0, 20)}..."` : 'NULL');
    console.log('Token length:', token ? token.length : 0);
    console.log('Token starts with quote:', token ? token.startsWith('"') : false);
    console.log('Token ends with quote:', token ? token.endsWith('"') : false);
    console.log('Token first 20 chars:', token ? token.substring(0, 20) : 'NULL');
    console.log('Token last 20 chars:', token ? token.substring(token.length - 20) : 'NULL');
    console.log('========================');

    return token;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const authToken = this.getAuthToken();
      console.log(`Tauri GET ${endpoint} - Auth token:`, authToken ? `Bearer ${authToken.substring(0, 20)}...` : 'None');
      console.log(`Tauri GET ${endpoint} - Auth token passed to Rust:`, authToken ? 'YES' : 'NO');
      console.log(`Tauri GET ${endpoint} - Auth token type:`, typeof authToken);
      console.log(`Tauri GET ${endpoint} - Auth token is null:`, authToken === null);
      console.log(`Tauri GET ${endpoint} - Auth token is undefined:`, authToken === undefined);

      const response = await invoke<ApiResponse<T>>('call_backend_api', {
        endpoint,
        data: null,
        auth_token: authToken || null,
        token: authToken || null  // Try alternative parameter name
      });

      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMsg
      };
    }
  }



  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const authToken = this.getAuthToken();
      console.log(`Tauri POST ${endpoint} - Auth token:`, authToken ? `Bearer ${authToken.substring(0, 20)}...` : 'None');
      console.log(`Tauri POST ${endpoint} - Auth token passed to Rust:`, authToken ? 'YES' : 'NO');
      console.log(`Tauri POST ${endpoint} - Auth token type:`, typeof authToken);
      console.log(`Tauri POST ${endpoint} - Auth token is null:`, authToken === null);
      console.log(`Tauri POST ${endpoint} - Auth token is undefined:`, authToken === undefined);

      const response = await invoke<ApiResponse<T>>('call_backend_api', {
        endpoint,
        data,
        auth_token: authToken || null,
        token: authToken || null  // Try alternative parameter name
      });
      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.post<T>(endpoint, { ...data, _method: 'PUT' });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.get<T>(`${endpoint}?_method=DELETE`);
  }
}

export const tauriClient = new TauriApiClient();
