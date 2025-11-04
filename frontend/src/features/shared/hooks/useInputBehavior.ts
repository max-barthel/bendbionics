import { useCallback, useState } from 'react';

/**
 * Options for useInputBehavior hook
 */
export interface UseInputBehaviorOptions {
  /**
   * Callback invoked on focus
   */
  readonly onFocus?: () => void;

  /**
   * Callback invoked on blur
   */
  readonly onBlur?: () => void;
}

/**
 * Return type for useInputBehavior hook
 */
export interface UseInputBehaviorReturn {
  /**
   * Whether the input is currently focused
   */
  readonly isFocused: boolean;

  /**
   * Focus handler
   */
  readonly handleFocus: () => void;

  /**
   * Blur handler
   */
  readonly handleBlur: () => void;

  /**
   * Manually set focus state (for programmatic control)
   */
  readonly setIsFocused: (focused: boolean) => void;
}

/**
 * Base hook for common input behavior (focus/blur state management)
 *
 * Consolidates the common pattern of managing focus state and handlers
 * across different input components. Used by both Input and TahoeNumberInput.
 *
 * @example
 * ```tsx
 * const inputBehavior = useInputBehavior({
 *   onFocus: () => console.log('Focused'),
 *   onBlur: () => console.log('Blurred'),
 * });
 *
 * <input
 *   onFocus={inputBehavior.handleFocus}
 *   onBlur={inputBehavior.handleBlur}
 *   className={inputBehavior.isFocused ? 'focused' : ''}
 * />
 * ```
 */
export function useInputBehavior(
  options: UseInputBehaviorOptions = {}
): UseInputBehaviorReturn {
  const { onFocus, onBlur } = options;
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  return {
    isFocused,
    handleFocus,
    handleBlur,
    setIsFocused,
  };
}

