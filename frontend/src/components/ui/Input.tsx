import React, { useState } from 'react';
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
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== '' && value !== undefined && value !== null;
  const shouldFloat = isFocused || hasValue;

  // Base input classes using design system
  const baseClasses = 'text-gray-800 placeholder:text-gray-500 bg-gray-50';

  // Tahoe glass styling for the input
  const tahoeGlassClasses = getTahoeGlassStyles(
    'base', // glass variant
    'subtle', // shadow variant (subtle for inputs)
    'full', // border radius
    'standard', // transition
    'blue', // focus state (blue for inputs)
    'subtle' // hover state (subtle for inputs)
  );

  const sizeClasses = {
    sm: 'pl-4 pr-2 py-2 text-sm',
    md: 'px-3 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const errorClasses = error ? 'border-red-400/50 focus:ring-red-400/50' : '';

  const classes = combineStyles(
    baseClasses,
    tahoeGlassClasses,
    sizeClasses[size],
    errorClasses,
    className
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (type === 'number') {
      const parsed = parseFloat(val);
      onChange(isNaN(parsed) ? val : parsed);
    } else {
      onChange(val);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <div className="w-full relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={combineStyles('w-full', classes, label ? 'pt-3' : '')}
      />
      {label && (
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
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default Input;
