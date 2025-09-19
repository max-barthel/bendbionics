import { useCallback, useState } from 'react';
import { robotAPI, type PCCParams } from '../../../api/client';
import { validateRobotConfiguration } from '../../../utils/formValidation';
import { useErrorHandler } from '../../shared/hooks/useErrorHandler';
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

  const { error, showError, hideError } = useErrorHandler();

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
        const newProgress = prev + Math.random() * 15;
        return newProgress >= 90 ? 90 : newProgress;
      });
    }, 200);

    try {
      const params: PCCParams = {
        bending_angles: robotState.bendingAngles,
        rotation_angles: robotState.rotationAngles,
        backbone_lengths: robotState.backboneLengths,
        coupling_lengths: robotState.couplingLengths,
        discretization_steps: robotState.discretizationSteps,
        tendon_config: robotState.tendonConfig,
      };

      // Use tendon endpoint if tendon configuration is provided
      let result;
      let segments;
      if (robotState.tendonConfig) {
        result = await robotAPI.computePCCWithTendons(params);
        segments = result.data.result.robot_positions;
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
      console.error('Failed to submit:', err);

      // Determine error type and show appropriate message
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        showError(
          'network',
          'Request timed out. Please check your connection and try again.'
        );
      } else if (err.response?.status === 500) {
        showError(
          'server',
          'Server error occurred. Please try again later or contact support.'
        );
      } else if (err.response?.status === 400) {
        showError(
          'validation',
          'Invalid parameters provided. Please check your input values.'
        );
      } else if (err.response?.status === 404) {
        showError(
          'server',
          'Service not found. Please check if the backend is running.'
        );
      } else if (!err.response) {
        showError(
          'network',
          'Unable to connect to server. Please check your connection.'
        );
      } else {
        showError('unknown', 'An unexpected error occurred. Please try again.');
      }

      return false;
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      setComputationProgress(0);
      onLoadingChange?.(false);
    }
  }, [robotState, showError, hideError, onResult, onLoadingChange]);

  return {
    // State
    loading,
    validating,
    computationProgress,
    error,

    // Actions
    handleSubmit,
    hideError,
  };
}
