import { Input, PrimaryButton, Typography } from '@/components/ui';

interface PresetFormProps {
  readonly presetName: string;
  readonly presetDescription: string;
  readonly error: string;
  readonly isLoading: boolean;
  readonly onNameChange: (value: string) => void;
  readonly onDescriptionChange: (value: string) => void;
  readonly onSave: () => void;
}

export function PresetForm({
  presetName,
  presetDescription,
  error,
  isLoading,
  onNameChange,
  onDescriptionChange,
  onSave,
}: Readonly<PresetFormProps>) {
  return (
    <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl space-y-4 shadow-sm">
      <div className="text-center mb-4">
        <Typography variant="h3" color="primary" className="text-gray-800">
          Save Current Configuration
        </Typography>
      </div>
      <div className="space-y-3">
        <div>
          <label
            htmlFor="preset-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Preset Name *
          </label>
          <Input
            id="preset-name"
            type="text"
            value={presetName}
            onChange={(value: string | number) => onNameChange(String(value))}
            placeholder="Enter preset name"
            className="w-full"
          />
        </div>
        <div>
          <label
            htmlFor="preset-description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description (optional)
          </label>
          <Input
            id="preset-description"
            type="text"
            value={presetDescription}
            onChange={(value: string | number) => onDescriptionChange(String(value))}
            placeholder="Enter description"
            className="w-full"
          />
        </div>
        {error && (
          <Typography variant="body" color="error" className="text-sm">
            {error}
          </Typography>
        )}
        <PrimaryButton onClick={onSave} disabled={isLoading} className="w-full">
          {isLoading ? 'Saving...' : 'Save Preset'}
        </PrimaryButton>
      </div>
    </div>
  );
}
