import type { FormTabsRef } from '../../../features/robot-config/components/FormTabs';
import FormTabs from '../../../features/robot-config/components/FormTabs';
import type { RobotConfiguration } from '../../../types/robot';
import TahoeGlass from '../../ui/TahoeGlass';
import type { AppState } from '../UserMenu/types';

interface SidebarProps {
  readonly appState: AppState;
  readonly handleFormResult: (
    result: number[][][],
    configuration: RobotConfiguration
  ) => void;
  readonly handleLoadPreset: (configuration: RobotConfiguration) => void;
  readonly handleShowPresetManager: () => void;
  readonly formTabsRef: React.RefObject<FormTabsRef>;
}

export function Sidebar({
  appState,
  handleFormResult,
  handleLoadPreset,
  handleShowPresetManager,
  formTabsRef,
}: Readonly<SidebarProps>) {
  return (
    <div
      className={`fixed top-0 left-0 h-full transition-all duration-300 ease-in-out overflow-hidden z-40 ${
        appState.sidebarCollapsed
          ? 'w-0 -translate-x-full opacity-0'
          : 'w-96 translate-x-0 opacity-100 rounded-r-2xl'
      }`}
    >
      <TahoeGlass
        className="h-full w-96 rounded-r-2xl shadow-2xl p-0 mr-4"
        variant="strong"
        size="sm"
        style={{
          boxShadow:
            '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.3)',
        }}
      >
        <div className="w-full h-full pr-2">
          <FormTabs
            key={appState.presetLoadKey}
            ref={formTabsRef}
            onResult={handleFormResult}
            initialConfiguration={appState.currentConfiguration}
            user={appState.user}
            currentConfiguration={appState.currentConfiguration}
            onLoadPreset={handleLoadPreset}
            navigate={appState.navigate}
            onLoadingChange={appState.setLoading}
            onShowPresetManager={handleShowPresetManager}
          />
        </div>
      </TahoeGlass>
    </div>
  );
}
