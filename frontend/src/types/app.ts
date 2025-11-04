import type { User } from '@/api/auth';
import type { RobotState, RobotConfiguration } from '@/types/robot';

export interface AppState {
  readonly user: User | null;
  readonly isLoading: boolean;
  readonly logout: () => void;
  readonly navigate: (path: string) => void | Promise<void>;
  readonly segments: number[][][];
  readonly setSegments: (segments: number[][][]) => void;
  readonly isInitializing: boolean;
  readonly setIsInitializing: (initializing: boolean) => void;
  readonly loading: boolean;
  readonly setLoading: (loading: boolean) => void;
  readonly sidebarCollapsed: boolean;
  readonly setSidebarCollapsed: (collapsed: boolean) => void;
  readonly currentConfiguration: RobotConfiguration;
  readonly setCurrentConfiguration: (config: RobotConfiguration) => void;
  readonly showPresetManager: boolean;
  readonly setShowPresetManager: (show: boolean) => void;
  readonly showTendonResults: boolean;
  readonly setShowTendonResults: (show: boolean) => void;
  readonly isLoadingPreset: boolean;
  readonly setIsLoadingPreset: (loading: boolean) => void;
  readonly presetLoadKey: number;
  readonly setPresetLoadKey: (fn: (prev: number) => number) => void;
  readonly showUserSettings: boolean;
  readonly setShowUserSettings: (show: boolean) => void;
  readonly setRobotState: (state: RobotState) => void;
}

