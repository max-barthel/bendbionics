import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateRobotConfiguration } from '../formValidation';

describe('formValidation', () => {
  describe('validateRobotConfiguration', () => {
    const mockShowError = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('validates correct parameters', async () => {
      const robotState = {
        segments: 3,
        bendingAngles: [0.1, 0.2, 0.3],
        rotationAngles: [0, 0, 0],
        backboneLengths: [0.07, 0.07, 0.07],
        couplingLengths: [0.03, 0.03, 0.03, 0.03],
        discretizationSteps: 1000,
        tendonConfig: { count: 3, radius: 0.01 },
      };

      const result = await validateRobotConfiguration(robotState, mockShowError);
      expect(result).toBe(true);
      expect(mockShowError).not.toHaveBeenCalled();
    });

    it('detects empty arrays', async () => {
      const robotState = {
        segments: 3,
        bendingAngles: [],
        rotationAngles: [0, 0, 0],
        backboneLengths: [0.07, 0.07, 0.07],
        couplingLengths: [0.03, 0.03, 0.03, 0.03],
        discretizationSteps: 1000,
        tendonConfig: { count: 3, radius: 0.01 },
      };

      const result = await validateRobotConfiguration(robotState, mockShowError);
      expect(result).toBe(false);
      expect(mockShowError).toHaveBeenCalledWith(
        'validation',
        'All backbone parameter arrays must have at least one value.'
      );
    });

    it('detects mismatched array lengths', async () => {
      const robotState = {
        segments: 3,
        bendingAngles: [0.1, 0.2], // Only 2 values, should be 3
        rotationAngles: [0, 0, 0],
        backboneLengths: [0.07, 0.07, 0.07],
        couplingLengths: [0.03, 0.03, 0.03, 0.03],
        discretizationSteps: 1000,
        tendonConfig: { count: 3, radius: 0.01 },
      };

      const result = await validateRobotConfiguration(robotState, mockShowError);
      expect(result).toBe(false);
      expect(mockShowError).toHaveBeenCalledWith(
        'validation',
        'All backbone parameter arrays must have the same number of values.'
      );
    });

    it('detects incorrect coupling lengths', async () => {
      const robotState = {
        segments: 3,
        bendingAngles: [0.1, 0.2, 0.3],
        rotationAngles: [0, 0, 0],
        backboneLengths: [0.07, 0.07, 0.07],
        couplingLengths: [0.03, 0.03, 0.03], // Only 3 values, should be 4
        discretizationSteps: 1000,
        tendonConfig: { count: 3, radius: 0.01 },
      };

      const result = await validateRobotConfiguration(robotState, mockShowError);
      expect(result).toBe(false);
      expect(mockShowError).toHaveBeenCalledWith(
        'validation',
        'Coupling lengths array must have 4 values.'
      );
    });

    it('detects invalid discretization steps', async () => {
      const robotState = {
        segments: 3,
        bendingAngles: [0.1, 0.2, 0.3],
        rotationAngles: [0, 0, 0],
        backboneLengths: [0.07, 0.07, 0.07],
        couplingLengths: [0.03, 0.03, 0.03, 0.03],
        discretizationSteps: 0, // Invalid
        tendonConfig: { count: 3, radius: 0.01 },
      };

      const result = await validateRobotConfiguration(robotState, mockShowError);
      expect(result).toBe(false);
      expect(mockShowError).toHaveBeenCalledWith(
        'validation',
        'Discretization steps must be greater than 0.'
      );
    });

    it('detects NaN values', async () => {
      const robotState = {
        segments: 3,
        bendingAngles: [0.1, NaN, 0.3],
        rotationAngles: [0, 0, 0],
        backboneLengths: [0.07, 0.07, 0.07],
        couplingLengths: [0.03, 0.03, 0.03, 0.03],
        discretizationSteps: 1000,
        tendonConfig: { count: 3, radius: 0.01 },
      };

      const result = await validateRobotConfiguration(robotState, mockShowError);
      expect(result).toBe(false);
      expect(mockShowError).toHaveBeenCalledWith(
        'validation',
        'All parameter values must be valid numbers.'
      );
    });

    it('detects infinite values', async () => {
      const robotState = {
        segments: 3,
        bendingAngles: [0.1, Infinity, 0.3],
        rotationAngles: [0, 0, 0],
        backboneLengths: [0.07, 0.07, 0.07],
        couplingLengths: [0.03, 0.03, 0.03, 0.03],
        discretizationSteps: 1000,
        tendonConfig: { count: 3, radius: 0.01 },
      };

      const result = await validateRobotConfiguration(robotState, mockShowError);
      expect(result).toBe(false);
      expect(mockShowError).toHaveBeenCalledWith(
        'validation',
        'All parameter values must be valid numbers.'
      );
    });

    it('handles empty coupling lengths', async () => {
      const robotState = {
        segments: 3,
        bendingAngles: [0.1, 0.2, 0.3],
        rotationAngles: [0, 0, 0],
        backboneLengths: [0.07, 0.07, 0.07],
        couplingLengths: [], // Empty array
        discretizationSteps: 1000,
        tendonConfig: { count: 3, radius: 0.01 },
      };

      const result = await validateRobotConfiguration(robotState, mockShowError);
      expect(result).toBe(false);
      expect(mockShowError).toHaveBeenCalledWith(
        'validation',
        'Coupling lengths array must have at least one value.'
      );
    });
  });
});
