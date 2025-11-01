import { PresetManager } from '@/features/presets/components/presets/PresetManager';
import type { RobotConfiguration } from '@/types/robot';
import { Modal } from '@/components/ui';
import type { AppState } from './UserMenu/types';

interface PresetManagerModalProps {
  readonly appState: AppState;
  readonly handleLoadPreset: (configuration: RobotConfiguration) => void;
  readonly setShowPresetManager: (show: boolean) => void;
  readonly onAfterLoadPreset: () => void;
}

export function PresetManagerModal({
  appState,
  handleLoadPreset,
  setShowPresetManager,
  onAfterLoadPreset,
}: Readonly<PresetManagerModalProps>) {
  return (
    <Modal
      isOpen={appState.showPresetManager}
      onClose={() => setShowPresetManager(false)}
      size="lg"
    >
      <PresetManager
        currentConfiguration={appState.currentConfiguration as Record<string, unknown>}
        onLoadPreset={config => {
          handleLoadPreset(config);
          appState.setShowPresetManager(false);
          setTimeout(() => {
            onAfterLoadPreset();
          }, 120);
        }}
      />
    </Modal>
  );
}
