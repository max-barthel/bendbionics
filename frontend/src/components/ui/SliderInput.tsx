import React, { useState } from "react";
import { TahoeNumberInput } from "./TahoeNumberInput";

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
  const [isFocused, setIsFocused] = useState(false);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(newValue);
  };

  const sliderId = `slider-${
    label?.toLowerCase().replace(/\s+/g, "-") || "input"
  }`;

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-800">{label}</span>
          <div
            className="text-xs text-gray-600 bg-white/10 backdrop-blur-xl border border-white/20 px-3 py-1.5 rounded-full shadow-2xl shadow-black/5"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            {min} - {max}
          </div>
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
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            aria-label={label || "Slider input"}
            className="w-full h-2 bg-gray-200/60 backdrop-blur-xl border border-gray-300/50 rounded-full appearance-none cursor-pointer
                     focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-opacity-50
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/60 [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-400/60 [&::-webkit-slider-thumb]:shadow-2xl
                     [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-300
                     [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:shadow-2xl
                     [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-white/60 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2
                     [&::-moz-range-thumb]:border-gray-400/60 [&::-moz-range-thumb]:shadow-2xl
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div
            className={`absolute top-0 h-2 bg-blue-500 rounded-full pointer-events-none transition-all duration-200`}
            style={{
              width: `${Math.max(
                0,
                Math.min(100, ((value - min) / (max - min)) * 100)
              )}%`,
            }}
          />
        </div>

        <div className="w-20">
          <TahoeNumberInput
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            step={step}
            placeholder={placeholder}
            disabled={disabled}
            size="sm"
            className="text-center"
          />
        </div>
      </div>
    </div>
  );
}

export default SliderInput;
