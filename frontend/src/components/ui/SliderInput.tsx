import React, { useState } from "react";

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
    <div className={`space-y-4 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-700">{label}</span>
          <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-1 rounded-full">
            {min} - {max}
          </span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
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
            className="w-full h-1.5 bg-neutral-200 rounded-full appearance-none cursor-pointer
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-lg
                     [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200
                     [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:shadow-xl
                     [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2
                     [&::-moz-range-thumb]:border-blue-500 [&::-moz-range-thumb]:shadow-lg
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div
            className="absolute top-0 h-1.5 bg-blue-500 rounded-full pointer-events-none transition-all duration-200"
            style={{ width: `${((value - min) / (max - min)) * 100}%` }}
          />
        </div>

        <div className="w-20">
          <div className="relative">
            <input
              id={inputId}
              type="number"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputBlur}
              placeholder={placeholder}
              disabled={disabled}
              min={min}
              max={max}
              step={step}
              className="w-full px-2 py-1.5 text-sm bg-neutral-50 border-0 rounded-md
                       focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white
                       transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                       text-center font-semibold text-neutral-700 shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SliderInput;
