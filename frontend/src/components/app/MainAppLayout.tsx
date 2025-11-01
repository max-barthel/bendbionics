import { useCallback, useRef } from 'react';
import type { FormTabsRef } from '../../features/robot-config/components/FormTabs';
import { useAutoLoadPreset } from '../../hooks/app/useAutoLoadPreset';
import { AppModals } from './AppModals';
import { Sidebar, SidebarToggle } from './Sidebar';
import { UserMenu } from './UserMenu';
import { Visualizer3DWrapper } from './Visualizer3DWrapper';
import type { AppState } from './UserMenu/types';
import type { RobotConfiguration } from '../../types/robot';

interface MainAppLayoutProps {
  readonly appState: AppState;
  readonly handleFormResult: (
    result: number[][][],
    configuration: RobotConfiguration
  ) => void;
  readonly handleLoadPreset: (configuration: RobotConfiguration) => void;
  readonly handleShowPresetManager: () => void;
  readonly toggleSidebar: () => void;
}

export function MainAppLayout({
  appState,
  handleFormResult,
  handleLoadPreset,
  handleShowPresetManager,
  toggleSidebar,
}: Readonly<MainAppLayoutProps>) {
  const formTabsRef = useRef<FormTabsRef>(null as unknown as FormTabsRef);
  const triggerFormCompute = useCallback(() => {
    formTabsRef.current?.handleSubmit();
  }, []);

  // Auto-load a public preset on first visit and trigger computation
  useAutoLoadPreset(
    appState.segments,
    appState.isInitializing,
    handleLoadPreset,
    triggerFormCompute
  );

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
        <Visualizer3DWrapper appState={appState} />
        <Sidebar
          appState={appState}
          handleFormResult={handleFormResult}
          handleLoadPreset={handleLoadPreset}
          handleShowPresetManager={handleShowPresetManager}
          formTabsRef={formTabsRef}
        />
        <SidebarToggle appState={appState} toggleSidebar={toggleSidebar} />
        <UserMenu appState={appState} />
      </div>
      <AppModals
        appState={appState}
        handleLoadPreset={handleLoadPreset}
        setters={{
          setShowPresetManager: appState.setShowPresetManager,
          setShowUserSettings: appState.setShowUserSettings,
        }}
        onAfterLoadPreset={triggerFormCompute}
      />
    </div>
  );
}
