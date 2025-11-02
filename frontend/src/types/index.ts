/**
 * Central Type Exports
 *
 * This module provides a centralized export point for all application types.
 * Import types from here for better maintainability and consistency.
 */

// App types
export type { AppState } from './app';

// Auth domain types
export type { Preset, User } from './auth';

// Robot domain types
export type { RobotConfiguration, RobotState } from './robot';

// Tendon domain types
export type { TendonConfig } from './tendon';

// API types (request/response structures)
export type {
  AuthResponse,
  CreatePresetRequest,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  UpdatePresetRequest,
  UpdateProfileRequest,
} from './api';

