import { useEffect } from 'react';
import { useRobotState } from '../../robot-config/hooks/useRobotState';

// Constants for default values
const DEFAULT_VALUES = {
  SEGMENTS: 5,
  BACKBONE_LENGTH: 0.07,
  COUPLING_LENGTH: 0.03,
  DISCRETIZATION_STEPS: 1000,
  TENDON_COUNT: 3,
  TENDON_RADIUS: 0.01,
  TENDON_OFFSET: 0.0,
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
  return {
    segments,
    bendingAngles: (config['bendingAngles'] as number[]) ?? Array(segments).fill(0),
    rotationAngles: (config['rotationAngles'] as number[]) ?? Array(segments).fill(0),
    backboneLengths:
      (config['backboneLengths'] as number[]) ??
      Array(segments).fill(DEFAULT_VALUES.BACKBONE_LENGTH),
    couplingLengths:
      (config['couplingLengths'] as number[]) ??
      Array(segments + 1).fill(DEFAULT_VALUES.COUPLING_LENGTH),
    discretizationSteps:
      (config['discretizationSteps'] as number) ?? DEFAULT_VALUES.DISCRETIZATION_STEPS,
    tendonConfig: (config['tendonConfig'] as {
      count: number;
      radius: number;
      coupling_offset: number;
    }) ?? {
      count: DEFAULT_VALUES.TENDON_COUNT,
      radius: DEFAULT_VALUES.TENDON_RADIUS,
      coupling_offset: DEFAULT_VALUES.TENDON_OFFSET,
    },
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
  }, [initialConfiguration]);
};
