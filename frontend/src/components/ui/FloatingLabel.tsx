import { cn, getFloatingLabelStyles } from '@/styles/tahoe-utils';

interface FloatingLabelProps {
  readonly label: string;
  readonly id?: string;
  readonly shouldFloat: boolean;
  readonly variant?: 'standard' | 'tahoe';
}

/**
 * FloatingLabel - Reusable floating label component for inputs
 *
 * Used in Input and TahoeNumberInput components to provide consistent
 * floating label behavior across the application.
 */
export function FloatingLabel({
  label,
  id,
  shouldFloat,
  variant = 'standard',
}: FloatingLabelProps) {
  if (variant === 'tahoe') {
    // Tahoe variant (simpler, used in TahoeNumberInput)
    return (
      <div
        className={cn(
          'absolute -top-3 left-3 px-2 text-xs font-medium text-gray-700 transition-all duration-300',
          getFloatingLabelStyles(true)
        )}
      >
        {label}
      </div>
    );
  }

  // Standard variant (used in Input)
  return (
    <label
      htmlFor={id}
      className={cn(
        'absolute left-3 pointer-events-none transition-all duration-200',
        shouldFloat
          ? cn(
              'top-0 transform -translate-y-1/2 text-xs text-gray-600',
              getFloatingLabelStyles(true)
            )
          : 'top-1/2 transform -translate-y-1/2 text-sm text-gray-600'
      )}
    >
      {label}
    </label>
  );
}

/**
 * Hook to determine if a floating label should float
 */
export function useFloatingLabel(
  value: string | number | undefined,
  isFocused: boolean
): { shouldFloat: boolean; hasValue: boolean } {
  const hasValue = value !== '' && value !== undefined && value !== null;
  const shouldFloat = isFocused || hasValue;
  return { hasValue, shouldFloat };
}
