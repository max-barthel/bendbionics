import { invoke } from '@tauri-apps/api/tauri';



export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class TauriApiClient {

  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await invoke<ApiResponse<T>>('call_backend_api', {
        endpoint,
        data: null,
        auth_token: this.getAuthToken()
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
      const response = await invoke<ApiResponse<T>>('call_backend_api', {
        endpoint,
        data,
        auth_token: this.getAuthToken()
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
