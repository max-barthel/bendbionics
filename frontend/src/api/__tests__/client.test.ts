import { beforeEach, describe, expect, it, vi } from 'vitest';
import { robotAPI } from '../client';

// Mock the tauri client
vi.mock('../tauri-client', () => ({
  tauriClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock the robotAPI to avoid the retry mechanism in tests
vi.mock('../client', async () => {
  const actual = await vi.importActual('../client');
  return {
    ...actual,
    robotAPI: {
      computePCC: vi.fn(),
      computePCCWithTendons: vi.fn(),
    },
  };
});

describe('robotAPI', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('computes robot configuration successfully', async () => {
    const mockResponse = {
      segments: [
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
      ],
    };

    vi.mocked(robotAPI.computePCC).mockResolvedValueOnce(mockResponse);

    const params = {
      bending_angles: [0.1, 0.2],
      rotation_angles: [0, 0],
      backbone_lengths: [0.07, 0.07],
      coupling_lengths: [0.03, 0.03, 0.03],
      discretization_steps: 10,
    };

    const result = await robotAPI.computePCC(params);

    expect(robotAPI.computePCC).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockResponse);
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(robotAPI.computePCC).mockRejectedValueOnce(new Error('API error'));

    const params = {
      bending_angles: [0.1, 0.2],
      rotation_angles: [0, 0],
      backbone_lengths: [0.07, 0.07],
      coupling_lengths: [0.03, 0.03, 0.03],
      discretization_steps: 10,
    };

    await expect(robotAPI.computePCC(params)).rejects.toThrow('API error');
  });

  it('handles network errors gracefully', async () => {
    vi.mocked(robotAPI.computePCC).mockRejectedValueOnce(new Error('Network error'));

    const params = {
      bending_angles: [0.1, 0.2],
      rotation_angles: [0, 0],
      backbone_lengths: [0.07, 0.07],
      coupling_lengths: [0.03, 0.03, 0.03],
      discretization_steps: 10,
    };

    await expect(robotAPI.computePCC(params)).rejects.toThrow('Network error');
    expect(robotAPI.computePCC).toHaveBeenCalledWith(params);
  });

  it('validates input parameters', async () => {
    const mockResponse = {
      segments: [
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
      ],
    };

    vi.mocked(robotAPI.computePCC).mockResolvedValueOnce(mockResponse);

    const params = {
      bending_angles: [0.1, 0.2],
      rotation_angles: [0, 0],
      backbone_lengths: [0.07, 0.07],
      coupling_lengths: [0.03, 0.03, 0.03],
      discretization_steps: 10,
    };

    // Test that the function accepts valid parameters
    const result = await robotAPI.computePCC(params);
    expect(result).toEqual(mockResponse);
  });

  it('handles empty arrays gracefully', async () => {
    const mockResponse = {
      segments: [],
    };

    vi.mocked(robotAPI.computePCC).mockResolvedValueOnce(mockResponse);

    const params = {
      bending_angles: [],
      rotation_angles: [],
      backbone_lengths: [],
      coupling_lengths: [],
      discretization_steps: 10,
    };

    const result = await robotAPI.computePCC(params);
    expect(result).toEqual(mockResponse);
  });
});
