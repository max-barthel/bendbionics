import { useEffect } from 'react';
import { useRobotState } from '../../robot-config/hooks/useRobotState';

export const useConfigurationLoader = (
  initialConfiguration?: Record<string, unknown>
) => {
  const [, setRobotState] = useRobotState();

  useEffect(() => {
    if (initialConfiguration && Object.keys(initialConfiguration).length > 0) {
      const config = initialConfiguration;
      // Loading configuration from initial data

      // Only load if this is a preset (has segments but no tendonAnalysis from computation)
      // or if it's an empty config (reset)
      const isPreset = config.segments && !config.tendonAnalysis;
      const isReset = Object.keys(config).length === 0;

      if (isPreset || isReset) {
        const newState = {
          segments: config.segments ?? 5,
          bendingAngles: config.bendingAngles ?? Array(config.segments ?? 5).fill(0),
          rotationAngles: config.rotationAngles ?? Array(config.segments ?? 5).fill(0),
          backboneLengths:
            config.backboneLengths ?? Array(config.segments ?? 5).fill(0.07),
          couplingLengths:
            config.couplingLengths ?? Array((config.segments ?? 5) + 1).fill(0.03),
          discretizationSteps: config.discretizationSteps ?? 1000,
          tendonConfig: config.tendonConfig ?? {
            count: 3,
            radius: 0.01,
            coupling_offset: 0.0,
          },
        };
        // Setting robot state with new configuration
        setRobotState(newState);
      }
    }
  }, [initialConfiguration, setRobotState]);
};
