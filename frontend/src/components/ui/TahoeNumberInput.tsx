import React, { useEffect, useState } from 'react';
import { combineStyles, getTahoeGlassStyles } from '../../styles/tahoe-utils';

interface TahoeNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  'data-testid'?: string;
}

export function TahoeNumberInput({
  value,
  onChange,
  min,
  max,
  precision = 3,
  placeholder,
  className = '',
  disabled = false,
  size = 'md',
  'data-testid': dataTestId,
}: TahoeNumberInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Only update input value if not currently focused (to avoid overriding user input)
    if (!isFocused) {
      setInputValue(value.toString());
    }
  }, [value, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Allow empty input for better UX
    if (newValue === '' || newValue === '-') {
      return;
    }

    const numValue = parseFloat(newValue);

    if (!isNaN(numValue)) {
      // Apply constraints
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

      // Only call onChange if the value actually changed
      if (Math.abs(constrainedValue - value) > 1e-10) {
        onChange(constrainedValue);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Only reset if the input value is empty or invalid
    if (inputValue === '' || inputValue === '-') {
      setInputValue(value.toString());
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // Get Tahoe glass styling
  const tahoeGlassClasses = getTahoeGlassStyles(
    'subtle', // glass variant (subtle for number inputs)
    'subtle', // shadow variant
    'full', // border radius
    'standard', // transition
    'blue', // focus state
    'subtle' // hover state (subtle for inputs)
  );

  return (
    <div className={combineStyles('relative group', className)}>
      <div
        className={combineStyles(
          'relative transition-all duration-300 ease-out',
          tahoeGlassClasses,
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        )}
      >
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          data-testid={dataTestId}
          className={`w-full bg-transparent border-0 outline-none text-gray-900 placeholder-gray-500/70 font-medium pr-4 transition-all duration-300 ${
            sizeClasses[size]
          } [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${
            isFocused ? 'placeholder-gray-400/60' : ''
          }`}
        />

        {/* Enhanced frosted glass highlight overlay */}
        <div
          className={`absolute inset-0 rounded-full pointer-events-none transition-all duration-500 ${
            isFocused
              ? 'bg-gradient-to-br from-white/15 via-white/8 to-white/3 shadow-inner'
              : 'bg-gradient-to-br from-white/12 via-white/6 to-white/2 shadow-inner'
          }`}
        />

        {/* Subtle inner glow for focus state */}
        {isFocused && (
          <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-r from-blue-500/8 via-blue-500/4 to-transparent animate-pulse" />
        )}

        {/* Micro-interaction feedback */}
        <div
          className={`absolute inset-0 rounded-full pointer-events-none transition-all duration-200 ${
            isFocused ? 'bg-gradient-to-r from-blue-500/5 to-indigo-500/5' : ''
          }`}
        />
      </div>

      {/* Floating label effect for focus */}
      {isFocused && placeholder && (
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
      )}
    </div>
  );
}
