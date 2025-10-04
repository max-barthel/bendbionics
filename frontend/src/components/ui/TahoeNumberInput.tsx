import React, { useEffect, useState } from 'react';
import { combineStyles, getTahoeGlassStyles } from '../../styles/tahoe-utils';

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

  const numValue = parseFloat(newValue);
  if (isNaN(numValue)) {
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
}) {
  const { setInputValue, setIsFocused, value, onChange, min, max, precision } = params;

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
      className={`w-full bg-transparent border-0 outline-none text-gray-900 placeholder-gray-500/70 font-medium pr-4 transition-all duration-300 ${getSizeClasses(size)} [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${isFocused ? 'placeholder-gray-400/60' : ''}`}
    />
  );
}

// Custom hook for TahoeNumberInput state and handlers
function useTahoeNumberInputState(
  value: number,
  onChange: (value: number) => void,
  min?: number,
  max?: number,
  precision: number = DEFAULT_PRECISION
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
    });
  return {
    inputValue,
    isFocused,
    handleInputChange,
    handleBlur,
    handleFocus,
    handleKeyDown,
  };
}

// Custom hook for TahoeNumberInput styling
function useTahoeNumberInputStyling() {
  const tahoeGlassClasses = getTahoeGlassStyles(
    'subtle',
    'subtle',
    'full',
    'standard',
    'blue',
    'subtle'
  );
  return { tahoeGlassClasses };
}

// Custom hook for TahoeNumberInput state and styling
function useTahoeNumberInputStateAndStyling(
  value: number,
  onChange: (value: number) => void,
  min?: number,
  max?: number,
  precision: number = DEFAULT_PRECISION
) {
  const {
    inputValue,
    isFocused,
    handleInputChange,
    handleBlur,
    handleFocus,
    handleKeyDown,
  } = useTahoeNumberInputState(value, onChange, min, max, precision);
  const { tahoeGlassClasses } = useTahoeNumberInputStyling();
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

// Custom hook for TahoeNumberInput rendering
function useTahoeNumberInputRendering(params: {
  readonly inputValue: string;
  readonly isFocused: boolean;
  readonly handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly handleBlur: (value: string) => void;
  readonly handleFocus: () => void;
  readonly handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  readonly disabled: boolean;
  readonly size: Size;
  readonly placeholder: string | undefined;
  readonly dataTestId: string | undefined;
}) {
  const {
    inputValue,
    isFocused,
    handleInputChange,
    handleBlur,
    handleFocus,
    handleKeyDown,
    disabled,
    size,
    placeholder,
    dataTestId,
  } = params;
  return {
    inputValue,
    isFocused,
    handleInputChange,
    handleBlur,
    handleFocus,
    handleKeyDown,
    placeholder: placeholder ?? undefined,
    disabled,
    dataTestId,
    size,
  };
}

// Custom hook for TahoeNumberInput component
function useTahoeNumberInputComponent(params: {
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly disabled: boolean;
  readonly size: Size;
  readonly min: number | undefined;
  readonly max: number | undefined;
  readonly precision: number;
  readonly placeholder: string | undefined;
  readonly dataTestId: string | undefined;
}) {
  const {
    value,
    onChange,
    disabled,
    size,
    min,
    max,
    precision,
    placeholder,
    dataTestId,
  } = params;
  const {
    inputValue,
    isFocused,
    handleInputChange,
    handleBlur,
    handleFocus,
    handleKeyDown,
    tahoeGlassClasses,
  } = useTahoeNumberInputStateAndStyling(value, onChange, min, max, precision);
  const {
    inputValue: renderInputValue,
    isFocused: renderIsFocused,
    handleInputChange: renderHandleInputChange,
    handleBlur: renderHandleBlur,
    handleFocus: renderHandleFocus,
    handleKeyDown: renderHandleKeyDown,
    placeholder: renderPlaceholder,
    disabled: renderDisabled,
    dataTestId: renderDataTestId,
    size: renderSize,
  } = useTahoeNumberInputRendering({
    inputValue,
    isFocused,
    handleInputChange,
    handleBlur,
    handleFocus,
    handleKeyDown,
    disabled,
    size,
    placeholder,
    dataTestId,
  });
  return {
    inputValue: renderInputValue,
    isFocused: renderIsFocused,
    handleInputChange: renderHandleInputChange,
    handleBlur: renderHandleBlur,
    handleFocus: renderHandleFocus,
    handleKeyDown: renderHandleKeyDown,
    placeholder: renderPlaceholder,
    disabled: renderDisabled,
    dataTestId: renderDataTestId,
    size: renderSize,
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
  'data-testid': dataTestId,
}: Readonly<TahoeNumberInputProps>) {
  const {
    inputValue,
    isFocused,
    handleInputChange,
    handleBlur,
    handleFocus,
    handleKeyDown,
    placeholder: renderPlaceholder,
    disabled: renderDisabled,
    dataTestId: renderDataTestId,
    size: renderSize,
    tahoeGlassClasses,
    isFocused: renderIsFocused,
  } = useTahoeNumberInputComponent({
    value,
    onChange,
    disabled,
    size,
    min,
    max,
    precision,
    placeholder,
    dataTestId,
  });

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
          placeholder={renderPlaceholder}
          disabled={renderDisabled}
          dataTestId={renderDataTestId}
          size={renderSize}
          isFocused={renderIsFocused}
        />

        <div
          className={`absolute inset-0 rounded-full pointer-events-none transition-all duration-500 ${isFocused ? 'bg-gradient-to-br from-white/15 via-white/8 to-white/3 shadow-inner' : 'bg-gradient-to-br from-white/12 via-white/6 to-white/2 shadow-inner'}`}
        />

        {isFocused && (
          <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-r from-blue-500/8 via-blue-500/4 to-transparent animate-pulse" />
        )}

        <div
          className={`absolute inset-0 rounded-full pointer-events-none transition-all duration-200 ${isFocused ? 'bg-gradient-to-r from-blue-500/5 to-indigo-500/5' : ''}`}
        />
      </div>

      {isFocused && placeholder && <FloatingLabel placeholder={placeholder} />}
    </div>
  );
}
