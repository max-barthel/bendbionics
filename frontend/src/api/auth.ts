import { client } from './client';

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface Preset {
  id: number;
  name: string;
  description?: string;
  is_public: boolean;
  configuration: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_id: number;
}

export interface CreatePresetRequest {
  name: string;
  description?: string;
  is_public: boolean;
  configuration: Record<string, any>;
}

export interface UpdatePresetRequest {
  name?: string;
  description?: string;
  is_public?: boolean;
  configuration?: Record<string, any>;
}

// Authentication API
export const authAPI = {
  // Register new user
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await client.post<User>('/auth/register', data);
    return response.data;
  },

  // Login user
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  // Verify email
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await client.post<{ message: string }>('/auth/verify-email', { token });
    return response.data;
  },

  // Get current user info
  getCurrentUser: async (): Promise<User> => {
    const response = await client.get<User>('/auth/me');
    return response.data;
  },
};

// Preset API
export const presetAPI = {
  // Get user presets
  getUserPresets: async (): Promise<Preset[]> => {
    const response = await client.get<Preset[]>('/presets/');
    return response.data;
  },

  // Get public presets
  getPublicPresets: async (): Promise<Preset[]> => {
    const response = await client.get<Preset[]>('/presets/public');
    return response.data;
  },

  // Get specific preset
  getPreset: async (id: number): Promise<Preset> => {
    const response = await client.get<Preset>(`/presets/${id}`);
    return response.data;
  },

  // Create new preset
  createPreset: async (data: CreatePresetRequest): Promise<Preset> => {
    const response = await client.post<Preset>('/presets/', data);
    return response.data;
  },

  // Update preset
  updatePreset: async (id: number, data: UpdatePresetRequest): Promise<Preset> => {
    const response = await client.put<Preset>(`/presets/${id}`, data);
    return response.data;
  },

  // Delete preset
  deletePreset: async (id: number): Promise<{ message: string }> => {
    const response = await client.delete<{ message: string }>(`/presets/${id}`);
    return response.data;
  },
};
