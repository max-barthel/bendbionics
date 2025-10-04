import { type RobotConfiguration } from '../types/robot';
import { client } from './client';
import { tauriClient } from './tauri-client';

export interface User {
  id: number;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Preset {
  id: number;
  name: string;
  description?: string;
  is_public: boolean;
  configuration: RobotConfiguration;
  created_at: string;
  updated_at: string;
  user_id: number;
}

export interface CreatePresetRequest {
  name: string;
  description?: string;
  is_public: boolean;
  configuration: RobotConfiguration;
}

export interface UpdatePresetRequest {
  name?: string;
  description?: string;
  is_public?: boolean;
  configuration?: RobotConfiguration;
}

// Test function to check Tauri availability

// Authentication API
export const authAPI = {
  // Register new user
  register: async (data: RegisterRequest): Promise<User> => {
    const isTauri =
      typeof window !== 'undefined' && (window as { __TAURI__?: unknown }).__TAURI__;

    if (isTauri) {
      const response = await tauriClient.post<{ data: User }>('/auth/register', data);
      if (!response.success) {
        throw new Error(response.error ?? 'Registration failed');
      }
      return (response.data as { data: User }).data;
    }
    const response = await client().post<{ data: User }>('/auth/register', data);
    return response.data.data;
  },

  // Login user
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const isTauri =
      typeof window !== 'undefined' && (window as { __TAURI__?: unknown }).__TAURI__;
    if (isTauri) {
      const response = await tauriClient.post<{ data: AuthResponse }>(
        '/auth/login',
        data
      );

      if (!response.success) {
        throw new Error(response.error ?? 'Login failed');
      }

      return (response.data as { data: AuthResponse }).data;
    }
    const response = await client().post<{ data: AuthResponse }>('/auth/login', data);
    return response.data.data;
  },

  // Get current user info
  getCurrentUser: async (): Promise<User> => {
    // Use Tauri client for desktop app, fallback to axios for web
    const isTauri =
      typeof window !== 'undefined' && (window as { __TAURI__?: unknown }).__TAURI__;
    if (isTauri) {
      const response = await tauriClient.get<User>('/auth/me');
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to get user info');
      }
      return response.data as User;
    }
    const response = await client().get<User>('/auth/me');
    return response.data;
  },

  // Delete user account
  deleteAccount: async (): Promise<void> => {
    const isTauri =
      typeof window !== 'undefined' && (window as { __TAURI__?: unknown }).__TAURI__;
    if (isTauri) {
      const response = await tauriClient.delete('/auth/account');
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to delete account');
      }
    } else {
      await client().delete('/auth/account');
    }
  },
};

// Preset API
export const presetAPI = {
  // Get user presets
  getUserPresets: async (): Promise<Preset[]> => {
    if (
      typeof window !== 'undefined' &&
      (window as { __TAURI__?: unknown }).__TAURI__
    ) {
      const response = await tauriClient.get<{ data: Preset[] }>('/presets/');
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to get presets');
      }
      return (response.data as { data: Preset[] }).data;
    }
    const response = await client().get<{ data: Preset[] }>('/presets/');
    return response.data.data;
  },

  // Get public presets
  getPublicPresets: async (): Promise<Preset[]> => {
    if (
      typeof window !== 'undefined' &&
      (window as { __TAURI__?: unknown }).__TAURI__
    ) {
      const response = await tauriClient.get<{ data: Preset[] }>('/presets/public');
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to get public presets');
      }
      return (response.data as { data: Preset[] }).data;
    }
    const response = await client().get<{ data: Preset[] }>('/presets/public');
    return response.data.data;
  },

  // Get specific preset
  getPreset: async (id: number): Promise<Preset> => {
    if (
      typeof window !== 'undefined' &&
      (window as { __TAURI__?: unknown }).__TAURI__
    ) {
      const response = await tauriClient.get<{ data: Preset }>(`/presets/${id}`);
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to get preset');
      }
      return (response.data as { data: Preset }).data;
    }
    const response = await client().get<{ data: Preset }>(`/presets/${id}`);
    return response.data.data;
  },

  // Create new preset
  createPreset: async (data: CreatePresetRequest): Promise<Preset> => {
    if (
      typeof window !== 'undefined' &&
      (window as { __TAURI__?: unknown }).__TAURI__
    ) {
      const response = await tauriClient.post<{ data: Preset }>('/presets/', data);
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to create preset');
      }
      return (response.data as { data: Preset }).data;
    }
    const response = await client().post<{ data: Preset }>('/presets/', data);
    return response.data.data;
  },

  // Update preset
  updatePreset: async (id: number, data: UpdatePresetRequest): Promise<Preset> => {
    if (
      typeof window !== 'undefined' &&
      (window as { __TAURI__?: unknown }).__TAURI__
    ) {
      const response = await tauriClient.put<{ data: Preset }>(`/presets/${id}`, data);
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to update preset');
      }
      return (response.data as { data: Preset }).data;
    }
    const response = await client().put<{ data: Preset }>(`/presets/${id}`, data);
    return response.data.data;
  },

  // Delete preset
  deletePreset: async (id: number): Promise<{ message: string }> => {
    if (
      typeof window !== 'undefined' &&
      (window as { __TAURI__?: unknown }).__TAURI__
    ) {
      const response = await tauriClient.delete<{ data: { message: string } }>(
        `/presets/${id}`
      );
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to delete preset');
      }
      return (response.data as { data: { message: string } }).data;
    }
    const response = await client().delete<{ data: { message: string } }>(
      `/presets/${id}`
    );
    return response.data.data;
  },
};
