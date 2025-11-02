import type { RobotConfiguration } from './robot';

/**
 * User domain type
 *
 * Represents a user in the system.
 */
export interface User {
  readonly id: number;
  readonly username: string;
  readonly email: string;
  readonly is_active: boolean;
  readonly email_verified: boolean;
  readonly created_at: string;
}

/**
 * Preset domain type
 *
 * Represents a saved robot configuration preset.
 */
export interface Preset {
  readonly id: number;
  readonly name: string;
  readonly description?: string;
  readonly is_public: boolean;
  readonly configuration: RobotConfiguration;
  readonly created_at: string;
  readonly updated_at: string;
  readonly user_id: number;
}

