import { invoke } from '@tauri-apps/api/tauri';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class TauriApiClient {

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await invoke<ApiResponse<T>>('call_backend_api', {
        endpoint,
        data: null
      });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await invoke<ApiResponse<T>>('call_backend_api', {
        endpoint,
        data
      });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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
