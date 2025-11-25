import { useRobotState } from '@/features/robot-config/hooks/useRobotState';
import { normalizeTendonRadius } from '@/utils/tendon-helpers';
import { useEffect } from 'react';

// Constants for default values
const DEFAULT_VALUES = {
  SEGMENTS: 5,
  BACKBONE_LENGTH: 0.07,
  COUPLING_LENGTH: 0.03,
  DISCRETIZATION_STEPS: 1000,
  TENDON_COUNT: 3,
  TENDON_RADIUS: 0.01,
} as const;

// Helper function to check if configuration should be loaded
const shouldLoadConfiguration = (config: Record<string, unknown>): boolean => {
  const isPreset = Boolean(config['segments']) && !config['tendonAnalysis'];
  const isReset = Object.keys(config).length === 0;
  return isPreset || isReset;
};

// Helper function to create new state from configuration
const createNewState = (config: Record<string, unknown>) => {
  const segments = (config['segments'] as number) ?? DEFAULT_VALUES.SEGMENTS;
  const couplingCount = segments + 1;

  // Handle tendon config - radius is now always an array (migration handles normalization)
  const tendonConfigRaw = config['tendonConfig'] as
    | {
        count?: number;
        radius?: number | number[];
      }
    | undefined;

  let tendonConfig;
  if (tendonConfigRaw) {
    // Normalize radius to array format (handles single value, array, or undefined)
    const radius = normalizeTendonRadius(
      tendonConfigRaw.radius,
      couplingCount,
      DEFAULT_VALUES.TENDON_RADIUS
    );

    tendonConfig = {
      count: tendonConfigRaw.count ?? DEFAULT_VALUES.TENDON_COUNT,
      radius,
    };
  } else {
    tendonConfig = {
      count: DEFAULT_VALUES.TENDON_COUNT,
      radius: normalizeTendonRadius(undefined, couplingCount, DEFAULT_VALUES.TENDON_RADIUS),
    };
  }

  return {
    segments,
    bendingAngles: (config['bendingAngles'] as number[]) ?? new Array(segments).fill(0),
    rotationAngles:
      (config['rotationAngles'] as number[]) ?? new Array(segments).fill(0),
    backboneLengths:
      (config['backboneLengths'] as number[]) ??
      new Array(segments).fill(DEFAULT_VALUES.BACKBONE_LENGTH),
    couplingLengths:
      (config['couplingLengths'] as number[]) ??
      new Array(segments + 1).fill(DEFAULT_VALUES.COUPLING_LENGTH),
    discretizationSteps:
      (config['discretizationSteps'] as number) ?? DEFAULT_VALUES.DISCRETIZATION_STEPS,
    tendonConfig,
  };
};

export const useConfigurationLoader = (
  initialConfiguration?: Record<string, unknown>
) => {
  const [, setRobotState] = useRobotState();

  useEffect(() => {
    if (initialConfiguration && Object.keys(initialConfiguration).length > 0) {
      const config = initialConfiguration;

      if (shouldLoadConfiguration(config)) {
        const newState = createNewState(config);
        setRobotState(newState);
      }
    }
  }, [initialConfiguration, setRobotState]);
};
