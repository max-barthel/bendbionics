import { FormMessage, Typography } from '@/components/ui';
import type { Preset } from '@/api/auth';
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
      {loadError && (
        <FormMessage message={loadError} type="error" variant="standard" />
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
        />
      ))}
    </div>
  );
}

