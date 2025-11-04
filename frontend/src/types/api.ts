/**
 * API-specific types
 *
 * These types represent API request/response structures and are tied to
 * the backend API contract. They should remain in this file or in the
 * api/ directory to indicate their API-specific nature.
 */

import type { User } from './auth';
import type { RobotConfiguration } from './robot';

/**
 * Login request payload
 */
export interface LoginRequest {
  readonly username: string;
  readonly password: string;
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
  readonly username: string;
  readonly email: string;
  readonly password: string;
}

/**
 * Profile update request payload
 */
export interface UpdateProfileRequest {
  readonly username?: string;
  readonly email?: string;
  readonly current_password?: string;
  readonly new_password?: string;
}

/**
 * Authentication response from API
 */
export interface AuthResponse {
  readonly access_token: string;
  readonly token_type: string;
  readonly user: User;
}

/**
 * Registration response from API
 */
export interface RegisterResponse {
  readonly user: User;
  readonly message: string;
}

/**
 * Create preset request payload
 */
export interface CreatePresetRequest {
  readonly name: string;
  readonly description?: string;
  readonly is_public: boolean;
  readonly configuration: RobotConfiguration;
}

/**
 * Update preset request payload
 */
export interface UpdatePresetRequest {
  readonly name?: string;
  readonly description?: string;
  readonly is_public?: boolean;
  readonly configuration?: RobotConfiguration;
}
