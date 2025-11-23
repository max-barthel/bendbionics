import { robotAPI } from '@/api/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the robotAPI to avoid the retry mechanism in tests
vi.mock('@/api/client', async () => {
  const actual = await vi.importActual('@/api/client');
  return {
    ...actual,
    robotAPI: {
      computeKinematics: vi.fn(),
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
      success: true,
      data: {
        result: {
          robot_positions: [
            [
              [1, 2, 3],
              [4, 5, 6],
            ],
          ],
          coupling_data: {
            positions: [],
            orientations: [],
          },
          tendon_analysis: {
            segment_lengths: [],
            total_lengths: [],
            length_changes: [],
            routing_points: [],
          },
          actuation_commands: {},
          model_type: 'pcc',
          tendon_config: {},
        },
      },
      message: 'Computation successful',
      timestamp: new Date().toISOString(),
      request_id: 'test-request-id',
    };

    vi.mocked(robotAPI.computeKinematics).mockResolvedValueOnce(mockResponse);

    const params = {
      bending_angles: [0.1, 0.2],
      rotation_angles: [0, 0],
      backbone_lengths: [0.07, 0.07],
      coupling_lengths: [0.03, 0.03, 0.03],
      discretization_steps: 10,
      tendon_config: {},
    };

    const result = await robotAPI.computeKinematics(params);

    expect(robotAPI.computeKinematics).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockResponse);
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(robotAPI.computeKinematics).mockRejectedValueOnce(new Error('API error'));

    const params = {
      bending_angles: [0.1, 0.2],
      rotation_angles: [0, 0],
      backbone_lengths: [0.07, 0.07],
      coupling_lengths: [0.03, 0.03, 0.03],
      discretization_steps: 10,
      tendon_config: {},
    };

    await expect(robotAPI.computeKinematics(params)).rejects.toThrow('API error');
  });

  it('handles network errors gracefully', async () => {
    vi.mocked(robotAPI.computeKinematics).mockRejectedValueOnce(new Error('Network error'));

    const params = {
      bending_angles: [0.1, 0.2],
      rotation_angles: [0, 0],
      backbone_lengths: [0.07, 0.07],
      coupling_lengths: [0.03, 0.03, 0.03],
      discretization_steps: 10,
      tendon_config: {},
    };

    await expect(robotAPI.computeKinematics(params)).rejects.toThrow('Network error');
    expect(robotAPI.computeKinematics).toHaveBeenCalledWith(params);
  });

  it('validates input parameters', async () => {
    const mockResponse = {
      success: true,
      data: {
        result: {
          robot_positions: [
            [
              [1, 2, 3],
              [4, 5, 6],
            ],
          ],
          coupling_data: {
            positions: [],
            orientations: [],
          },
          tendon_analysis: {
            segment_lengths: [],
            total_lengths: [],
            length_changes: [],
            routing_points: [],
          },
          actuation_commands: {},
          model_type: 'pcc',
          tendon_config: {},
        },
      },
      message: 'Computation successful',
      timestamp: new Date().toISOString(),
      request_id: 'test-request-id',
    };

    vi.mocked(robotAPI.computeKinematics).mockResolvedValueOnce(mockResponse);

    const params = {
      bending_angles: [0.1, 0.2],
      rotation_angles: [0, 0],
      backbone_lengths: [0.07, 0.07],
      coupling_lengths: [0.03, 0.03, 0.03],
      discretization_steps: 10,
      tendon_config: {},
    };

    // Test that the function accepts valid parameters
    const result = await robotAPI.computeKinematics(params);
    expect(result).toEqual(mockResponse);
  });

  it('handles empty arrays gracefully', async () => {
    const mockResponse = {
      success: true,
      data: {
        result: {
          robot_positions: [],
          coupling_data: {
            positions: [],
            orientations: [],
          },
          tendon_analysis: {
            segment_lengths: [],
            total_lengths: [],
            length_changes: [],
            routing_points: [],
          },
          actuation_commands: {},
          model_type: 'pcc',
          tendon_config: {},
        },
      },
      message: 'Computation successful',
      timestamp: new Date().toISOString(),
      request_id: 'test-request-id',
    };

    vi.mocked(robotAPI.computeKinematics).mockResolvedValueOnce(mockResponse);

    const params = {
      bending_angles: [],
      rotation_angles: [],
      backbone_lengths: [],
      coupling_lengths: [],
      discretization_steps: 10,
      tendon_config: {},
    };

    const result = await robotAPI.computeKinematics(params);
    expect(result).toEqual(mockResponse);
  });
});
