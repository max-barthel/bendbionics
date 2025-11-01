/**
 * Central Type Exports
 *
 * This module provides a centralized export point for all application types.
 * Import types from here for better maintainability and consistency.
 */

// App types
export type { AppState } from './app';

// Robot types
export type { RobotConfiguration, RobotState } from './robot';

// User types (re-exported from API)
export type { User } from './robot';

