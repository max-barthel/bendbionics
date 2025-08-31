import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { robotAPI } from '../../api/client';
import { useRetryAPI } from '../useRetryAPI';

// Mock the robotAPI
vi.mock('../../api/client', () => ({
  robotAPI: {
    computePCC: vi.fn(),
  },
  defaultRetryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  },
}));

const mockRobotAPI = vi.mocked(robotAPI);

describe('useRetryAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('returns initial state', () => {
      const { result } = renderHook(() => useRetryAPI());

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.execute).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('returns initial state with custom retry config', () => {
      const customConfig = { maxRetries: 5, retryDelay: 2000 };
      const { result } = renderHook(() => useRetryAPI(customConfig));

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Execute Function', () => {
    it('calls robotAPI.computePCC with correct parameters', async () => {
      const mockResponse = { segments: [[[1, 2, 3]]] };
      mockRobotAPI.computePCC.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRetryAPI());

      const params = {
        bending_angles: [1.0],
        rotation_angles: [0.5],
        backbone_lengths: [0.05],
        coupling_lengths: [0.02, 0.02],
        discretization_steps: 1000,
      };

      await act(async () => {
        const response = await result.current.execute(params);
        expect(response).toEqual(mockResponse);
      });

      expect(mockRobotAPI.computePCC).toHaveBeenCalledWith(params, {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
      });
    });

    it('calls robotAPI.computePCC with custom retry config', async () => {
      const mockResponse = { segments: [[[1, 2, 3]]] };
      mockRobotAPI.computePCC.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRetryAPI());

      const params = {
        bending_angles: [1.0],
        rotation_angles: [0.5],
        backbone_lengths: [0.05],
        coupling_lengths: [0.02, 0.02],
        discretization_steps: 1000,
      };

      const customRetryConfig = { maxRetries: 5, retryDelay: 2000 };

      await act(async () => {
        const response = await result.current.execute(params, customRetryConfig);
        expect(response).toEqual(mockResponse);
      });

      expect(mockRobotAPI.computePCC).toHaveBeenCalledWith(params, {
        maxRetries: 5,
        retryDelay: 2000,
        backoffMultiplier: 2,
      });
    });

    it('merges initial and execution retry configs', async () => {
      const mockResponse = { segments: [[[1, 2, 3]]] };
      mockRobotAPI.computePCC.mockResolvedValue(mockResponse);

      const initialConfig = { maxRetries: 5 };
      const { result } = renderHook(() => useRetryAPI(initialConfig));

      const params = {
        bending_angles: [1.0],
        rotation_angles: [0.5],
        backbone_lengths: [0.05],
        coupling_lengths: [0.02, 0.02],
        discretization_steps: 1000,
      };

      const executionConfig = { retryDelay: 2000 };

      await act(async () => {
        const response = await result.current.execute(params, executionConfig);
        expect(response).toEqual(mockResponse);
      });

      expect(mockRobotAPI.computePCC).toHaveBeenCalledWith(params, {
        maxRetries: 5,
        retryDelay: 2000,
        backoffMultiplier: 2,
      });
    });
  });

  describe('State Management', () => {
    it('sets loading to true when execute is called', async () => {
      const mockResponse = { segments: [[[1, 2, 3]]] };
      mockRobotAPI.computePCC.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockResponse), 100)));

      const { result } = renderHook(() => useRetryAPI());

      const params = {
        bending_angles: [1.0],
        rotation_angles: [0.5],
        backbone_lengths: [0.05],
        coupling_lengths: [0.02, 0.02],
        discretization_steps: 1000,
      };

      act(() => {
        result.current.execute(params);
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('sets data and loading to false on successful execution', async () => {
      const mockResponse = { segments: [[[1, 2, 3]]] };
      mockRobotAPI.computePCC.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRetryAPI());

      const params = {
        bending_angles: [1.0],
        rotation_angles: [0.5],
        backbone_lengths: [0.05],
        coupling_lengths: [0.02, 0.02],
        discretization_steps: 1000,
      };

      await act(async () => {
        await result.current.execute(params);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('sets error and loading to false on failed execution', async () => {
      const errorMessage = 'API Error';
      const apiError = new Error(errorMessage);
      apiError.response = { data: { detail: 'Server error' } };
      mockRobotAPI.computePCC.mockRejectedValue(apiError);

      const { result } = renderHook(() => useRetryAPI());

      const params = {
        bending_angles: [1.0],
        rotation_angles: [0.5],
        backbone_lengths: [0.05],
        coupling_lengths: [0.02, 0.02],
        discretization_steps: 1000,
      };

      await act(async () => {
        const response = await result.current.execute(params);
        expect(response).toBeNull();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Server error');
    });

    it('handles error without response data', async () => {
      const errorMessage = 'Network Error';
      const apiError = new Error(errorMessage);
      mockRobotAPI.computePCC.mockRejectedValue(apiError);

      const { result } = renderHook(() => useRetryAPI());

      const params = {
        bending_angles: [1.0],
        rotation_angles: [0.5],
        backbone_lengths: [0.05],
        coupling_lengths: [0.02, 0.02],
        discretization_steps: 1000,
      };

      await act(async () => {
        const response = await result.current.execute(params);
        expect(response).toBeNull();
      });

      expect(result.current.error).toBe(errorMessage);
    });

    it('handles error without message', async () => {
      const apiError = {};
      mockRobotAPI.computePCC.mockRejectedValue(apiError);

      const { result } = renderHook(() => useRetryAPI());

      const params = {
        bending_angles: [1.0],
        rotation_angles: [0.5],
        backbone_lengths: [0.05],
        coupling_lengths: [0.02, 0.02],
        discretization_steps: 1000,
      };

      await act(async () => {
        const response = await result.current.execute(params);
        expect(response).toBeNull();
      });

      expect(result.current.error).toBe('An error occurred');
    });
  });

  describe('Reset Function', () => {
    it('resets state to initial values', async () => {
      const mockResponse = { segments: [[[1, 2, 3]]] };
      mockRobotAPI.computePCC.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRetryAPI());

      const params = {
        bending_angles: [1.0],
        rotation_angles: [0.5],
        backbone_lengths: [0.05],
        coupling_lengths: [0.02, 0.02],
        discretization_steps: 1000,
      };

      // First, execute to set some state
      await act(async () => {
        await result.current.execute(params);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();

      // Then reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('resets state after error', async () => {
      const apiError = new Error('API Error');
      mockRobotAPI.computePCC.mockRejectedValue(apiError);

      const { result } = renderHook(() => useRetryAPI());

      const params = {
        bending_angles: [1.0],
        rotation_angles: [0.5],
        backbone_lengths: [0.05],
        coupling_lengths: [0.02, 0.02],
        discretization_steps: 1000,
      };

      // First, execute to set error state
      await act(async () => {
        await result.current.execute(params);
      });

      expect(result.current.error).toBe('API Error');

      // Then reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Multiple Executions', () => {
    it('handles multiple sequential executions', async () => {
      const mockResponse1 = { segments: [[[1, 2, 3]]] };
      const mockResponse2 = { segments: [[[4, 5, 6]]] };

      mockRobotAPI.computePCC
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const { result } = renderHook(() => useRetryAPI());

      const params = {
        bending_angles: [1.0],
        rotation_angles: [0.5],
        backbone_lengths: [0.05],
        coupling_lengths: [0.02, 0.02],
        discretization_steps: 1000,
      };

      // First execution
      await act(async () => {
        const response1 = await result.current.execute(params);
        expect(response1).toEqual(mockResponse1);
      });

      expect(result.current.data).toEqual(mockResponse1);

      // Second execution
      await act(async () => {
        const response2 = await result.current.execute(params);
        expect(response2).toEqual(mockResponse2);
      });

      expect(result.current.data).toEqual(mockResponse2);
      expect(mockRobotAPI.computePCC).toHaveBeenCalledTimes(2);
    });

    it('handles execution after reset', async () => {
      const mockResponse = { segments: [[[1, 2, 3]]] };
      mockRobotAPI.computePCC.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRetryAPI());

      const params = {
        bending_angles: [1.0],
        rotation_angles: [0.5],
        backbone_lengths: [0.05],
        coupling_lengths: [0.02, 0.02],
        discretization_steps: 1000,
      };

      // First execution
      await act(async () => {
        await result.current.execute(params);
      });

      expect(result.current.data).toEqual(mockResponse);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();

      // Second execution after reset
      await act(async () => {
        const response = await result.current.execute(params);
        expect(response).toEqual(mockResponse);
      });

      expect(result.current.data).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('handles different error response formats', async () => {
      const testCases = [
        {
          error: { response: { data: { detail: 'Custom error message' } } },
          expectedError: 'Custom error message',
        },
        {
          error: { message: 'Network error' },
          expectedError: 'Network error',
        },
        {
          error: { response: { data: { message: 'Alternative error format' } } },
          expectedError: 'An error occurred',
        },
        {
          error: {},
          expectedError: 'An error occurred',
        },
      ];

      for (const testCase of testCases) {
        mockRobotAPI.computePCC.mockRejectedValueOnce(testCase.error);

        const { result } = renderHook(() => useRetryAPI());

        const params = {
          bending_angles: [1.0],
          rotation_angles: [0.5],
          backbone_lengths: [0.05],
          coupling_lengths: [0.02, 0.02],
          discretization_steps: 1000,
        };

        await act(async () => {
          await result.current.execute(params);
        });

        expect(result.current.error).toBe(testCase.expectedError);
      }
    });
  });

  describe('Type Safety', () => {
    it('works with custom types', async () => {
      interface CustomResponse {
        customData: string;
        segments: number[][][];
      }

      const mockResponse: CustomResponse = {
        customData: 'test',
        segments: [[[1, 2, 3]]],
      };

      mockRobotAPI.computePCC.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRetryAPI<CustomResponse>());

      const params = {
        bending_angles: [1.0],
        rotation_angles: [0.5],
        backbone_lengths: [0.05],
        coupling_lengths: [0.02, 0.02],
        discretization_steps: 1000,
      };

      await act(async () => {
        const response = await result.current.execute(params);
        expect(response).toEqual(mockResponse);
      });

      expect(result.current.data).toEqual(mockResponse);
    });
  });
});
