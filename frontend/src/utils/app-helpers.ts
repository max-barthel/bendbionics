import {
  DEFAULT_BACKBONE_LENGTH,
  DEFAULT_COUPLING_LENGTH,
  DEFAULT_DISCRETIZATION_STEPS,
  DEFAULT_SEGMENTS,
  DEFAULT_TENDON_COUNT,
  DEFAULT_TENDON_RADIUS,
} from '@/constants/app';
import { normalizeTendonRadius } from '@/utils/tendon-helpers';
import type { RobotConfiguration } from '@/types/robot';

// Helper function to create array with default values
export function createArrayWithDefaults(
  length: number,
  defaultValue: number
): number[] {
  return new Array(length).fill(defaultValue) as number[];
}

// Helper function to create tendon config
export function createTendonConfig(configuration: RobotConfiguration) {
  const segments = configuration.segments ?? DEFAULT_SEGMENTS;
  const couplingCount = segments + 1;

  const tendonConfig = configuration.tendonConfig;
  if (tendonConfig) {
    // Normalize radius to array format (handles single value, array, or undefined)
    const radius = normalizeTendonRadius(
      tendonConfig.radius,
      couplingCount,
      DEFAULT_TENDON_RADIUS
    );

    return {
      count: tendonConfig.count ?? DEFAULT_TENDON_COUNT,
      radius,
    };
  }

  return {
    count: DEFAULT_TENDON_COUNT,
    radius: normalizeTendonRadius(undefined, couplingCount, DEFAULT_TENDON_RADIUS),
  };
}

// Helper function to create robot state from configuration
export function createRobotStateFromConfiguration(configuration: RobotConfiguration) {
  const segments = configuration.segments ?? DEFAULT_SEGMENTS;

  return {
    segments,
    bendingAngles: configuration.bendingAngles ?? createArrayWithDefaults(segments, 0),
    rotationAngles:
      configuration.rotationAngles ?? createArrayWithDefaults(segments, 0),
    backboneLengths:
      configuration.backboneLengths ??
      createArrayWithDefaults(segments, DEFAULT_BACKBONE_LENGTH),
    couplingLengths:
      configuration.couplingLengths ??
      createArrayWithDefaults(segments + 1, DEFAULT_COUPLING_LENGTH),
    discretizationSteps:
      configuration.discretizationSteps ?? DEFAULT_DISCRETIZATION_STEPS,
    tendonConfig: createTendonConfig(configuration),
  };
}
