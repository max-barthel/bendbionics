import { useCallback, useState } from 'react';

/**
 * Return type for useToggle hook
 */
export interface UseToggleReturn {
  /**
   * Current toggle state
   */
  readonly value: boolean;

  /**
   * Toggle the value
   */
  readonly toggle: () => void;

  /**
   * Set the value to true
   */
  readonly setTrue: () => void;

  /**
   * Set the value to false
   */
  readonly setFalse: () => void;

  /**
   * Set a specific value
   */
  readonly setValue: (value: boolean) => void;
}

/**
 * Hook for managing boolean toggle state
 *
 * Provides a convenient API for common boolean state patterns like
 * collapsed/expanded, open/closed, visible/hidden, etc.
 *
 * @example
 * ```tsx
 * const sidebar = useToggle(false);
 *
 * <button onClick={sidebar.toggle}>Toggle</button>
 * <button onClick={sidebar.setTrue}>Open</button>
 * <button onClick={sidebar.setFalse}>Close</button>
 * ```
 */
export function useToggle(initialValue: boolean = false): UseToggleReturn {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    setValue,
  };
}

