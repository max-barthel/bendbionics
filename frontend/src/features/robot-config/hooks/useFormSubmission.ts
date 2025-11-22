import { robotAPI, type PCCParams } from '@/api/client';
import { useAsyncOperation } from '@/features/shared/hooks/useAsyncOperation';
import { useProgressTracking } from '@/features/shared/hooks/useProgressTracking';
import { useUnifiedErrorHandler } from '@/features/shared/hooks/useUnifiedErrorHandler';
import { validateRobotConfiguration } from '@/utils/formValidation';
import { useCallback, useRef } from 'react';
import { useRobotState } from './useRobotState';

export interface FormSubmissionResult {
  segments: number[][][];
  configuration: Record<string, unknown>;
}

export interface UseFormSubmissionOptions {
  onResult?: (result: FormSubmissionResult) => void;
  onLoadingChange?: (loading: boolean) => void;
}

/**
 * Custom hook for handling robot form submission with unified validation and error handling
 *
 * Refactored to use useAsyncOperation internally for consistent error handling.
 * Progress tracking is handled separately via useProgressTracking hook.
 *
 * This hook consolidates all form submission logic including:
 * - Validation using the unified validation system
 * - API calls to both PCC and tendon endpoints
 * - Error handling with consistent patterns via useAsyncOperation
 * - Loading state management via useAsyncOperation
 * - Progress tracking via useProgressTracking
 */
export function useFormSubmission(options: UseFormSubmissionOptions = {}) {
  const { onResult, onLoadingChange } = options;
  const [robotState] = useRobotState();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { showError } = useUnifiedErrorHandler();

  const { isLoading, error, execute, hideError } = useAsyncOperation<FormSubmissionResult>({
    onSuccess: result => {
      onResult?.(result);
    },
    onStart: () => {
      onLoadingChange?.(true);
    },
  });

  // Track progress based on loading state
  const { progress: computationProgress, setProgressComplete } = useProgressTracking(isLoading);

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    hideError();

    // Validate the form using the unified validation system
    if (!(await validateRobotConfiguration(robotState, showError))) {
      return false;
    }

    const result = await execute(async () => {
      const params: PCCParams = {
        bending_angles: robotState.bendingAngles,
        rotation_angles: robotState.rotationAngles,
        backbone_lengths: robotState.backboneLengths,
        coupling_lengths: robotState.couplingLengths,
        discretization_steps: robotState.discretizationSteps,
        ...(robotState.tendonConfig && { tendon_config: robotState.tendonConfig }),
      };

      // Use tendon endpoint if tendon configuration is provided
      let apiResult;
      let segments: number[][][];
      if (robotState.tendonConfig) {
        apiResult = await robotAPI.computeKinematics(params);
        segments = apiResult.data.result.robot_positions;
      } else {
        apiResult = await robotAPI.computePCC(params);
        segments = apiResult.data.segments;
      }

      // Mark progress as complete before returning
      setProgressComplete();

      // Create configuration object to pass back
      const configuration = {
        segments: robotState.segments,
        bendingAngles: robotState.bendingAngles,
        rotationAngles: robotState.rotationAngles,
        backboneLengths: robotState.backboneLengths,
        couplingLengths: robotState.couplingLengths,
        discretizationSteps: robotState.discretizationSteps,
        tendonConfig: robotState.tendonConfig,
      };

      return {
        segments,
        configuration,
      };
    });

    if (result) {
      onLoadingChange?.(false);
      return true;
    }

    onLoadingChange?.(false);
    return false;
  }, [robotState, showError, hideError, execute, onResult, onLoadingChange]);

  // Debounced auto-compute entrypoint: validate and compute if not already loading
  const computeIfValid = useCallback(async (): Promise<boolean> => {
    if (isLoading) {
      return false;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    return await new Promise<boolean>(resolve => {
      debounceTimerRef.current = setTimeout(async () => {
        const ok = await handleSubmit();
        resolve(ok);
      }, 200);
    });
  }, [handleSubmit, isLoading]);

  return {
    // State
    loading: isLoading,
    validating: false,
    computationProgress,
    error,

    // Actions
    handleSubmit,
    computeIfValid,
    hideError,
  };
}
