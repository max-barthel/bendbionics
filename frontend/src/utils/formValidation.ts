import { type RobotState } from '../features/robot-config/hooks/useRobotState';

// Helper function to validate backbone array lengths
const validateBackboneLengths = (
  backboneLengths: number[],
  couplingLength: number,
  showError: (type: 'validation', message: string) => void
): boolean => {
  if (backboneLengths.includes(0)) {
    showError(
      'validation',
      'All backbone parameter arrays must have at least one value.'
    );
    return false;
  }

  if (couplingLength === 0) {
    showError('validation', 'Coupling lengths array must have at least one value.');
    return false;
  }

  if (new Set(backboneLengths).size > 1) {
    showError(
      'validation',
      'All backbone parameter arrays must have the same number of values.'
    );
    return false;
  }

  const backboneLength = backboneLengths[0] ?? 0;
  if (couplingLength !== backboneLength + 1) {
    showError(
      'validation',
      `Coupling lengths array must have ${backboneLength + 1} values.`
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
  await new Promise(resolve => setTimeout(resolve, 300));

  const backboneLengths = [
    robotState.bendingAngles.length,
    robotState.rotationAngles.length,
    robotState.backboneLengths.length,
  ];
  const couplingLength = robotState.couplingLengths.length;

  if (!validateBackboneLengths(backboneLengths, couplingLength, showError)) {
    return false;
  }

  const allValues = [
    ...robotState.bendingAngles,
    ...robotState.rotationAngles,
    ...robotState.backboneLengths,
    ...robotState.couplingLengths,
  ];

  if (!validateNumericalValues(allValues, robotState.discretizationSteps, showError)) {
    return false;
  }

  if (!validateTendonConfig(robotState.tendonConfig, showError)) {
    return false;
  }

  return true;
};
