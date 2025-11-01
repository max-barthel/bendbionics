import { Profile } from '../auth/Profile';
import { PresetManagerModal } from './PresetManagerModal';
import { useAppState } from '@/providers';

interface AppModalsProps {
  readonly onAfterLoadPreset: () => void;
}

export function AppModals({ onAfterLoadPreset }: Readonly<AppModalsProps>) {
  const appState = useAppState();

  return (
    <>
      <PresetManagerModal onAfterLoadPreset={onAfterLoadPreset} />
      {appState.showUserSettings && (
        <Profile onClose={() => appState.setShowUserSettings(false)} />
      )}
    </>
  );
}
