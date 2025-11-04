/**
 * Unit Conversion Constants
 *
 * Centralized conversion factors for angle and length units
 */

// Angle conversion constants
export const DEGREES_TO_RADIANS = Math.PI / 180;
export const RADIANS_TO_DEGREES = 180 / Math.PI;
export const MAX_ANGLE_DEGREES = 180;
export const MAX_ANGLE_RADIANS = Math.PI;

// Length conversion constants (meters is SI base unit)
export const MM_TO_M = 1 / 1000;
export const CM_TO_M = 1 / 100;
export const M_TO_MM = 1000;
export const M_TO_CM = 100;

// Unit types
export const ANGLE_UNITS = ['deg', 'rad'] as const;
export const LENGTH_UNITS = ['mm', 'cm', 'm'] as const;

export type AngleUnit = (typeof ANGLE_UNITS)[number];
export type LengthUnit = (typeof LENGTH_UNITS)[number];
