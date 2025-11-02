import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CreatePresetRequest, Preset } from '@/types';
import { authAPI, presetAPI } from '@/api/auth';
import { useAuth } from '@/providers';
import { ERROR_MESSAGES } from '@/constants/errorMessages';
import { HTTP_STATUS } from '@/constants/httpStatus';

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

export function usePresetManager(currentConfiguration: Record<string, unknown>) {
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
      // Handle 403 Forbidden - user might not be properly authenticated
      if (
        isErrorWithResponse(error) &&
        error.response.status === HTTP_STATUS.FORBIDDEN
      ) {
        setLoadError(ERROR_MESSAGES.AUTH_REQUIRED);
      } else {
        setLoadError(ERROR_MESSAGES.LOAD_FAILED);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void loadPresets();
    }
  }, [user, loadPresets]);

  const handleSavePreset = useCallback(async () => {
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
      const newPreset: CreatePresetRequest = {
        name: presetName.trim(),
        ...(presetDescription.trim() && { description: presetDescription.trim() }),
        is_public: false,
        configuration: currentConfiguration,
      };

      await presetAPI.createPreset(newPreset);
      setPresetName('');
      setPresetDescription('');
      setShowSaveForm(false);
      void loadPresets(); // Reload presets
    } catch (err: unknown) {
      const error = err as {
        response?: { status: number; data?: { detail?: string } };
      };
      // Handle 403 Forbidden - user might not be properly authenticated
      if (error.response?.status === HTTP_STATUS.FORBIDDEN) {
        setError(ERROR_MESSAGES.AUTH_REQUIRED);
      } else {
        setError(error.response?.data?.detail ?? ERROR_MESSAGES.SAVE_FAILED);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, presetName, presetDescription, currentConfiguration, navigate, loadPresets]);

  const handleEditPreset = useCallback((preset: Preset) => {
    setEditingPreset(preset.id);
    setEditName(preset.name);
    setEditDescription(preset.description ?? '');
    setLoadError(''); // Clear any previous errors
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingPreset(null);
    setEditName('');
    setEditDescription('');
  }, []);

  const handleSaveEdit = useCallback(
    async (presetId: number) => {
      if (!editName.trim()) {
        setLoadError('Preset name is required');
        return;
      }

      setIsLoading(true);
      setLoadError('');

      try {
        const updateData = {
          name: editName.trim(),
          ...(editDescription.trim() && { description: editDescription.trim() }),
        };

        await presetAPI.updatePreset(presetId, updateData);

        // Reload presets to update the list
        void loadPresets();
        setEditingPreset(null);
        setEditName('');
        setEditDescription('');
      } catch (err: unknown) {
        const error = err as {
          response?: { status: number };
          message?: string;
        };

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
          setLoadError(
            `Failed to update preset: ${(error as { message?: string }).message || 'Unknown error'}`
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [editName, editDescription, loadPresets]
  );

  const handleDeletePreset = useCallback(
    async (presetId: number) => {
      if (!user) {
        navigate('/auth');
        return;
      }

      const confirmed = confirm('Are you sure you want to delete this preset?');

      if (!confirmed) {
        return;
      }

      setIsLoading(true);
      setLoadError(''); // Clear any previous errors

      try {
        await presetAPI.deletePreset(presetId);

        // Reload presets to update the list
        void loadPresets();
      } catch (err: unknown) {
        const error = err as {
          response?: { status: number };
          message?: string;
        };

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
          setLoadError(
            `Failed to delete preset: ${(error as { message?: string }).message || 'Unknown error'}`
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [user, navigate, loadPresets]
  );

  return {
    // State
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

    // Setters
    setShowSaveForm,
    setPresetName,
    setPresetDescription,
    setEditingPreset,
    setEditName,
    setEditDescription,

    // Handlers
    handleSavePreset,
    handleEditPreset,
    handleCancelEdit,
    handleSaveEdit,
    handleDeletePreset,
    navigate,
  };
}

