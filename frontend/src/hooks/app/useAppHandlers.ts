import { useCallback } from 'react';
import type { RobotConfiguration } from '@/types/robot';

export function useAppHandlers(
  state: {
    readonly isLoadingPreset: boolean;
    readonly sidebarCollapsed: boolean;
  },
  setters: {
    readonly setSegments: (segments: number[][][]) => void;
    readonly setCurrentConfiguration: (config: RobotConfiguration) => void;
    readonly setShowTendonResults: (show: boolean) => void;
    readonly setShowPresetManager: (show: boolean) => void;
    readonly setSidebarCollapsed: (collapsed: boolean) => void;
  }
) {
  const handleFormResult = useCallback(
    (result: number[][][], configuration: RobotConfiguration) => {
      setters.setSegments(result);

      // Only update currentConfiguration if we're not loading a preset
      if (!state.isLoadingPreset) {
        setters.setCurrentConfiguration(configuration);
      }
    },
    [setters, state.isLoadingPreset]
  );

  const handleShowPresetManager = useCallback(() => {
    setters.setShowPresetManager(true);
  }, [setters]);

  const toggleSidebar = useCallback(() => {
    setters.setSidebarCollapsed(!state.sidebarCollapsed);
  }, [setters, state.sidebarCollapsed]);

  return {
    handleFormResult,
    handleShowPresetManager,
    toggleSidebar,
  };
}
