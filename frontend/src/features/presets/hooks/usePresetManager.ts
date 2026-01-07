import { authAPI, presetAPI } from '@/api/auth';
import { ERROR_MESSAGES } from '@/constants/errorMessages';
import {
  useUnifiedErrorHandler,
  type ErrorState,
} from '@/features/shared/hooks/useUnifiedErrorHandler';
import { useAuth } from '@/providers';
import type { CreatePresetRequest, Preset } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function usePresetManager(currentConfiguration: Record<string, unknown>) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [publicPresets, setPublicPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [editingPreset, setEditingPreset] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Memoize the onError callback to prevent infinite loops
  const handleErrorCallback = useCallback((errorState: ErrorState) => {
    // Set loadError when unified handler detects an error
    // This maintains backward compatibility with existing components
    if (errorState.visible && errorState.message) {
      setLoadError(errorState.message);
    }
  }, []);

  // Use unified error handler for API errors
  const { handleApiError } = useUnifiedErrorHandler({
    autoHide: false, // Manual control of error display
    onError: handleErrorCallback,
  });

  // Helper to extract error message from error object
  const extractErrorMessage = (err: unknown): string => {
    const errorObj = err as {
      response?: { status?: number; data?: { detail?: string } };
      message?: string;
    };
    if (errorObj.response?.data?.detail) {
      return typeof errorObj.response.data.detail === 'string'
        ? errorObj.response.data.detail
        : String(errorObj.response.data.detail);
    }
    return errorObj.message ?? 'An unexpected error occurred';
  };

  const loadPresets = useCallback(async () => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    setLoadError('');
    try {
      // Test authentication first
      try {
        await authAPI.getCurrentUser();
        // Authentication successful
      } catch (err: unknown) {
        // Authentication failed
        handleApiError(err, 'authentication');
        return;
      }

      const userPresets = await presetAPI.getUserPresets();
      // Presets loaded successfully
      // Sort presets from newest to oldest
      const sortedPresets = [...userPresets].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setPresets(sortedPresets);
      setLoadError(''); // Clear any previous errors
    } catch (err: unknown) {
      handleApiError(err, 'loading presets');
      // Extract message directly as fallback (unified handler's onError sets loadError
      // asynchronously)
      const errorMessage = extractErrorMessage(err);
      setLoadError(errorMessage || ERROR_MESSAGES.LOAD_FAILED);
    } finally {
      setIsLoading(false);
    }
  }, [user, handleApiError]);

  const loadPublicPresets = useCallback(async () => {
    setIsLoadingPublic(true);
    try {
      const publicPresetsData = await presetAPI.getPublicPresets();
      // Sort presets from newest to oldest
      const sortedPublicPresets = [...publicPresetsData].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setPublicPresets(sortedPublicPresets);
    } catch (err: unknown) {
      // Silently fail for public presets - don't show error to user
      console.error('Failed to load public presets:', err);
      setPublicPresets([]);
    } finally {
      setIsLoadingPublic(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void loadPresets();
    }
    // Always load public presets, regardless of auth status
    void loadPublicPresets();
  }, [user, loadPresets, loadPublicPresets]);

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
      handleApiError(err, 'saving preset');
      // Extract error message for save form display
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage || ERROR_MESSAGES.SAVE_FAILED);
    } finally {
      setIsLoading(false);
    }
  }, [
    user,
    presetName,
    presetDescription,
    currentConfiguration,
    navigate,
    loadPresets,
    handleApiError,
  ]);

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
        handleApiError(err, 'updating preset');
        // Extract error message directly (unified handler's onError sets loadError asynchronously)
        const errorMessage = extractErrorMessage(err);
        setLoadError(`Failed to update preset: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    },
    [editName, editDescription, loadPresets, handleApiError]
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
        handleApiError(err, 'deleting preset');
        // Extract error message directly (unified handler's onError sets loadError asynchronously)
        const errorMessage = extractErrorMessage(err);
        setLoadError(`Failed to delete preset: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    },
    [user, navigate, loadPresets, handleApiError]
  );

  return {
    // State
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
