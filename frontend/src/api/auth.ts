import { type RobotConfiguration } from '../types/robot';
import { client } from './client';

export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  current_password?: string;
  new_password?: string;
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

export interface RegisterResponse {
  user: User;
  message: string;
}

// Authentication API
export const authAPI = {
  // Register new user
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await client().post<{ data: User; message: string }>(
      '/auth/register',
      data
    );
    return {
      user: response.data.data,
      message: response.data.message,
    };
  },

  // Login user
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await client().post<{ data: AuthResponse }>('/auth/login', data);
    return response.data.data;
  },

  // Get current user info
  getCurrentUser: async (): Promise<User> => {
    const response = await client().get<User>('/auth/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await client().put<{ data: User }>('/auth/me', data);
    return response.data.data;
  },

  // Delete user account
  deleteAccount: async (): Promise<void> => {
    await client().delete('/auth/account');
  },

  // Verify email with token
  verifyEmail: async (token: string): Promise<{ email_verified: boolean }> => {
    const response = await client().post<{ data: { email_verified: boolean } }>(
      `/auth/verify-email?token=${encodeURIComponent(token)}`
    );
    return response.data.data;
  },
};

// Preset API
export const presetAPI = {
  // Get user presets
  getUserPresets: async (): Promise<Preset[]> => {
    const response = await client().get<{ data: Preset[] }>('/presets/');
    return response.data.data;
  },

  // Get public presets
  getPublicPresets: async (): Promise<Preset[]> => {
    const response = await client().get<{ data: Preset[] }>('/presets/public');
    return response.data.data;
  },

  // Get specific preset
  getPreset: async (id: number): Promise<Preset> => {
    const response = await client().get<{ data: Preset }>(`/presets/${id}`);
    return response.data.data;
  },

  // Create new preset
  createPreset: async (data: CreatePresetRequest): Promise<Preset> => {
    const response = await client().post<{ data: Preset }>('/presets/', data);
    return response.data.data;
  },

  // Update preset
  updatePreset: async (id: number, data: UpdatePresetRequest): Promise<Preset> => {
    const response = await client().put<{ data: Preset }>(`/presets/${id}`, data);
    return response.data.data;
  },

  // Delete preset
  deletePreset: async (id: number): Promise<{ message: string }> => {
    const response = await client().delete<{ data: { message: string } }>(
      `/presets/${id}`
    );
    return response.data.data;
  },
};
