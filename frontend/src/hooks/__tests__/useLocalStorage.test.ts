import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLocalStorage } from '../useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('initializes with default value when key does not exist', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default-value'))

    expect(result.current[0]).toBe('default-value')
  })

  it('initializes with stored value when key exists', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'))

    const { result } = renderHook(() => useLocalStorage('test-key', 'default-value'))

    expect(result.current[0]).toBe('stored-value')
  })

  it('updates localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default-value'))

    act(() => {
      result.current[1]('new-value')
    })

    expect(result.current[0]).toBe('new-value')
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('new-value'))
  })

  it('handles complex objects', () => {
    const defaultObj = { name: 'test', value: 123 }
    const { result } = renderHook(() => useLocalStorage('test-obj', defaultObj))

    expect(result.current[0]).toEqual(defaultObj)

    const newObj = { name: 'updated', value: 456, nested: { key: 'value' } }
    act(() => {
      result.current[1](newObj)
    })

    expect(result.current[0]).toEqual(newObj)
    expect(localStorage.getItem('test-obj')).toBe(JSON.stringify(newObj))
  })

  it('handles arrays', () => {
    const defaultArray = [1, 2, 3]
    const { result } = renderHook(() => useLocalStorage('test-array', defaultArray))

    expect(result.current[0]).toEqual(defaultArray)

    const newArray = [4, 5, 6, 7]
    act(() => {
      result.current[1](newArray)
    })

    expect(result.current[0]).toEqual(newArray)
    expect(localStorage.getItem('test-array')).toBe(JSON.stringify(newArray))
  })

  it('handles null values', () => {
    const { result } = renderHook(() => useLocalStorage('test-null', null))

    expect(result.current[0]).toBeNull()

    act(() => {
      result.current[1](null)
    })

    expect(result.current[0]).toBeNull()
    expect(localStorage.getItem('test-null')).toBe(JSON.stringify(null))
  })

  it('handles boolean values', () => {
    const { result } = renderHook(() => useLocalStorage('test-bool', false))

    expect(result.current[0]).toBe(false)

    act(() => {
      result.current[1](true)
    })

    expect(result.current[0]).toBe(true)
    expect(localStorage.getItem('test-bool')).toBe(JSON.stringify(true))
  })

  it('handles function updates', () => {
    const { result } = renderHook(() => useLocalStorage('test-func', 0))

    act(() => {
      result.current[1]((prev: number) => prev + 1)
    })

    expect(result.current[0]).toBe(1)
    expect(localStorage.getItem('test-func')).toBe(JSON.stringify(1))
  })

  it('handles malformed JSON in localStorage', () => {
    localStorage.setItem('test-malformed', 'invalid-json')

    const { result } = renderHook(() => useLocalStorage('test-malformed', 'default'))

    expect(result.current[0]).toBe('default')
  })

  it('handles empty string in localStorage', () => {
    localStorage.setItem('test-empty', '')

    const { result } = renderHook(() => useLocalStorage('test-empty', 'default'))

    expect(result.current[0]).toBe('default')
  })

  it('handles localStorage errors gracefully', () => {
    // Mock localStorage.setItem to throw an error
    const originalSetItem = localStorage.setItem
    localStorage.setItem = vi.fn().mockImplementation(() => {
      throw new Error('Storage quota exceeded')
    })

    const { result } = renderHook(() => useLocalStorage('test-error', 'default'))

    act(() => {
      result.current[1]('new-value')
    })

    // Should not crash, but may not update localStorage
    expect(result.current[0]).toBe('new-value')

    // Restore original function
    localStorage.setItem = originalSetItem
  })

  it('handles localStorage getItem errors gracefully', () => {
    // Mock localStorage.getItem to throw an error
    const originalGetItem = localStorage.getItem
    localStorage.getItem = vi.fn().mockImplementation(() => {
      throw new Error('Storage access denied')
    })

    const { result } = renderHook(() => useLocalStorage('test-error', 'default'))

    // Should fall back to default value
    expect(result.current[0]).toBe('default')

    // Restore original function
    localStorage.getItem = originalGetItem
  })

  it('maintains separate state for different keys', () => {
    const { result: result1 } = renderHook(() => useLocalStorage('key1', 'default1'))
    const { result: result2 } = renderHook(() => useLocalStorage('key2', 'default2'))

    act(() => {
      result1.current[1]('value1')
      result2.current[1]('value2')
    })

    expect(result1.current[0]).toBe('value1')
    expect(result2.current[0]).toBe('value2')
    expect(localStorage.getItem('key1')).toBe(JSON.stringify('value1'))
    expect(localStorage.getItem('key2')).toBe(JSON.stringify('value2'))
  })

  it('handles undefined values', () => {
    const { result } = renderHook(() => useLocalStorage('test-undefined', undefined))

    expect(result.current[0]).toBeUndefined()

    act(() => {
      result.current[1](undefined)
    })

    expect(result.current[0]).toBeUndefined()
    expect(localStorage.getItem('test-undefined')).toBe('undefined')
  })
})
