import React, { useEffect, useState } from "react";

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
  size?: "sm" | "md" | "lg";
  "data-testid"?: string;
}

export function TahoeNumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  precision = 3,
  placeholder,
  className = "",
  disabled = false,
  size = "md",
  "data-testid": dataTestId,
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

      // Only call onChange if the value actually changed
      if (Math.abs(constrainedValue - value) > 1e-10) {
        onChange(constrainedValue);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Only reset if the input value is empty or invalid
    if (inputValue === "" || inputValue === "-") {
      setInputValue(value.toString());
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <div className={`relative group ${className}`}>
      <div
        className={`relative bg-white/10 backdrop-blur-xl border rounded-full shadow-lg transition-all duration-500 ease-out transform ${
          isFocused
            ? "border-blue-400/30 shadow-blue-500/25 scale-[1.02]"
            : "border-white/20 hover:border-white/40 hover:shadow-xl hover:scale-[1.01]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        // Advanced frosted glass effects
        style={{
          background: isFocused
            ? "linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.25) 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)",
          boxShadow: isFocused
            ? "0 4px 16px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.3)"
            : "0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.25)",
        }}
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
            isFocused ? "placeholder-gray-400/60" : ""
          }`}
        />

        {/* Enhanced frosted glass highlight overlay */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-all duration-500"
          style={{
            background: isFocused
              ? "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 100%)",
            boxShadow: isFocused
              ? "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(255,255,255,0.1)"
              : "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(255,255,255,0.05)",
          }}
        />

        {/* Subtle inner glow for focus state */}
        {isFocused && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at center, rgba(59,130,246,0.08) 0%, transparent 70%)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
        )}

        {/* Micro-interaction feedback */}
        <div
          className={`absolute inset-0 rounded-full pointer-events-none transition-all duration-200 ${
            isFocused ? "bg-gradient-to-r from-blue-500/5 to-indigo-500/5" : ""
          }`}
        />
      </div>

      {/* Floating label effect for focus */}
      {isFocused && placeholder && (
        <div
          className="absolute -top-3 left-3 px-2 bg-white/20 backdrop-blur-lg border border-white/30 rounded-lg text-xs font-medium text-gray-700 transition-all duration-300"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)",
            boxShadow:
              "0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
        >
          {placeholder}
        </div>
      )}
    </div>
  );
}
