import React, { useId, useState } from 'react';
import {
  combineStyles,
  getFloatingLabelStyles,
  getTahoeGlassStyles,
} from '../../styles/tahoe-utils';

type InputType = 'text' | 'number' | 'password';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps {
  type?: InputType;
  size?: InputSize;
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  onBlur?: () => void;
  onFocus?: () => void;
  min?: number;
  max?: number;
  step?: number;
}

// Helper function to get input classes
function getInputClasses(size: InputSize, error?: string, className?: string) {
  const sizeClasses = {
    sm: 'pl-4 pr-2 py-2 text-sm',
    md: 'px-3 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };
  const baseClasses = 'text-gray-800 placeholder:text-gray-500 bg-gray-50';
  const tahoeGlassClasses = getTahoeGlassStyles(
    'base',
    'subtle',
    'full',
    'standard',
    'blue',
    'subtle'
  );
  const errorClasses = error ? 'border-red-400/50 focus:ring-red-400/50' : '';
  return combineStyles(
    baseClasses,
    tahoeGlassClasses,
    sizeClasses[size],
    errorClasses,
    className
  );
}

// Helper function to handle input changes
function handleInputChange(
  e: React.ChangeEvent<HTMLInputElement>,
  type: InputType,
  onChange: (value: string | number) => void
) {
  const val = e.target.value;
  if (type === 'number') {
    const parsed = parseFloat(val);
    onChange(isNaN(parsed) ? val : parsed);
  } else {
    onChange(val);
  }
}

// Floating label component
function FloatingLabel({
  label,
  id,
  shouldFloat,
}: {
  readonly label: string;
  readonly id?: string;
  readonly shouldFloat: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={combineStyles(
        'absolute left-3 pointer-events-none transition-all duration-200',
        shouldFloat
          ? combineStyles(
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

// Custom hook for input state
function useInputState() {
  const [isFocused, setIsFocused] = useState(false);
  return { isFocused, setIsFocused };
}

// Custom hook for input focus handlers
function useInputFocusHandlers(
  setIsFocused: (focused: boolean) => void,
  onFocus?: () => void,
  onBlur?: () => void
) {
  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };
  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };
  return { handleFocus, handleBlur };
}

// Custom hook for input state and styling
function useInputStateAndStyling(size: InputSize, error?: string, className?: string) {
  const { isFocused, setIsFocused } = useInputState();
  const classes = getInputClasses(size, error, className);
  return { isFocused, setIsFocused, classes };
}

// Custom hook for input value and float logic
function useInputValueAndFloat(value: string | number, isFocused: boolean) {
  const hasValue = value !== '' && value !== undefined && value !== null;
  const shouldFloat = isFocused || hasValue;
  return { hasValue, shouldFloat };
}

function Input({
  type = 'text',
  size = 'md',
  value,
  onChange,
  placeholder,
  label,
  id,
  disabled = false,
  error,
  className = '',
  onBlur,
  onFocus,
  min,
  max,
  step,
}: Readonly<InputProps>) {
  // Ensure label is correctly associated even if no id is passed in
  const reactGeneratedId = useId();
  const inputId = id ?? `input-${reactGeneratedId}`;
  const { isFocused, setIsFocused, classes } = useInputStateAndStyling(
    size,
    error,
    className
  );
  const { handleFocus, handleBlur } = useInputFocusHandlers(
    setIsFocused,
    onFocus,
    onBlur
  );
  const { shouldFloat } = useInputValueAndFloat(value, isFocused);

  return (
    <div className="w-full relative">
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={e => handleInputChange(e, type, onChange)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={combineStyles('w-full', classes, label ? 'pt-3' : '')}
      />
      {label && <FloatingLabel label={label} id={inputId} shouldFloat={shouldFloat} />}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default Input;
