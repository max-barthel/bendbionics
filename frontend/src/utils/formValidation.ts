import { DEBOUNCE_DELAYS } from '@/constants/timing';
import type { RobotState } from '@/types/robot';

// Helper function to validate backbone array lengths
const validateBackboneLengths = (
  backboneLengths: number[],
  showError: (type: 'validation', message: string) => void
): boolean => {
  if (backboneLengths.includes(0)) {
    showError(
      'validation',
      'All backbone parameter arrays must have at least one value.'
    );
    return false;
  }

  return true;
};

// Helper function to validate numerical values
const validateNumericalValues = (
  allValues: number[],
  discretizationSteps: number,
  showError: (type: 'validation', message: string) => void
): boolean => {
  if (discretizationSteps <= 0) {
    showError('validation', 'Discretization steps must be greater than 0.');
    return false;
  }

  if (allValues.some(val => Number.isNaN(val) || !Number.isFinite(val))) {
    showError('validation', 'All parameter values must be valid numbers.');
    return false;
  }

  return true;
};

// Helper function to validate tendon configuration
const validateTendonConfig = (
  tendonConfig: RobotState['tendonConfig'],
  showError: (type: 'validation', message: string) => void
): boolean => {
  if (!tendonConfig) return true;

  const { count, radius } = tendonConfig;

  if (count < 3) {
    showError('validation', 'Must have at least 3 tendons for stability.');
    return false;
  }

  if (count > 12) {
    showError('validation', 'Tendon count cannot exceed 12 for practical reasons.');
    return false;
  }

  if (radius <= 0) {
    showError('validation', 'Tendon radius must be positive.');
    return false;
  }

  if (radius > 0.1) {
    showError('validation', 'Radius cannot exceed 10cm.');
    return false;
  }

  return true;
};

export const validateRobotConfiguration = async (
  robotState: RobotState,
  showError: (type: 'validation', message: string) => void
): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, DEBOUNCE_DELAYS.FORM_SUBMIT));

  const backboneLengths = [
    robotState.bendingAngles.length,
    robotState.rotationAngles.length,
    robotState.backboneLengths.length,
  ];

  if (!validateBackboneLengths(backboneLengths, showError)) {
    return false;
  }

  const allValues = [
    ...robotState.bendingAngles,
    ...robotState.rotationAngles,
    ...robotState.backboneLengths,
  ];

  if (!validateNumericalValues(allValues, robotState.discretizationSteps, showError)) {
    return false;
  }

  if (!validateTendonConfig(robotState.tendonConfig, showError)) {
    return false;
  }

  return true;
};
