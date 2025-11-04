import { Button, FormMessage, Input, Typography } from '@/components/ui';
import { buttonVariants } from '@/styles/design-tokens';
import type { Preset } from '@/types';
import { PresetItem } from './PresetItem';

interface PresetListProps {
  readonly presets: Preset[];
  readonly isLoading: boolean;
  readonly loadError: string;
  readonly editingPreset: number | null;
  readonly editName: string;
  readonly editDescription: string;
  readonly onEditNameChange: (value: string) => void;
  readonly onEditDescriptionChange: (value: string) => void;
  readonly onLoad: (preset: Preset) => void;
  readonly onEdit: (preset: Preset) => void;
  readonly onSaveEdit: (presetId: number) => void;
  readonly onCancelEdit: () => void;
  readonly onDelete: (presetId: number) => void;
  readonly isPublic?: boolean;
  readonly showSaveForm?: boolean;
  readonly saveFormProps?: {
    readonly presetName: string;
    readonly presetDescription: string;
    readonly error: string;
    readonly onNameChange: (value: string) => void;
    readonly onDescriptionChange: (value: string) => void;
    readonly onSave: () => void;
    readonly onCancel: () => void;
  };
}

export function PresetList({
  presets,
  isLoading,
  loadError,
  editingPreset,
  editName,
  editDescription,
  onEditNameChange,
  onEditDescriptionChange,
  onLoad,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  isPublic = false,
  showSaveForm = false,
  saveFormProps,
}: Readonly<PresetListProps>) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Typography variant="body" color="gray" className="text-gray-600">
          Loading presets...
        </Typography>
      </div>
    );
  }

  if (presets.length === 0) {
    return (
      <div className="text-center py-12">
        <Typography variant="body" color="gray" className="text-gray-600">
          No presets saved yet. Create your first preset above!
        </Typography>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loadError && <FormMessage message={loadError} type="error" variant="standard" />}
      {showSaveForm && saveFormProps && (
        <div className="p-6 bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-xl shadow-2xl shadow-black/10 hover:shadow-2xl hover:shadow-black/15 transition-all duration-300 transform-gpu hover:-translate-y-0.5">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="save-preset-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Preset Name *
              </label>
              <Input
                id="save-preset-name"
                type="text"
                value={saveFormProps.presetName}
                onChange={(value: string | number) =>
                  saveFormProps.onNameChange(String(value))
                }
                placeholder="Enter preset name"
                className="w-full"
              />
            </div>
            <div>
              <label
                htmlFor="save-preset-description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description (optional)
              </label>
              <Input
                id="save-preset-description"
                type="text"
                value={saveFormProps.presetDescription}
                onChange={(value: string | number) =>
                  saveFormProps.onDescriptionChange(String(value))
                }
                placeholder="Enter description"
                className="w-full"
              />
            </div>
            {saveFormProps.error && (
              <Typography variant="body" color="error" className="text-sm">
                {saveFormProps.error}
              </Typography>
            )}
            <div className="flex gap-2 justify-between">
              <Button
                size="sm"
                onClick={saveFormProps.onSave}
                disabled={isLoading}
                className={buttonVariants.load}
              >
                {isLoading ? 'Saving...' : 'Save Preset'}
              </Button>
              <Button
                size="sm"
                onClick={saveFormProps.onCancel}
                disabled={isLoading}
                className={buttonVariants.delete}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      {presets.map(preset => (
        <PresetItem
          key={preset.id}
          preset={preset}
          isEditing={editingPreset === preset.id}
          isLoading={isLoading}
          editName={editName}
          editDescription={editDescription}
          onNameChange={onEditNameChange}
          onDescriptionChange={onEditDescriptionChange}
          onLoad={onLoad}
          onEdit={onEdit}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onDelete={onDelete}
          isPublic={isPublic}
        />
      ))}
    </div>
  );
}
