import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useConfigurationLoader } from '../useConfigurationLoader'
import { useRobotState } from '../useRobotState'

// Mock the useRobotState hook
vi.mock('../useRobotState', () => ({
    useRobotState: vi.fn()
}))

describe('useConfigurationLoader', () => {
    const mockSetRobotState = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useRobotState).mockReturnValue([{}, mockSetRobotState])
    })

    it('does not load configuration when initialConfiguration is undefined', () => {
        renderHook(() => useConfigurationLoader(undefined))

        expect(mockSetRobotState).not.toHaveBeenCalled()
    })

    it('does not load configuration when initialConfiguration is empty', () => {
        renderHook(() => useConfigurationLoader({}))

        expect(mockSetRobotState).not.toHaveBeenCalled()
    })

    it('loads preset configuration when segments are provided without tendonAnalysis', () => {
        const config = {
            segments: 3,
            bendingAngles: [0.1, 0.2, 0.3],
            rotationAngles: [0, 0, 0],
            backboneLengths: [0.07, 0.07, 0.07],
            couplingLengths: [0.03, 0.03, 0.03, 0.03],
            discretizationSteps: 1000,
            tendonConfig: {
                count: 3,
                radius: 0.01,
                coupling_offset: 0.0
            }
        }

        renderHook(() => useConfigurationLoader(config))

        expect(mockSetRobotState).toHaveBeenCalledWith({
            segments: 3,
            bendingAngles: [0.1, 0.2, 0.3],
            rotationAngles: [0, 0, 0],
            backboneLengths: [0.07, 0.07, 0.07],
            couplingLengths: [0.03, 0.03, 0.03, 0.03],
            discretizationSteps: 1000,
            tendonConfig: {
                count: 3,
                radius: 0.01,
                coupling_offset: 0.0
            }
        })
    })

    it('loads reset configuration when config has segments but no tendonAnalysis', () => {
        // Test with a config that has segments but no tendonAnalysis to trigger the preset logic
        const config = { segments: 2 }

        renderHook(() => useConfigurationLoader(config))

        expect(mockSetRobotState).toHaveBeenCalledWith({
            segments: 2,
            bendingAngles: [0, 0],
            rotationAngles: [0, 0],
            backboneLengths: [0.07, 0.07],
            couplingLengths: [0.03, 0.03, 0.03],
            discretizationSteps: 1000,
            tendonConfig: {
                count: 3,
                radius: 0.01,
                coupling_offset: 0.0
            }
        })
    })

    it('does not load configuration when tendonAnalysis is present', () => {
        const config = {
            segments: 3,
            tendonAnalysis: { some: 'data' }
        }

        renderHook(() => useConfigurationLoader(config))

        expect(mockSetRobotState).not.toHaveBeenCalled()
    })

    it('uses default values when configuration properties are missing', () => {
        const config = {
            segments: 2
        }

        renderHook(() => useConfigurationLoader(config))

        expect(mockSetRobotState).toHaveBeenCalledWith({
            segments: 2,
            bendingAngles: [0, 0],
            rotationAngles: [0, 0],
            backboneLengths: [0.07, 0.07],
            couplingLengths: [0.03, 0.03, 0.03],
            discretizationSteps: 1000,
            tendonConfig: {
                count: 3,
                radius: 0.01,
                coupling_offset: 0.0
            }
        })
    })

    it('re-runs effect when initialConfiguration changes', () => {
        const { rerender } = renderHook(
            ({ config }) => useConfigurationLoader(config),
            { initialProps: { config: { segments: 2 } } }
        )

        expect(mockSetRobotState).toHaveBeenCalledTimes(1)

        rerender({ config: { segments: 3 } })

        expect(mockSetRobotState).toHaveBeenCalledTimes(2)
    })
})
