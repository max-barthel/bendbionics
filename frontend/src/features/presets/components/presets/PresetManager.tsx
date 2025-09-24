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
      void loadPresets();
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
      void loadPresets(); // Reload presets
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
      void loadPresets();
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
      void loadPresets();
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
