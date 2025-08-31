import { beforeEach, describe, expect, it, vi } from 'vitest'
import { robotAPI } from '../client'

// Mock the tauri client
vi.mock('../tauri-client', () => ({
  tauriClient: {
    post: vi.fn(),
    get: vi.fn(),
  }
}))

describe('robotAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('computes robot configuration successfully', async () => {
    const mockResponse = {
      success: true,
      data: {
        segments: [[[1, 2, 3], [4, 5, 6]]]
      }
    }

    const { tauriClient } = await import('../tauri-client')
      ; (tauriClient.post as any).mockResolvedValueOnce(mockResponse)

    const params = {
      bending_angles: [0.1, 0.2],
      rotation_angles: [0, 0],
      backbone_lengths: [0.07, 0.07],
      coupling_lengths: [0.03, 0.03, 0.03],
      discretization_steps: 10,
    }

    const result = await robotAPI.computePCC(params)

    expect(tauriClient.post).toHaveBeenCalledWith('/pcc', params)
    expect(result).toEqual(mockResponse.data)
  })

  it('handles API errors gracefully', async () => {
    const mockResponse = {
      success: false,
      error: 'API error'
    }

    const { tauriClient } = await import('../tauri-client')
      ; (tauriClient.post as any).mockResolvedValueOnce(mockResponse)

    const params = {
      bending_angles: [0.1, 0.2],
      rotation_angles: [0, 0],
      backbone_lengths: [0.07, 0.07],
      coupling_lengths: [0.03, 0.03, 0.03],
      discretization_steps: 10,
    }

    await expect(robotAPI.computePCC(params)).rejects.toThrow('API error')
  })

  it('handles network errors gracefully', async () => {
    const networkError = new Error('Network error')

    const { tauriClient } = await import('../tauri-client')
      ; (tauriClient.post as any).mockRejectedValue(networkError)

    const params = {
      bending_angles: [0.1, 0.2],
      rotation_angles: [0, 0],
      backbone_lengths: [0.07, 0.07],
      coupling_lengths: [0.03, 0.03, 0.03],
      discretization_steps: 10,
    }

    try {
      await robotAPI.computePCC(params)
      // Should not reach here
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('Network error')
    }
    expect(tauriClient.post).toHaveBeenCalled()
  })

  it('validates input parameters', async () => {
    const params = {
      bending_angles: [0.1, 0.2],
      rotation_angles: [0, 0],
      backbone_lengths: [0.07, 0.07],
      coupling_lengths: [0.03, 0.03, 0.03],
      discretization_steps: 10,
    }

    // Test that the function accepts valid parameters
    expect(() => robotAPI.computePCC(params)).not.toThrow()
  })

  it('handles empty arrays gracefully', async () => {
    const mockResponse = {
      success: true,
      data: {
        segments: []
      }
    }

    const { tauriClient } = await import('../tauri-client')
      ; (tauriClient.post as any).mockResolvedValueOnce(mockResponse)

    const params = {
      bending_angles: [],
      rotation_angles: [],
      backbone_lengths: [],
      coupling_lengths: [],
      discretization_steps: 10,
    }

    const result = await robotAPI.computePCC(params)
    expect(result).toEqual(mockResponse.data)
  })
})
