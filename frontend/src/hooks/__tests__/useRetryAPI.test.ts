import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { robotAPI } from '../../api/client'
import { useRetryAPI } from '../useRetryAPI'

// Mock the robotAPI
vi.mock('../../api/client', () => ({
    robotAPI: {
        computePCC: vi.fn()
    },
    defaultRetryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
        retryableErrors: ['ECONNABORTED', 'ETIMEDOUT', 'NETWORK_ERROR']
    }
}))

describe('useRetryAPI', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('initializes with default state', () => {
        const { result } = renderHook(() => useRetryAPI())

        expect(result.current.data).toBeNull()
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBeNull()
        expect(typeof result.current.execute).toBe('function')
        expect(typeof result.current.reset).toBe('function')
    })

    it('executes API call successfully', async () => {
        const mockResponse = { segments: [[[1, 2, 3]]] }
        vi.mocked(robotAPI.computePCC).mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useRetryAPI())

        const params = {
            bending_angles: [0.1],
            rotation_angles: [0],
            backbone_lengths: [0.07],
            coupling_lengths: [0.03, 0.03],
            discretization_steps: 10
        }

        let apiResult: any
        await act(async () => {
            apiResult = await result.current.execute(params)
        })

        expect(result.current.loading).toBe(false)
        expect(result.current.data).toEqual(mockResponse)
        expect(result.current.error).toBeNull()
        expect(apiResult).toEqual(mockResponse)
        expect(robotAPI.computePCC).toHaveBeenCalledWith(params, expect.any(Object))
    })

    it('handles API errors correctly', async () => {
        const mockError = new Error('API Error')
        vi.mocked(robotAPI.computePCC).mockRejectedValue(mockError)

        const { result } = renderHook(() => useRetryAPI())

        const params = {
            bending_angles: [0.1],
            rotation_angles: [0],
            backbone_lengths: [0.07],
            coupling_lengths: [0.03, 0.03],
            discretization_steps: 10
        }

        let apiResult: any
        await act(async () => {
            apiResult = await result.current.execute(params)
        })

        expect(result.current.loading).toBe(false)
        expect(result.current.data).toBeNull()
        expect(result.current.error).toBe('API Error')
        expect(apiResult).toBeNull()
    })

    it('handles API errors with response data', async () => {
        const mockError = {
            response: {
                data: {
                    detail: 'Server Error'
                }
            }
        }
        vi.mocked(robotAPI.computePCC).mockRejectedValue(mockError)

        const { result } = renderHook(() => useRetryAPI())

        const params = {
            bending_angles: [0.1],
            rotation_angles: [0],
            backbone_lengths: [0.07],
            coupling_lengths: [0.03, 0.03],
            discretization_steps: 10
        }

        await act(async () => {
            await result.current.execute(params)
        })

        expect(result.current.error).toBe('Server Error')
    })

    it('handles unknown errors', async () => {
        const mockError = { some: 'unknown error' }
        vi.mocked(robotAPI.computePCC).mockRejectedValue(mockError)

        const { result } = renderHook(() => useRetryAPI())

        const params = {
            bending_angles: [0.1],
            rotation_angles: [0],
            backbone_lengths: [0.07],
            coupling_lengths: [0.03, 0.03],
            discretization_steps: 10
        }

        await act(async () => {
            await result.current.execute(params)
        })

        expect(result.current.error).toBe('An error occurred')
    })

    it('sets loading state during execution', async () => {
        let resolvePromise: (value: any) => void
        const promise = new Promise(resolve => {
            resolvePromise = resolve
        })
        vi.mocked(robotAPI.computePCC).mockReturnValue(promise)

        const { result } = renderHook(() => useRetryAPI())

        const params = {
            bending_angles: [0.1],
            rotation_angles: [0],
            backbone_lengths: [0.07],
            coupling_lengths: [0.03, 0.03],
            discretization_steps: 10
        }

        act(() => {
            result.current.execute(params)
        })

        expect(result.current.loading).toBe(true)
        expect(result.current.error).toBeNull()

        await act(async () => {
            resolvePromise!({ segments: [] })
            await promise
        })

        expect(result.current.loading).toBe(false)
    })

    it('resets state correctly', async () => {
        const mockResponse = { segments: [[[1, 2, 3]]] }
        vi.mocked(robotAPI.computePCC).mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useRetryAPI())

        const params = {
            bending_angles: [0.1],
            rotation_angles: [0],
            backbone_lengths: [0.07],
            coupling_lengths: [0.03, 0.03],
            discretization_steps: 10
        }

        await act(async () => {
            await result.current.execute(params)
        })

        expect(result.current.data).toEqual(mockResponse)

        act(() => {
            result.current.reset()
        })

        expect(result.current.data).toBeNull()
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBeNull()
    })

    it('uses custom retry configuration', async () => {
        const mockResponse = { segments: [[[1, 2, 3]]] }
        vi.mocked(robotAPI.computePCC).mockResolvedValue(mockResponse)

        const customConfig = { maxRetries: 5 }
        const { result } = renderHook(() => useRetryAPI(customConfig))

        const params = {
            bending_angles: [0.1],
            rotation_angles: [0],
            backbone_lengths: [0.07],
            coupling_lengths: [0.03, 0.03],
            discretization_steps: 10
        }

        await act(async () => {
            await result.current.execute(params)
        })

        expect(robotAPI.computePCC).toHaveBeenCalledWith(params, expect.objectContaining({
            maxRetries: 5
        }))
    })

    it('merges retry configurations correctly', async () => {
        const mockResponse = { segments: [[[1, 2, 3]]] }
        vi.mocked(robotAPI.computePCC).mockResolvedValue(mockResponse)

        const initialConfig = { maxRetries: 5 }
        const { result } = renderHook(() => useRetryAPI(initialConfig))

        const params = {
            bending_angles: [0.1],
            rotation_angles: [0],
            backbone_lengths: [0.07],
            coupling_lengths: [0.03, 0.03],
            discretization_steps: 10
        }

        const executionConfig = { baseDelay: 2000 }

        await act(async () => {
            await result.current.execute(params, executionConfig)
        })

        expect(robotAPI.computePCC).toHaveBeenCalledWith(params, expect.objectContaining({
            maxRetries: 5,
            baseDelay: 2000
        }))
    })
})
