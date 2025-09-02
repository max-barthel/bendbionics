import React, { useEffect, useState } from "react";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  precision = 3,
  placeholder,
  className = "",
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Allow empty input for better UX
    if (newValue === "" || newValue === "-") {
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

      onChange(constrainedValue);
    }
  };

  const handleBlur = () => {
    // Ensure the input value matches the actual value
    setInputValue(value.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const increment = () => {
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const decrement = () => {
    const newValue = value - step;
    if (min === undefined || newValue >= min) {
      onChange(newValue);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="number"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />

      {/* Increment/Decrement buttons */}
      <div className="absolute right-0 top-0 h-full flex flex-col">
        <button
          type="button"
          onClick={increment}
          disabled={disabled || (max !== undefined && value >= max)}
          className="flex-1 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-l border-t border-gray-300 rounded-tr-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={decrement}
          disabled={disabled || (min !== undefined && value <= min)}
          className="flex-1 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-l border-b border-gray-300 rounded-br-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ▼
        </button>
      </div>
    </div>
  );
};

export default NumberInput;
