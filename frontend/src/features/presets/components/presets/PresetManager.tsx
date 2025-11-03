import { Button, Typography } from '@/components/ui';
import { usePresetManager } from '@/features/presets/hooks/usePresetManager';
import { buttonVariants } from '@/styles/design-tokens';
import type { Preset } from '@/types';
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
    publicPresets,
    isLoading,
    isLoadingPublic,
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

  return (
    <div className="space-y-6">
      <div className="text-center mb-6 transform-gpu">
        <Typography
          variant="h2"
          color="primary"
          className="mb-2 text-gray-800 drop-shadow-lg"
        >
          Preset Manager
        </Typography>
        <Typography variant="body" color="gray" className="text-gray-600">
          Save and load your robot configurations
        </Typography>
      </div>

      <div className="space-y-4">
        <div className="mb-6 transform-gpu">
          <Typography
            variant="h3"
            color="primary"
            className="text-gray-800 mb-3 drop-shadow-md"
          >
            Your Presets
          </Typography>
          {user && !showSaveForm && (
            <div className="flex justify-center">
              <Button
                variant="icon"
                iconVariant="glass"
                size="sm"
                onClick={() => setShowSaveForm(true)}
                aria-label="Add new preset"
                className="hover:scale-105 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 transform-gpu"
              >
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </Button>
            </div>
          )}
        </div>
        {user ? (
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
            {...(showSaveForm && {
              showSaveForm: true,
              saveFormProps: {
                presetName,
                presetDescription,
                error,
                onNameChange: setPresetName,
                onDescriptionChange: setPresetDescription,
                onSave: handleSavePreset,
                onCancel: () => setShowSaveForm(false),
              },
            })}
          />
        ) : (
          <div className="p-6 bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-xl shadow-2xl shadow-black/10 hover:shadow-2xl hover:shadow-black/15 transition-all duration-300 transform-gpu hover:-translate-y-0.5">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <Typography variant="body" color="gray" className="mb-2">
                  Sign in to save and load your robot configurations
                </Typography>
              </div>
              <div className="flex flex-col items-end gap-2 ml-4">
                <Button
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className={buttonVariants.primary}
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="mb-6 transform-gpu">
          <Typography
            variant="h3"
            color="primary"
            className="text-gray-800 drop-shadow-md"
          >
            Public Presets
          </Typography>
        </div>
        <PresetList
          presets={publicPresets}
          isLoading={isLoadingPublic}
          loadError=""
          editingPreset={null}
          editName=""
          editDescription=""
          onEditNameChange={() => {}}
          onEditDescriptionChange={() => {}}
          onLoad={handleLoadPreset}
          onEdit={() => {}}
          onSaveEdit={() => {}}
          onCancelEdit={() => {}}
          onDelete={() => {}}
          isPublic={true}
        />
      </div>
    </div>
  );
};
