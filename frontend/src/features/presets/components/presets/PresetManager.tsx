import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  authAPI,
  presetAPI,
  type CreatePresetRequest,
  type Preset,
} from '../../../../api/auth';
import { Button, Input, Typography } from '../../../../components/ui';
import { useAuth } from '../../../../providers';

// Save preset form component
interface SavePresetFormProps {
  presetName: string;
  setPresetName: (name: string) => void;
  presetDescription: string;
  setPresetDescription: (description: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const SavePresetForm: React.FC<SavePresetFormProps> = ({
  presetName,
  setPresetName,
  presetDescription,
  setPresetDescription,
  onSave,
  onCancel,
  isLoading,
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
    <Typography variant="h4" className="mb-4 text-gray-800">
      Save New Preset
    </Typography>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preset Name
        </label>
        <Input
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          placeholder="Enter preset name"
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (Optional)
        </label>
        <Input
          value={presetDescription}
          onChange={(e) => setPresetDescription(e.target.value)}
          placeholder="Enter description"
          className="w-full"
        />
      </div>
      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={onSave}
          disabled={!presetName.trim() || isLoading}
          className="flex-1"
        >
          {isLoading ? 'Saving...' : 'Save Preset'}
        </Button>
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  </div>
);

// Preset list component
interface PresetListProps {
  presets: Preset[];
  onLoadPreset: (preset: Preset) => void;
  onEditPreset: (id: number) => void;
  onDeletePreset: (id: number) => void;
  editingPreset: number | null;
  editName: string;
  setEditName: (name: string) => void;
  editDescription: string;
  setEditDescription: (description: string) => void;
  onSaveEdit: (id: number) => void;
  onCancelEdit: () => void;
  isLoading: boolean;
}

const PresetList: React.FC<PresetListProps> = ({
  presets,
  onLoadPreset,
  onEditPreset,
  onDeletePreset,
  editingPreset,
  editName,
  setEditName,
  editDescription,
  setEditDescription,
  onSaveEdit,
  onCancelEdit,
  isLoading,
}) => (
  <div className="space-y-4">
    {presets.map((preset) => (
      <div
        key={preset.id}
        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
      >
        {editingPreset === preset.id ? (
          <div className="space-y-3">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Preset name"
              className="w-full"
            />
            <Input
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description"
              className="w-full"
            />
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={() => onSaveEdit(preset.id)}
                disabled={!editName.trim() || isLoading}
                size="sm"
              >
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={onCancelEdit}
                disabled={isLoading}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Typography variant="h5" className="font-medium text-gray-900">
                {preset.name}
              </Typography>
              {preset.description && (
                <Typography variant="body" className="text-gray-600 mt-1">
                  {preset.description}
                </Typography>
              )}
              <Typography variant="caption" className="text-gray-500 mt-2">
                Created: {new Date(preset.created_at).toLocaleDateString()}
              </Typography>
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                variant="primary"
                onClick={() => onLoadPreset(preset)}
                size="sm"
              >
                Load
              </Button>
              <Button
                variant="secondary"
                onClick={() => onEditPreset(preset.id)}
                size="sm"
              >
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={() => onDeletePreset(preset.id)}
                size="sm"
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    ))}
  </div>
);

// Constants for error messages
const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required. Please sign in again.',
  LOAD_FAILED: 'Failed to load presets. Please try again.',
  SAVE_FAILED: 'Failed to save preset',
  DELETE_FAILED: 'Failed to delete preset',
  UPDATE_FAILED: 'Failed to update preset',
} as const;

// HTTP status codes
const HTTP_STATUS = {
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Type guard for error with response
const isErrorWithResponse = (
  error: unknown
): error is { response: { status: number; data?: unknown } } => {
  return (
    error !== null &&
    typeof error === 'object' &&
    'response' in error &&
    error.response !== null &&
    typeof error.response === 'object' &&
    'status' in error.response
  );
};

interface PresetManagerProps {
  currentConfiguration: Record<string, unknown>;
  onLoadPreset: (configuration: Record<string, unknown>) => void;
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  currentConfiguration,
  onLoadPreset,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [editingPreset, setEditingPreset] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    if (user) {
      loadPresets();
    }
  }, [user, loadPresets]);

  const loadPresets = useCallback(async () => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    try {
      // Test authentication first
      try {
        await authAPI.getCurrentUser();
        // Authentication successful
      } catch {
        // Authentication failed
        setLoadError('Authentication failed. Please sign in again.');
        return;
      }

      const userPresets = await presetAPI.getUserPresets();
      // Presets loaded successfully
      setPresets(userPresets);
      setLoadError(''); // Clear any previous errors
    } catch (error: unknown) {
      // Error handled by error handler
      // Handle 403 Forbidden - user might not be properly authenticated
      if (
        isErrorWithResponse(error) &&
        error.response.status === HTTP_STATUS.FORBIDDEN
      ) {
        setLoadError(ERROR_MESSAGES.AUTH_REQUIRED);
        // Optionally redirect to login
        // navigate("/auth");
      } else {
        setLoadError(ERROR_MESSAGES.LOAD_FAILED);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const handleSavePreset = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!presetName.trim()) {
      setError('Preset name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Debug: Check if user and token exist
      const token = localStorage.getItem('token');
      // Debug logging removed
      // Debug logging removed
      // Debug logging removed

      const newPreset: CreatePresetRequest = {
        name: presetName.trim(),
        description: presetDescription.trim() || undefined,
        is_public: false,
        configuration: currentConfiguration,
      };

      await presetAPI.createPreset(newPreset);
      setPresetName('');
      setPresetDescription('');
      setShowSaveForm(false);
      await loadPresets(); // Reload presets
    } catch (error: unknown) {
      // Error logging removed
      // Handle 403 Forbidden - user might not be properly authenticated
      if (error.response?.status === HTTP_STATUS.FORBIDDEN) {
        setError(ERROR_MESSAGES.AUTH_REQUIRED);
        // Optionally redirect to login
        // navigate("/auth");
      } else {
        setError(error.response?.data?.detail ?? ERROR_MESSAGES.SAVE_FAILED);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadPreset = async (preset: Preset) => {
    try {
      onLoadPreset(preset.configuration);
    } catch (error) {
      // Error logging removed
    }
  };

  const handleEditPreset = (preset: Preset) => {
    setEditingPreset(preset.id);
    setEditName(preset.name);
    setEditDescription(preset.description ?? '');
    setLoadError(''); // Clear any previous errors
  };

  const handleCancelEdit = () => {
    setEditingPreset(null);
    setEditName('');
    setEditDescription('');
  };

  const handleSaveEdit = async (presetId: number) => {
    if (!editName.trim()) {
      setLoadError('Preset name is required');
      return;
    }

    setIsLoading(true);
    setLoadError('');

    try {
      // Debug logging removed
      const updateData = {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      };

      await presetAPI.updatePreset(presetId, updateData);
      // Debug logging removed

      // Reload presets to update the list
      await loadPresets();
      setEditingPreset(null);
      setEditName('');
      setEditDescription('');
    } catch (error: unknown) {
      // Error details handled by error handler

      // Handle different error types
      if (
        isErrorWithResponse(error) &&
        error.response.status === HTTP_STATUS.FORBIDDEN
      ) {
        setLoadError(ERROR_MESSAGES.AUTH_REQUIRED);
      } else if (
        isErrorWithResponse(error) &&
        error.response.status === HTTP_STATUS.NOT_FOUND
      ) {
        setLoadError('Preset not found. It may have been deleted.');
      } else if (
        isErrorWithResponse(error) &&
        error.response.status === HTTP_STATUS.INTERNAL_SERVER_ERROR
      ) {
        setLoadError('Server error. Please try again later.');
      } else {
        setLoadError(`Failed to update preset: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePreset = async (presetId: number) => {
    // Debug logging removed

    if (!user) {
      // Debug logging removed
      navigate('/auth');
      return;
    }

    // Debug logging removed
    const confirmed = await confirm('Are you sure you want to delete this preset?');
    // Debug logging removed

    if (!confirmed) {
      // Debug logging removed
      return;
    }

    // Debug logging removed
    setIsLoading(true);
    setLoadError(''); // Clear any previous errors

    try {
      // Debug logging removed
      const result = await presetAPI.deletePreset(presetId);
      // Debug logging removed

      // Reload presets to update the list
      await loadPresets();
      // Debug logging removed
    } catch (error: unknown) {
      // Error details handled by error handler

      // Handle different error types
      if (
        isErrorWithResponse(error) &&
        error.response.status === HTTP_STATUS.FORBIDDEN
      ) {
        setLoadError(ERROR_MESSAGES.AUTH_REQUIRED);
      } else if (
        isErrorWithResponse(error) &&
        error.response.status === HTTP_STATUS.NOT_FOUND
      ) {
        setLoadError('Preset not found. It may have already been deleted.');
      } else if (
        isErrorWithResponse(error) &&
        error.response.status === HTTP_STATUS.INTERNAL_SERVER_ERROR
      ) {
        setLoadError('Server error. Please try again later.');
      } else {
        setLoadError(`Failed to delete preset: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
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
          <Button
            variant="primary"
            onClick={() => navigate('/auth')}
            className="backdrop-blur-xl border border-blue-400/30 shadow-lg transition-all duration-300 hover:scale-105 rounded-full bg-gradient-to-br from-blue-500/25 to-indigo-500/25 shadow-blue-500/20"
          >
            Sign In to Save Presets
          </Button>
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
        <Button
          variant="primary"
          onClick={() => setShowSaveForm(!showSaveForm)}
          className="backdrop-blur-xl border border-blue-400/30 shadow-lg transition-all duration-300 hover:scale-105 rounded-full bg-gradient-to-br from-blue-500/25 to-indigo-500/25 shadow-blue-500/20"
        >
          {showSaveForm ? 'Cancel' : 'Save Current Configuration'}
        </Button>
      </div>

      {showSaveForm && (
        <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl space-y-4 shadow-sm">
          <div className="text-center mb-4">
            <Typography variant="h3" color="primary" className="text-gray-800">
              Save Current Configuration
            </Typography>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preset Name *
              </label>
              <Input
                type="text"
                value={presetName}
                onChange={(value: string | number) => setPresetName(String(value))}
                placeholder="Enter preset name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <Input
                type="text"
                value={presetDescription}
                onChange={(value: string | number) =>
                  setPresetDescription(String(value))
                }
                placeholder="Enter description"
                className="w-full"
              />
            </div>
            {error && (
              <Typography variant="body" color="error" className="text-sm">
                {error}
              </Typography>
            )}
            <Button
              variant="primary"
              onClick={handleSavePreset}
              disabled={isLoading}
              className="w-full backdrop-blur-xl border border-blue-400/30 shadow-lg transition-all duration-300 hover:scale-105 rounded-full bg-gradient-to-br from-blue-500/25 to-indigo-500/25 shadow-blue-500/20"
            >
              {isLoading ? 'Saving...' : 'Save Preset'}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="text-center mb-6">
          <Typography variant="h3" color="primary" className="text-gray-800">
            Your Presets
          </Typography>
        </div>
        {loadError && (
          <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{loadError}</p>
              </div>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="text-center py-12">
            <Typography variant="body" color="gray" className="text-gray-600">
              Loading presets...
            </Typography>
          </div>
        ) : presets.length === 0 ? (
          <div className="text-center py-12">
            <Typography variant="body" color="gray" className="text-gray-600">
              No presets saved yet. Create your first preset above!
            </Typography>
          </div>
        ) : (
          <div className="space-y-4">
            {presets.map(preset => (
              <div
                key={preset.id}
                className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm"
              >
                {editingPreset === preset.id ? (
                  // Edit form
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preset Name *
                      </label>
                      <Input
                        type="text"
                        value={editName}
                        onChange={(value: string | number) =>
                          setEditName(String(value))
                        }
                        placeholder="Enter preset name"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (optional)
                      </label>
                      <Input
                        type="text"
                        value={editDescription}
                        onChange={(value: string | number) =>
                          setEditDescription(String(value))
                        }
                        placeholder="Enter description"
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSaveEdit(preset.id)}
                        disabled={isLoading}
                        className="backdrop-blur-xl border border-blue-400/30 shadow-lg transition-all duration-300 hover:scale-105 rounded-full bg-gradient-to-br from-blue-500/25 to-indigo-500/25 shadow-blue-500/20"
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={isLoading}
                        className="backdrop-blur-xl border border-white/30 shadow-lg transition-all duration-300 hover:scale-105 rounded-full bg-gradient-to-br from-white/18 to-white/8 shadow-black/10"
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
                      <Typography
                        variant="body"
                        color="gray"
                        className="text-sm opacity-75"
                      >
                        Created: {new Date(preset.created_at).toLocaleDateString()}
                      </Typography>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleLoadPreset(preset)}
                          className="backdrop-blur-xl border border-green-400/30 shadow-lg transition-all duration-300 hover:scale-105 rounded-full bg-gradient-to-br from-green-500/25 to-green-600/25 shadow-green-500/20"
                        >
                          Load
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPreset(preset)}
                          className="backdrop-blur-xl border border-yellow-400/30 shadow-lg transition-all duration-300 hover:scale-105 rounded-full bg-gradient-to-br from-yellow-500/25 to-yellow-600/25 shadow-yellow-500/20"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePreset(preset.id)}
                          className="backdrop-blur-xl border border-red-400/30 shadow-lg transition-all duration-300 hover:scale-105 rounded-full bg-gradient-to-br from-red-500/25 to-red-600/25 shadow-red-500/20"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
