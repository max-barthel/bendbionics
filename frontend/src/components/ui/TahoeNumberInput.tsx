import React, { useEffect, useState } from 'react';
import { combineStyles, getTahoeGlassStyles } from '@/styles/tahoe-utils';

// Constants
const DEFAULT_PRECISION = 3;
const FLOATING_POINT_TOLERANCE = 1e-10;

// Types
type Size = 'sm' | 'md' | 'lg';

interface TahoeNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  precision?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: Size;
  onBlur?: () => void;
  'data-testid'?: string;
}

// Helper function to get size classes
function getSizeClasses(size: Size) {
  return {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }[size];
}

// Helper function to process input value
function processInputValue(
  newValue: string,
  currentValue: number,
  min?: number,
  max?: number,
  precision: number = DEFAULT_PRECISION
): number | null {
  if (newValue === '' || newValue === '-') {
    return null;
  }

  const numValue = Number.parseFloat(newValue);
  if (Number.isNaN(numValue)) {
    return null;
  }

  let constrainedValue = numValue;

  if (min !== undefined && constrainedValue < min) {
    constrainedValue = min;
  }

  if (max !== undefined && constrainedValue > max) {
    constrainedValue = max;
  }

  // Round to precision
  const multiplier = Math.pow(10, precision);
  constrainedValue = Math.round(constrainedValue * multiplier) / multiplier;

  // Only return if the value actually changed
  if (Math.abs(constrainedValue - currentValue) > FLOATING_POINT_TOLERANCE) {
    return constrainedValue;
  }

  return null;
}

// Floating label component
function FloatingLabel({ placeholder }: { readonly placeholder: string }) {
  return (
    <div
      className={combineStyles(
        'absolute -top-3 left-3 px-2 text-xs font-medium text-gray-700 transition-all duration-300',
        getTahoeGlassStyles(
          'base',
          'subtle',
          'medium',
          'standard',
          'white',
          'glass',
          false
        )
      )}
    >
      {placeholder}
    </div>
  );
}

// Custom hook for input state management
function useInputState(value: number) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toString());
    }
  }, [value, isFocused]);

  return { inputValue, setInputValue, isFocused, setIsFocused };
}

// Input handlers hook
function useInputHandlers(params: {
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  setIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
  value: number;
  onChange: (value: number) => void;
  min: number | undefined;
  max: number | undefined;
  precision: number;
  onBlur?: () => void;
}) {
  const { setInputValue, setIsFocused, value, onChange, min, max, precision, onBlur } =
    params;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    const processedValue = processInputValue(newValue, value, min, max, precision);
    if (processedValue !== null) {
      onChange(processedValue);
    }
  };

  const handleBlur = (inputValue: string) => {
    setIsFocused(false);
    if (inputValue === '' || inputValue === '-') {
      setInputValue(value.toString());
    }
    // Call external onBlur if provided
    onBlur?.();
  };

  const handleFocus = () => setIsFocused(true);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return { handleInputChange, handleBlur, handleFocus, handleKeyDown };
}

// Input field component
function InputField({
  inputValue,
  handleInputChange,
  handleBlur,
  handleFocus,
  handleKeyDown,
  placeholder,
  disabled,
  dataTestId,
  size,
  isFocused,
}: {
  readonly inputValue: string;
  readonly handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly handleBlur: (value: string) => void;
  readonly handleFocus: () => void;
  readonly handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  readonly placeholder: string | undefined;
  readonly disabled: boolean;
  readonly dataTestId: string | undefined;
  readonly size: Size;
  readonly isFocused: boolean;
}) {
  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      onBlur={() => handleBlur(inputValue)}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      data-testid={dataTestId}
      className={combineStyles(
        'w-full bg-transparent border-0 outline-none text-gray-900 placeholder-gray-500/70 font-medium pr-4 transition-all duration-300',
        getSizeClasses(size),
        '[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]',
        isFocused ? 'placeholder-gray-400/60' : ''
      )}
    />
  );
}

// Custom hook for TahoeNumberInput - consolidates state, handlers, and styling
function useTahoeNumberInput(
  value: number,
  onChange: (value: number) => void,
  min?: number,
  max?: number,
  precision: number = DEFAULT_PRECISION,
  onBlur?: () => void
) {
  const { inputValue, setInputValue, isFocused, setIsFocused } = useInputState(value);
  const { handleInputChange, handleBlur, handleFocus, handleKeyDown } =
    useInputHandlers({
      setInputValue,
      setIsFocused,
      value,
      onChange,
      min,
      max,
      precision,
      ...(onBlur && { onBlur }),
    });

  const tahoeGlassClasses = getTahoeGlassStyles(
    'subtle',
    'subtle',
    'full',
    'standard',
    'blue',
    'subtle'
  );

  return {
    inputValue,
    isFocused,
    handleInputChange,
    handleBlur,
    handleFocus,
    handleKeyDown,
    tahoeGlassClasses,
  };
}

export function TahoeNumberInput({
  value,
  onChange,
  min,
  max,
  precision = DEFAULT_PRECISION,
  placeholder,
  className = '',
  disabled = false,
  size = 'md',
  onBlur,
  'data-testid': dataTestId,
}: Readonly<TahoeNumberInputProps>) {
  const {
    inputValue,
    isFocused,
    handleInputChange,
    handleBlur,
    handleFocus,
    handleKeyDown,
    tahoeGlassClasses,
  } = useTahoeNumberInput(value, onChange, min, max, precision, onBlur);

  return (
    <div className={combineStyles('relative group', className)}>
      <div
        className={combineStyles(
          'relative transition-all duration-300 ease-out',
          tahoeGlassClasses,
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        )}
      >
        <InputField
          inputValue={inputValue}
          handleInputChange={handleInputChange}
          handleBlur={handleBlur}
          handleFocus={handleFocus}
          handleKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          dataTestId={dataTestId}
          size={size}
          isFocused={isFocused}
        />

        <div
          className={combineStyles(
            'absolute inset-0 rounded-full pointer-events-none transition-all duration-500',
            isFocused
              ? 'bg-gradient-to-br from-white/15 via-white/8 to-white/3 shadow-inner'
              : 'bg-gradient-to-br from-white/12 via-white/6 to-white/2 shadow-inner'
          )}
        />

        {isFocused && (
          <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-r from-blue-500/8 via-blue-500/4 to-transparent animate-pulse" />
        )}

        <div
          className={combineStyles(
            'absolute inset-0 rounded-full pointer-events-none transition-all duration-200',
            isFocused ? 'bg-gradient-to-r from-blue-500/5 to-indigo-500/5' : ''
          )}
        />
      </div>

      {isFocused && placeholder && <FloatingLabel placeholder={placeholder} />}
    </div>
  );
}
