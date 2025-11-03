import { Button, Input, Typography } from '@/components/ui';
import { buttonVariants } from '@/styles/design-tokens';
import type { Preset } from '@/types';

interface PresetItemProps {
  readonly preset: Preset;
  readonly isEditing: boolean;
  readonly isLoading: boolean;
  readonly editName: string;
  readonly editDescription: string;
  readonly onNameChange: (value: string) => void;
  readonly onDescriptionChange: (value: string) => void;
  readonly onLoad: (preset: Preset) => void;
  readonly onEdit: (preset: Preset) => void;
  readonly onSaveEdit: (presetId: number) => void;
  readonly onCancelEdit: () => void;
  readonly onDelete: (presetId: number) => void;
  readonly isPublic?: boolean;
}

export function PresetItem({
  preset,
  isEditing,
  isLoading,
  editName,
  editDescription,
  onNameChange,
  onDescriptionChange,
  onLoad,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  isPublic = false,
}: Readonly<PresetItemProps>) {
  return (
    <div className="p-6 bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-xl shadow-2xl shadow-black/10 hover:shadow-2xl hover:shadow-black/15 transition-all duration-300 transform-gpu hover:-translate-y-0.5">
      {isEditing ? (
        // Edit form
        <div className="space-y-4">
          <div>
            <label
              htmlFor="edit-preset-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Preset Name *
            </label>
            <Input
              id="edit-preset-name"
              type="text"
              value={editName}
              onChange={(value: string | number) => onNameChange(String(value))}
              placeholder="Enter preset name"
              className="w-full"
            />
          </div>
          <div>
            <label
              htmlFor="edit-preset-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description (optional)
            </label>
            <Input
              id="edit-preset-description"
              type="text"
              value={editDescription}
              onChange={(value: string | number) => onDescriptionChange(String(value))}
              placeholder="Enter description"
              className="w-full"
            />
          </div>
          <div className="flex gap-2 justify-between">
            <Button
              size="sm"
              onClick={() => onSaveEdit(preset.id)}
              disabled={isLoading}
              className={buttonVariants.load}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
            <Button
              size="sm"
              onClick={onCancelEdit}
              disabled={isLoading}
              className={buttonVariants.delete}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        // Normal view
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Typography variant="h5" color="primary">
                {preset.name}
              </Typography>
            </div>
            {preset.description && (
              <Typography variant="body" color="gray" className="mb-2">
                {preset.description}
              </Typography>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 ml-4">
            <Typography variant="body" color="gray" className="text-sm opacity-75">
              Created:{' '}
              {(() => {
                const date = new Date(preset.created_at);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}.${month}.${year}`;
              })()}
            </Typography>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onLoad(preset)}
                className={buttonVariants.load}
              >
                Load
              </Button>
              {!isPublic && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onEdit(preset)}
                    className={buttonVariants.edit}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onDelete(preset.id)}
                    className={buttonVariants.delete}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
