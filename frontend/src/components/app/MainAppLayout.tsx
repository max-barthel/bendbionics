import type { FormTabsRef } from '@/features/robot-config/components/FormTabs';
import { useAutoLoadPreset } from '@/hooks/app/useAutoLoadPreset';
import { useAppState } from '@/providers';
import { backgroundGradients } from '@/styles/design-tokens';
import { useCallback, useRef } from 'react';
import { AppModals } from './AppModals';
import { Sidebar, SidebarToggle } from './Sidebar';
import { UserMenu } from './UserMenu';
import { Visualizer3DWrapper } from './Visualizer3DWrapper';

export function MainAppLayout() {
  const appState = useAppState();
  const formTabsRef = useRef<FormTabsRef>(null as unknown as FormTabsRef);
  const triggerFormCompute = useCallback(() => {
    formTabsRef.current?.handleSubmit();
  }, []);

  // Auto-load a public preset on first visit and trigger computation
  useAutoLoadPreset(
    appState.segments,
    appState.isInitializing,
    appState.handleLoadPreset,
    triggerFormCompute
  );

  return (
    <div className="h-screen flex flex-col">
      <div
        className={`flex-1 ${backgroundGradients.appBackground} relative overflow-hidden`}
      >
        <Visualizer3DWrapper />
        <Sidebar formTabsRef={formTabsRef} />
        <SidebarToggle />
        <UserMenu />
      </div>
      <AppModals onAfterLoadPreset={triggerFormCompute} />
    </div>
  );
}
