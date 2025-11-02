import { Button, Typography } from '@/components/ui';
import { usePresetManager } from '@/features/presets/hooks/usePresetManager';
import type { Preset } from '@/types';
import { PresetForm } from './PresetForm';
import { PresetList } from './PresetList';

interface PresetManagerProps {
  readonly currentConfiguration: Record<string, unknown>;
  readonly onLoadPreset: (configuration: Record<string, unknown>) => void;
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  currentConfiguration,
  onLoadPreset,
}) => {
  const {
    presets,
    isLoading,
    showSaveForm,
    presetName,
    presetDescription,
    error,
    loadError,
    editingPreset,
    editName,
    editDescription,
    user,
    setShowSaveForm,
    setPresetName,
    setPresetDescription,
    setEditName,
    setEditDescription,
    handleSavePreset,
    handleEditPreset,
    handleCancelEdit,
    handleSaveEdit,
    handleDeletePreset,
    navigate,
  } = usePresetManager(currentConfiguration);

  const handleLoadPreset = (preset: Preset) => {
    onLoadPreset(preset.configuration as Record<string, unknown>);
  };

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <Typography variant="h3" color="primary" className="text-gray-800">
            Preset Manager
          </Typography>
          <Typography variant="body" color="gray" className="text-gray-600">
            Sign in to save and load your robot configurations
          </Typography>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center">
            <Button
              variant="primary"
              onClick={() => navigate('/auth')}
              className="px-6 py-3"
            >
              Sign In to Save Presets
            </Button>
          </div>
          <div className="mt-4">
            <Typography variant="body" color="gray" className="text-sm text-gray-600">
              You can still use the app without signing in!
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Typography variant="h2" color="primary" className="mb-2 text-gray-800">
          Preset Manager
        </Typography>
        <Typography variant="body" color="gray" className="text-gray-600">
          Save and load your robot configurations
        </Typography>
      </div>

      <div className="flex justify-center mb-6">
        <Button variant="primary" onClick={() => setShowSaveForm(!showSaveForm)}>
          {showSaveForm ? 'Cancel' : 'Save Current Configuration'}
        </Button>
      </div>

      {showSaveForm && (
        <PresetForm
          presetName={presetName}
          presetDescription={presetDescription}
          error={error}
          isLoading={isLoading}
          onNameChange={setPresetName}
          onDescriptionChange={setPresetDescription}
          onSave={handleSavePreset}
        />
      )}

      <div className="space-y-4">
        <div className="text-center mb-6">
          <Typography variant="h3" color="primary" className="text-gray-800">
            Your Presets
          </Typography>
        </div>
        <PresetList
          presets={presets}
          isLoading={isLoading}
          loadError={loadError}
          editingPreset={editingPreset}
          editName={editName}
          editDescription={editDescription}
          onEditNameChange={setEditName}
          onEditDescriptionChange={setEditDescription}
          onLoad={handleLoadPreset}
          onEdit={handleEditPreset}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onDelete={handleDeletePreset}
        />
      </div>
    </div>
  );
};
