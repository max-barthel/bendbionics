import { Modal } from '@/components/ui';
import { PresetManager } from '@/features/presets/components/presets/PresetManager';
import { useAppState } from '@/providers';

interface PresetManagerModalProps {
  readonly onAfterLoadPreset: () => void;
}

export function PresetManagerModal({
  onAfterLoadPreset,
}: Readonly<PresetManagerModalProps>) {
  const appState = useAppState();

  return (
    <Modal
      isOpen={appState.showPresetManager}
      onClose={() => appState.setShowPresetManager(false)}
      size="md"
    >
      <PresetManager
        currentConfiguration={appState.currentConfiguration as Record<string, unknown>}
        onLoadPreset={config => {
          appState.handleLoadPreset(config);
          appState.setShowPresetManager(false);
          setTimeout(() => {
            onAfterLoadPreset();
          }, 120);
        }}
      />
    </Modal>
  );
}
