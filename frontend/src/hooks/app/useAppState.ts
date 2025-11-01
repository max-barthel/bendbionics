import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppState } from '../../components/app/UserMenu/types';
import { useRobotState } from '../../features/robot-config/hooks/useRobotState';
import { useAuth } from '../../providers/AuthProvider';
import type { RobotConfiguration } from '../../types/robot';

export function useAppState(): AppState {
  const { user, isLoading, logout } = useAuth();
  const navigateFn = useNavigate();
  // Wrap navigate to match AppState type signature
  const navigate = (path: string): void | Promise<void> => navigateFn(path);
  const [segments, setSegments] = useState<number[][][]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentConfiguration, setCurrentConfiguration] = useState<RobotConfiguration>(
    {}
  );
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [showTendonResults, setShowTendonResults] = useState(false);
  const [isLoadingPreset, setIsLoadingPreset] = useState(false);
  const [presetLoadKey, setPresetLoadKey] = useState(0);
  const [showUserSettings, setShowUserSettings] = useState(false);

  // Get direct access to robot state for preset loading
  const [, setRobotState] = useRobotState();

  return {
    user,
    isLoading,
    logout,
    navigate,
    segments,
    setSegments,
    isInitializing,
    setIsInitializing,
    loading,
    setLoading,
    sidebarCollapsed,
    setSidebarCollapsed,
    currentConfiguration,
    setCurrentConfiguration,
    showPresetManager,
    setShowPresetManager,
    showTendonResults,
    setShowTendonResults,
    isLoadingPreset,
    setIsLoadingPreset,
    presetLoadKey,
    setPresetLoadKey,
    showUserSettings,
    setShowUserSettings,
    setRobotState,
  };
}
