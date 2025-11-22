import { presetAPI } from '@/api/auth';
import { PRESET_LOAD_DELAY } from '@/constants/app';
import type { RobotConfiguration } from '@/types/robot';
import logger, { LogContext } from '@/utils/logger';
import { useEffect, useRef } from 'react';

export function useAutoLoadPreset(
  segments: number[][][],
  isInitializing: boolean,
  handleLoadPreset: (configuration: RobotConfiguration) => void,
  onPresetLoaded?: () => void
) {
  const hasAutoLoadedRef = useRef(false);

  useEffect(() => {
    // Only auto-load if:
    // 1. App has finished initializing
    // 2. No segments are currently displayed (first load)
    // 3. We haven't already attempted to auto-load
    if (!isInitializing && segments.length === 0 && !hasAutoLoadedRef.current) {
      hasAutoLoadedRef.current = true;

      const loadPublicPreset = async () => {
        try {
          const publicPresets = await presetAPI.getPublicPresets();
          if (publicPresets.length > 0) {
            // Load the first public preset
            const firstPreset = publicPresets[0];
            if (firstPreset?.configuration) {
              try {
                let configuration: RobotConfiguration = {};

                // Handle case where configuration might be a string (shouldn't happen, but safety check)
                if (typeof firstPreset.configuration === 'string') {
                  try {
                    configuration = JSON.parse(firstPreset.configuration) as RobotConfiguration;
                  } catch {
                    if (import.meta.env.DEV) {
                      logger.debug('Failed to parse preset configuration as JSON string', LogContext.UI);
                    }
                    return;
                  }
                } else if (typeof firstPreset.configuration === 'object') {
                  configuration = firstPreset.configuration;
                } else {
                  if (import.meta.env.DEV) {
                    logger.debug('Invalid preset configuration format', LogContext.UI);
                  }
                  return;
                }

                if (import.meta.env.DEV) {
                  logger.debug('Auto-loading public preset:', LogContext.UI, {
                    presetName: firstPreset.name,
                  });
                }
                handleLoadPreset(configuration);

                // Trigger computation after preset load with delay to ensure state is set
                if (onPresetLoaded) {
                  setTimeout(() => {
                    onPresetLoaded();
                  }, PRESET_LOAD_DELAY + 200);
                }
              } catch (error) {
                // Silently fail - if preset can't be loaded, just show the default screen
                if (import.meta.env.DEV) {
                  logger.debug('Error loading preset configuration:', LogContext.UI, {
                    error,
                  });
                }
              }
            }
          }
        } catch (error) {
          // Silently fail - if public presets can't be loaded, just show the default screen
          if (import.meta.env.DEV) {
            logger.debug('Could not auto-load public preset:', LogContext.UI, {
              error,
            });
          }
        }
      };

      // Small delay to ensure app is fully ready
      const timer = setTimeout(() => {
        void loadPublicPreset();
      }, 100);

      return () => clearTimeout(timer);
    }

    // Return undefined if the condition is not met
    return undefined;
  }, [isInitializing, segments.length, handleLoadPreset, onPresetLoaded]);
}
