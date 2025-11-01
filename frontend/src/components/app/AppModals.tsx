import type { RobotConfiguration } from '@/types/robot';
import { Profile } from '../auth/Profile';
import { PresetManagerModal } from './PresetManagerModal';
import type { AppState } from './UserMenu/types';

interface AppModalsProps {
  readonly appState: AppState;
  readonly handleLoadPreset: (configuration: RobotConfiguration) => void;
  readonly setters: {
    readonly setShowPresetManager: (show: boolean) => void;
    readonly setShowUserSettings: (show: boolean) => void;
  };
  readonly onAfterLoadPreset: () => void;
}

export function AppModals({
  appState,
  handleLoadPreset,
  setters,
  onAfterLoadPreset,
}: Readonly<AppModalsProps>) {
  return (
    <>
      <PresetManagerModal
        appState={appState}
        handleLoadPreset={handleLoadPreset}
        setShowPresetManager={setters.setShowPresetManager}
        onAfterLoadPreset={onAfterLoadPreset}
      />
      {appState.showUserSettings && (
        <Profile onClose={() => setters.setShowUserSettings(false)} />
      )}
    </>
  );
}
