import { DEFAULT_TENDON_RADIUS } from '@/constants/app';
import type { TendonConfig } from '@/types';

/**
 * Normalize tendon radius to an array format.
 *
 * Converts a single radius value to an array, or ensures the radius array
 * exists with the correct length and default values.
 *
 * @param radius - Radius value (single number, array, or undefined)
 * @param couplingCount - Number of coupling elements (determines array length)
 * @param defaultValue - Default radius value to use when creating new array
 * @returns Normalized radius array
 */
export function normalizeTendonRadius(
  radius: number | number[] | undefined,
  couplingCount: number,
  defaultValue: number = DEFAULT_TENDON_RADIUS
): number[] {
  if (Array.isArray(radius)) {
    if (radius.length < couplingCount) {
      // Extend array with default values
      const additional = new Array(couplingCount - radius.length).fill(defaultValue);
      return [...radius, ...additional];
    } else if (radius.length > couplingCount) {
      // Trim array to correct size
      return radius.slice(0, couplingCount);
    }
    // Array is correct size
    return radius;
  }

  if (typeof radius === 'number') {
    // Convert single value to array
    return new Array(couplingCount).fill(radius);
  }

  // Create new array with default values
  return new Array(couplingCount).fill(defaultValue);
}

/**
 * Ensure tendon configuration is valid with correct radius array.
 *
 * Validates and normalizes the tendon configuration, ensuring the radius
 * array exists and has the correct length for the given coupling count.
 *
 * @param config - Tendon configuration to validate
 * @param couplingCount - Number of coupling elements
 * @returns Validated and normalized tendon configuration
 */
export function ensureValidTendonConfig(
  config: TendonConfig,
  couplingCount: number
): TendonConfig {
  const normalizedRadius = normalizeTendonRadius(
    config.radius,
    couplingCount,
    DEFAULT_TENDON_RADIUS
  );

  return {
    ...config,
    radius: normalizedRadius,
  };
}

