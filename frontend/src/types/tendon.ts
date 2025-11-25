/**
 * Tendon configuration domain type
 *
 * Represents the configuration for robot tendon systems.
 */
export interface TendonConfig {
  readonly count: number;
  readonly radius: number[];
}

