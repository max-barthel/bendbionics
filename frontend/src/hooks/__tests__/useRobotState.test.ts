import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useRobotState } from '../useRobotState'

describe('useRobotState', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('initializes with default values', () => {
    const { result } = renderHook(() => useRobotState())

    expect(result.current[0]).toEqual({
      segments: 5,
      bendingAngles: [0.628319, 0.628319, 0.628319, 0.628319, 0.628319],
      rotationAngles: [0, 0, 0, 0, 0],
      backboneLengths: [0.07, 0.07, 0.07, 0.07, 0.07],
      couplingLengths: [0.03, 0.03, 0.03, 0.03, 0.03, 0.03],
      discretizationSteps: 1000,
    })
  })

  it('updates segments and resizes arrays accordingly', () => {
    const { result } = renderHook(() => useRobotState())

    act(() => {
      result.current[1]({ segments: 3 })
    })

    const state = result.current[0]
    expect(state.segments).toBe(3)
    expect(state.bendingAngles).toHaveLength(3)
    expect(state.rotationAngles).toHaveLength(3)
    expect(state.backboneLengths).toHaveLength(3)
    expect(state.couplingLengths).toHaveLength(4) // segments + 1
  })

  it('preserves existing values when reducing segments', () => {
    const { result } = renderHook(() => useRobotState())

    // First, set some custom values
    act(() => {
      result.current[1]({
        bendingAngles: [1.0, 2.0, 3.0, 4.0, 5.0],
        rotationAngles: [0.1, 0.2, 0.3, 0.4, 0.5],
      })
    })

    // Then reduce segments
    act(() => {
      result.current[1]({ segments: 3 })
    })

    const state = result.current[0]
    expect(state.bendingAngles).toEqual([1.0, 2.0, 3.0])
    expect(state.rotationAngles).toEqual([0.1, 0.2, 0.3])
  })

  it('adds default values when increasing segments', () => {
    const { result } = renderHook(() => useRobotState())

    act(() => {
      result.current[1]({ segments: 7 })
    })

    const state = result.current[0]
    expect(state.bendingAngles).toHaveLength(7)
    expect(state.rotationAngles).toHaveLength(7)
    expect(state.backboneLengths).toHaveLength(7)
    expect(state.couplingLengths).toHaveLength(8)

    // Check that new values have defaults
    expect(state.bendingAngles[6]).toBe(0.628319)
    expect(state.rotationAngles[6]).toBe(0)
    expect(state.backboneLengths[6]).toBe(0.07)
    expect(state.couplingLengths[7]).toBe(0.03)
  })

  it('updates individual arrays without affecting others', () => {
    const { result } = renderHook(() => useRobotState())

    act(() => {
      result.current[1]({
        bendingAngles: [1.0, 2.0, 3.0, 4.0, 5.0],
      })
    })

    const state = result.current[0]
    expect(state.bendingAngles).toEqual([1.0, 2.0, 3.0, 4.0, 5.0])
    expect(state.rotationAngles).toEqual([0, 0, 0, 0, 0]) // unchanged
    expect(state.backboneLengths).toEqual([0.07, 0.07, 0.07, 0.07, 0.07]) // unchanged
  })

  it('handles multiple updates correctly', () => {
    const { result } = renderHook(() => useRobotState())

    act(() => {
      result.current[1]({ segments: 3 })
    })

    act(() => {
      result.current[1]({ discretizationSteps: 500 })
    })

    act(() => {
      result.current[1]({ bendingAngles: [1.0, 2.0, 3.0] })
    })

    const state = result.current[0]
    expect(state.segments).toBe(3)
    expect(state.discretizationSteps).toBe(500)
    expect(state.bendingAngles).toEqual([1.0, 2.0, 3.0])
  })

  it('validates segment count limits', () => {
    const { result } = renderHook(() => useRobotState())

    // Test minimum segments
    act(() => {
      result.current[1]({ segments: 1 })
    })
    expect(result.current[0].segments).toBe(1)

    // Test maximum segments
    act(() => {
      result.current[1]({ segments: 10 })
    })
    expect(result.current[0].segments).toBe(10)

    // Test values outside range should be clamped
    act(() => {
      result.current[1]({ segments: 0 })
    })
    expect(result.current[0].segments).toBe(1)

    act(() => {
      result.current[1]({ segments: 15 })
    })
    expect(result.current[0].segments).toBe(10)
  })

  it('maintains array consistency across updates', () => {
    const { result } = renderHook(() => useRobotState())

    // Verify initial consistency
    let state = result.current[0]
    expect(state.bendingAngles).toHaveLength(state.segments)
    expect(state.rotationAngles).toHaveLength(state.segments)
    expect(state.backboneLengths).toHaveLength(state.segments)
    expect(state.couplingLengths).toHaveLength(state.segments + 1)

    // Update segments and verify consistency
    act(() => {
      result.current[1]({ segments: 7 })
    })

    state = result.current[0]
    expect(state.bendingAngles).toHaveLength(state.segments)
    expect(state.rotationAngles).toHaveLength(state.segments)
    expect(state.backboneLengths).toHaveLength(state.segments)
    expect(state.couplingLengths).toHaveLength(state.segments + 1)
  })
})
