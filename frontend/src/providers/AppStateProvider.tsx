import { useRobotState } from '@/features/robot-config/hooks/useRobotState';
import { useAuth } from '@/providers/AuthProvider';
import type { RobotConfiguration, RobotState, User } from '@/types';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppHandlers } from './hooks/useAppHandlers';
import { useAppInitialization } from './hooks/useAppInitialization';
import { usePresetLoading } from './hooks/usePresetLoading';

interface AppStateContextType {
  // Auth-related (from AuthProvider)
  readonly user: User | null;
  readonly isLoading: boolean;
  readonly logout: () => void;
  readonly navigate: (path: string) => void | Promise<void>;

  // Robot state
  readonly segments: number[][][];
  readonly setSegments: (segments: number[][][]) => void;
  readonly currentConfiguration: RobotConfiguration;
  readonly setCurrentConfiguration: (config: RobotConfiguration) => void;
  readonly setRobotState: (state: RobotState) => void;

  // UI state
  readonly isInitializing: boolean;
  readonly setIsInitializing: (initializing: boolean) => void;
  readonly loading: boolean;
  readonly setLoading: (loading: boolean) => void;
  readonly sidebarCollapsed: boolean;
  readonly setSidebarCollapsed: (collapsed: boolean) => void;
  readonly showPresetManager: boolean;
  readonly setShowPresetManager: (show: boolean) => void;
  readonly showTendonResults: boolean;
  readonly setShowTendonResults: (show: boolean) => void;
  readonly showUserSettings: boolean;
  readonly setShowUserSettings: (show: boolean) => void;

  // Preset state
  readonly isLoadingPreset: boolean;
  readonly setIsLoadingPreset: (loading: boolean) => void;
  readonly presetLoadKey: number;
  readonly setPresetLoadKey: (fn: (prev: number) => number) => void;

  // Handlers
  readonly handleFormResult: (
    result: number[][][],
    configuration: RobotConfiguration
  ) => void;
  readonly handleLoadPreset: (configuration: RobotConfiguration) => void;
  readonly handleShowPresetManager: () => void;
  readonly toggleSidebar: () => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

interface AppStateProviderProps {
  readonly children: React.ReactNode;
}

export function AppStateProvider({ children }: AppStateProviderProps) {
  const { user, isLoading, logout } = useAuth();
  const navigateFn = useNavigate();
  // Wrap navigate to match type signature
  const navigate = useCallback(
    (path: string): void | Promise<void> => navigateFn(path),
    [navigateFn]
  );

  // Robot state
  const [segments, setSegments] = useState<number[][][]>([]);
  const [currentConfiguration, setCurrentConfiguration] = useState<RobotConfiguration>(
    {}
  );
  const [, setRobotState] = useRobotState();

  // UI state
  const [isInitializing, setIsInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [showTendonResults, setShowTendonResults] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);

  // Preset state
  const [isLoadingPreset, setIsLoadingPreset] = useState(false);
  const [presetLoadKey, setPresetLoadKey] = useState(0);

  // Initialization
  useAppInitialization(setIsInitializing);

  // Handlers - useAppHandlers and usePresetLoading need the setters
  const { handleLoadPreset } = usePresetLoading({
    setSegments,
    setCurrentConfiguration,
    setIsLoadingPreset,
    setPresetLoadKey,
    setShowTendonResults,
    setRobotState,
  });

  const handlers = useAppHandlers(
    { isLoadingPreset, sidebarCollapsed },
    {
      setSegments,
      setCurrentConfiguration,
      setShowTendonResults,
      setShowPresetManager,
      setSidebarCollapsed,
    }
  );

  const value: AppStateContextType = useMemo(
    () => ({
      // Auth
      user,
      isLoading,
      logout,
      navigate,

      // Robot state
      segments,
      setSegments,
      currentConfiguration,
      setCurrentConfiguration,
      setRobotState,

      // UI state
      isInitializing,
      setIsInitializing,
      loading,
      setLoading,
      sidebarCollapsed,
      setSidebarCollapsed,
      showPresetManager,
      setShowPresetManager,
      showTendonResults,
      setShowTendonResults,
      showUserSettings,
      setShowUserSettings,

      // Preset state
      isLoadingPreset,
      setIsLoadingPreset,
      presetLoadKey,
      setPresetLoadKey,

      // Handlers
      handleFormResult: handlers.handleFormResult,
      handleLoadPreset,
      handleShowPresetManager: handlers.handleShowPresetManager,
      toggleSidebar: handlers.toggleSidebar,
    }),
    [
      user,
      isLoading,
      logout,
      navigate,
      segments,
      currentConfiguration,
      setRobotState,
      isInitializing,
      loading,
      sidebarCollapsed,
      showPresetManager,
      showTendonResults,
      showUserSettings,
      isLoadingPreset,
      presetLoadKey,
      handlers,
      handleLoadPreset,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
