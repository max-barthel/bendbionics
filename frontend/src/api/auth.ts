import { client } from './client';
import { tauriClient } from './tauri-client';

export interface User {
    id: number;
    username: string;
    email?: string;
    is_local: boolean;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    email?: string;
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

// Test function to check Tauri availability


// Authentication API
export const authAPI = {
    // Register new user
    register: async (data: RegisterRequest): Promise<User> => {
        const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__;

        if (isTauri) {
            const response = await tauriClient.post<User>('/auth/register', data);
            if (!response.success) {
                throw new Error(response.error || 'Registration failed');
            }
            return response.data as User;
        } else {
            return (await client().post<User>('/auth/register', data)).data;
        }
    },

    // Login user
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__;
        if (isTauri) {
            const response = await tauriClient.post<AuthResponse>('/auth/login', data);

            if (!response.success) {
                throw new Error(response.error || 'Login failed');
            }

            return response.data as AuthResponse;
        } else {
            return (await client().post<AuthResponse>('/auth/login', data)).data;
        }
    },

    // Get current user info
    getCurrentUser: async (): Promise<User> => {
        // Use Tauri client for desktop app, fallback to axios for web
        const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__;
        if (isTauri) {
            const response = await tauriClient.get<User>('/auth/me');
            if (!response.success) {
                throw new Error(response.error || 'Failed to get user info');
            }
            return response.data as User;
        } else {
            const response = await client().get<User>('/auth/me');
            return response.data;
        }
    },

};

// Preset API
export const presetAPI = {
    // Get user presets
    getUserPresets: async (): Promise<Preset[]> => {
        if (typeof window !== 'undefined' && (window as any).__TAURI__) {
            const response = await tauriClient.get<Preset[]>('/presets/');
            if (!response.success) {
                throw new Error(response.error || 'Failed to get presets');
            }
            return response.data as Preset[];
        } else {
            const response = await client().get<Preset[]>('/presets/');
            return response.data;
        }
    },

    // Get public presets
    getPublicPresets: async (): Promise<Preset[]> => {
        if (typeof window !== 'undefined' && (window as any).__TAURI__) {
            const response = await tauriClient.get<Preset[]>('/presets/public');
            if (!response.success) {
                throw new Error(response.error || 'Failed to get public presets');
            }
            return response.data as Preset[];
        } else {
            const response = await client().get<Preset[]>('/presets/public');
            return response.data;
        }
    },

    // Get specific preset
    getPreset: async (id: number): Promise<Preset> => {
        if (typeof window !== 'undefined' && (window as any).__TAURI__) {
            const response = await tauriClient.get<Preset>(`/presets/${id}`);
            if (!response.success) {
                throw new Error(response.error || 'Failed to get preset');
            }
            return response.data as Preset;
        } else {
            const response = await client().get<Preset>(`/presets/${id}`);
            return response.data;
        }
    },

    // Create new preset
    createPreset: async (data: CreatePresetRequest): Promise<Preset> => {
        if (typeof window !== 'undefined' && (window as any).__TAURI__) {
            const response = await tauriClient.post<Preset>('/presets/', data);
            if (!response.success) {
                throw new Error(response.error || 'Failed to create preset');
            }
            return response.data as Preset;
        } else {
            const response = await client().post<Preset>('/presets/', data);
            return response.data;
        }
    },

    // Update preset
    updatePreset: async (id: number, data: UpdatePresetRequest): Promise<Preset> => {
        if (typeof window !== 'undefined' && (window as any).__TAURI__) {
            const response = await tauriClient.put<Preset>(`/presets/${id}`, data);
            if (!response.success) {
                throw new Error(response.error || 'Failed to update preset');
            }
            return response.data as Preset;
        } else {
            const response = await client().put<Preset>(`/presets/${id}`, data);
            return response.data;
        }
    },

    // Delete preset
    deletePreset: async (id: number): Promise<{ message: string }> => {
        if (typeof window !== 'undefined' && (window as any).__TAURI__) {
            const response = await tauriClient.delete<{ message: string }>(`/presets/${id}`);
            if (!response.success) {
                throw new Error(response.error || 'Failed to delete preset');
            }
            return response.data as { message: string };
        } else {
            const response = await client().delete<{ message: string }>(`/presets/${id}`);
            return response.data;
        }
    },
};
