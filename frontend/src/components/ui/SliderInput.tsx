import React, { useState } from "react";
import Input from "./Input";

type SliderInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

function SliderInput({
  value,
  onChange,
  min = 1,
  max = 2000,
  step = 1,
  label,
  placeholder,
  disabled = false,
  className = "",
}: SliderInputProps) {
  const [inputValue, setInputValue] = useState<string>(value.toString());

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleInputChange = (newValue: string | number) => {
    if (typeof newValue === "string") {
      setInputValue(newValue);
      const parsed = parseFloat(newValue);
      if (!isNaN(parsed) && parsed >= min && parsed <= max) {
        onChange(parsed);
      }
    } else {
      onChange(newValue);
      setInputValue(newValue.toString());
    }
  };

  const handleInputBlur = () => {
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed) || parsed < min) {
      setInputValue(min.toString());
      onChange(min);
    } else if (parsed > max) {
      setInputValue(max.toString());
      onChange(max);
    }
  };

  // Sync input value when external value changes
  React.useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const sliderId = `slider-${
    label?.toLowerCase().replace(/\s+/g, "-") || "input"
  }`;
  const inputId = `input-${
    label?.toLowerCase().replace(/\s+/g, "-") || "input"
  }`;

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-700">{label}</span>
          <span className="text-sm text-neutral-500">
            {min} - {max}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <input
            id={sliderId}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleSliderChange}
            disabled={disabled}
            aria-label={label || "Slider input"}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md
                     [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2
                     [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="w-24">
          <Input
            id={inputId}
            type="number"
            size="sm"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
          />
        </div>
      </div>
    </div>
  );
}

export default SliderInput;
