import { useCallback } from 'react';
import type { AppState } from '@/types/app';
import type { RobotConfiguration } from '@/types/robot';

export function useAppHandlers(
  appState: AppState,
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
      if (!appState.isLoadingPreset) {
        setters.setCurrentConfiguration(configuration);
      }
    },
    [setters, appState.isLoadingPreset]
  );

  const handleShowPresetManager = useCallback(() => {
    setters.setShowPresetManager(true);
  }, [setters]);

  const toggleSidebar = useCallback(() => {
    setters.setSidebarCollapsed(!appState.sidebarCollapsed);
  }, [setters, appState.sidebarCollapsed]);

  return {
    handleFormResult,
    handleShowPresetManager,
    toggleSidebar,
  };
}
