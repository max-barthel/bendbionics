import { Profile } from '@/components/auth/Profile';
import { useAppState } from '@/providers';
import { PresetManagerModal } from './PresetManagerModal';

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
