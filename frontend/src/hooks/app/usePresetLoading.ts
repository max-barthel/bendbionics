import { useCallback } from 'react';
import { DEFAULT_TIMEOUT, PRESET_LOAD_DELAY } from '@/constants/app';
import type { RobotConfiguration, RobotState } from '@/types/robot';
import { createRobotStateFromConfiguration } from '@/utils/app-helpers';
import logger, { LogContext } from '@/utils/logger';

function handlePresetLoadingCompletion(
  configuration: RobotConfiguration,
  setCurrentConfiguration: (config: RobotConfiguration) => void,
  setPresetLoadKey: (fn: (prev: number) => number) => void,
  setIsLoadingPreset: (loading: boolean) => void
) {
  setCurrentConfiguration(configuration);
  setPresetLoadKey(prev => prev + 1); // Force FormTabs re-render
  if (import.meta.env.DEV) {
    logger.debug('Preset configuration loaded:', LogContext.UI, { configuration });
  }

  // Reset the loading preset flag after a short delay
  setTimeout(() => {
    setIsLoadingPreset(false);
  }, DEFAULT_TIMEOUT);
}

export function usePresetLoading(setters: {
  readonly setSegments: (segments: number[][][]) => void;
  readonly setCurrentConfiguration: (config: RobotConfiguration) => void;
  readonly setIsLoadingPreset: (loading: boolean) => void;
  readonly setPresetLoadKey: (fn: (prev: number) => number) => void;
  readonly setShowTendonResults: (show: boolean) => void;
  readonly setRobotState: (state: RobotState) => void;
}) {
  const handleLoadPreset = useCallback(
    (configuration: RobotConfiguration) => {
      if (import.meta.env.DEV) {
        logger.debug('Loading preset configuration:', LogContext.UI, { configuration });
      }

      // Set loading preset flag to prevent circular updates
      setters.setIsLoadingPreset(true);

      // Clear the visualization immediately
      setters.setSegments([]);

      // Reset the current configuration to ensure clean state
      setters.setCurrentConfiguration({});

      // Create and set robot state
      const newRobotState = createRobotStateFromConfiguration(configuration);

      if (import.meta.env.DEV) {
        logger.debug('Directly setting robot state:', LogContext.UI, { newRobotState });
      }
      setters.setRobotState(newRobotState);

      // Use setTimeout to ensure the reset happens before setting the new configuration
      setTimeout(() => {
        handlePresetLoadingCompletion(
          configuration,
          setters.setCurrentConfiguration,
          setters.setPresetLoadKey,
          setters.setIsLoadingPreset
        );
      }, PRESET_LOAD_DELAY);

      // Auto-unfold tendon results panel if preset contains tendon analysis data
      if (configuration.tendonAnalysis?.actuation_commands) {
        setters.setShowTendonResults(true);
      }
    },
    [setters]
  );

  return { handleLoadPreset };
}
