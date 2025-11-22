// Constants
export const DEFAULT_SEGMENTS = 5;
export const DEFAULT_BACKBONE_LENGTH = 0.07;
export const DEFAULT_COUPLING_LENGTH = 0.03;
export const DEFAULT_DISCRETIZATION_STEPS = 1000;
export const DEFAULT_TENDON_COUNT = 3;
export const DEFAULT_TENDON_RADIUS = 0.01;
export const DEFAULT_TIMEOUT = 100;

// Default configuration (moved from RobotForm.tsx)
export const DEFAULT_CONFIG = {
  SEGMENTS: 5,
  BENDING_ANGLE: 0.628319, // ~36 degrees in radians
  BACKBONE_LENGTH: 0.07,
  COUPLING_LENGTH: 0.03,
  DISCRETIZATION_STEPS: 1000,
} as const;

// Timing constants
export const INITIALIZATION_DELAY = 0;
export const PRESET_LOAD_DELAY = 10;
