import { robotAPI, type PCCParams } from '@/api/client';
import { useUnifiedErrorHandler } from '@/features/shared/hooks/useUnifiedErrorHandler';
import { validateRobotConfiguration } from '@/utils/formValidation';
import { useCallback, useRef, useState } from 'react';
import { useRobotState } from './useRobotState';

// Progress and timeout constants
const PROGRESS_CONFIG = {
  INITIAL: 15,
  COMPLETE: 90,
  FINAL: 200,
} as const;

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
 * This hook consolidates all form submission logic including:
 * - Validation using the unified validation system
 * - API calls to both PCC and tendon endpoints
 * - Error handling with consistent patterns
 * - Loading state management
 * - Progress tracking
 */
export function useFormSubmission(options: UseFormSubmissionOptions = {}) {
  const { onResult, onLoadingChange } = options;
  const [robotState] = useRobotState();
  const [loading, setLoading] = useState(false);
  const [validating] = useState(false);
  const [computationProgress, setComputationProgress] = useState(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { error, showError, hideError, handleApiError } = useUnifiedErrorHandler();

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    hideError();

    // Validate the form using the unified validation system
    if (!(await validateRobotConfiguration(robotState, showError))) {
      return false;
    }

    setLoading(true);
    setComputationProgress(0);
    onLoadingChange?.(true);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setComputationProgress(prev => {
        const newProgress = prev + Math.random() * PROGRESS_CONFIG.INITIAL;
        return Math.min(newProgress, PROGRESS_CONFIG.COMPLETE);
      });
    }, PROGRESS_CONFIG.FINAL);

    try {
      const params: PCCParams = {
        bending_angles: robotState.bendingAngles,
        rotation_angles: robotState.rotationAngles,
        backbone_lengths: robotState.backboneLengths,
        coupling_lengths: robotState.couplingLengths,
        discretization_steps: robotState.discretizationSteps,
        ...(robotState.tendonConfig && { tendon_config: robotState.tendonConfig }),
      };

      // Use tendon endpoint if tendon configuration is provided
      let result;
      let segments;
      if (robotState.tendonConfig) {
        result = await robotAPI.computePCCWithTendons(params);
        segments = result.result.robot_positions;
      } else {
        result = await robotAPI.computePCC(params);
        segments = result.data.segments;
      }

      setComputationProgress(100);

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

      const submissionResult: FormSubmissionResult = {
        segments: segments,
        configuration,
      };

      onResult?.(submissionResult);
      return true;
    } catch (err: unknown) {
      handleApiError(err, 'form submission');
      return false;
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      setComputationProgress(0);
      onLoadingChange?.(false);
    }
  }, [robotState, showError, hideError, handleApiError, onResult, onLoadingChange]);

  // Debounced auto-compute entrypoint: validate and compute if not already loading
  const computeIfValid = useCallback(async (): Promise<boolean> => {
    if (loading) {
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
  }, [handleSubmit, loading]);

  return {
    // State
    loading,
    validating,
    computationProgress,
    error,

    // Actions
    handleSubmit,
    computeIfValid,
    hideError,
  };
}
