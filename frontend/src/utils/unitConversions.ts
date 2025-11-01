/**
 * Unit Conversion Utilities
 *
 * Centralized unit conversion logic for angles and lengths
 */

import {
  ANGLE_UNITS,
  CM_TO_M,
  DEGREES_TO_RADIANS,
  LENGTH_UNITS,
  MM_TO_M,
  M_TO_CM,
  M_TO_MM,
  RADIANS_TO_DEGREES,
  type AngleUnit,
  type LengthUnit,
} from '../constants/unitConversions';

// Angle conversion functions
export const angleConversions = {
  deg: {
    toSI: (value: number): number => value * DEGREES_TO_RADIANS,
    fromSI: (value: number): number => value * RADIANS_TO_DEGREES,
  },
  rad: {
    toSI: (value: number): number => value,
    fromSI: (value: number): number => value,
  },
} as const;

// Length conversion functions (meters is SI base unit)
export const lengthConversions = {
  mm: {
    toSI: (value: number): number => value * MM_TO_M,
    fromSI: (value: number): number => value * M_TO_MM,
  },
  cm: {
    toSI: (value: number): number => value * CM_TO_M,
    fromSI: (value: number): number => value * M_TO_CM,
  },
  m: {
    toSI: (value: number): number => value,
    fromSI: (value: number): number => value,
  },
} as const;

/**
 * Convert a value to SI units (radians for angles, meters for lengths)
 */
export function convertToSI(
  value: number,
  unit: AngleUnit | LengthUnit,
  mode: 'angle' | 'length'
): number {
  if (mode === 'angle') {
    return angleConversions[unit as AngleUnit].toSI(value);
  }
  return lengthConversions[unit as LengthUnit].toSI(value);
}

/**
 * Convert a value from SI units to the specified unit
 */
export function convertFromSI(
  value: number,
  unit: AngleUnit | LengthUnit,
  mode: 'angle' | 'length'
): number {
  if (mode === 'angle') {
    return angleConversions[unit as AngleUnit].fromSI(value);
  }
  return lengthConversions[unit as LengthUnit].fromSI(value);
}

/**
 * Get available units for a given mode
 */
export function getUnits(mode: 'angle' | 'length'): readonly string[] {
  return mode === 'angle' ? ANGLE_UNITS : LENGTH_UNITS;
}

/**
 * Get default unit for a given mode
 */
export function getDefaultUnit(mode: 'angle' | 'length'): AngleUnit | LengthUnit {
  return mode === 'angle' ? 'deg' : 'mm';
}

// Export constants for use in components
export { MAX_ANGLE_DEGREES, MAX_ANGLE_RADIANS } from '../constants/unitConversions';
