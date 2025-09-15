import React, { useState } from "react";

type InputType = "text" | "number" | "email" | "password";
type InputSize = "sm" | "md" | "lg";

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
  type = "text",
  size = "md",
  value,
  onChange,
  placeholder,
  label,
  id,
  disabled = false,
  error,
  className = "",
  onBlur,
  onFocus,
  min,
  max,
  step,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== "" && value !== undefined && value !== null;
  const shouldFloat = isFocused || hasValue;

  const baseClasses =
    "border border-gray-300 rounded-full bg-gray-50 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/30 focus:bg-white transition-all duration-300 disabled:opacity-50 shadow-sm hover:shadow-md";

  const sizeClasses = {
    sm: "pl-4 pr-2 py-2 text-sm",
    md: "px-3 py-2.5 text-sm",
    lg: "px-4 py-3 text-base",
  };

  const errorClasses = error
    ? "border-red-400/50 focus:ring-red-400/50"
    : "border-gray-300";
  const classes = `${baseClasses} ${sizeClasses[size]} ${errorClasses} ${className}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (type === "number") {
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
        className={`w-full ${classes} ${label ? "pt-3" : ""}`}
        style={
          isFocused
            ? {
                background:
                  "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.15) 100%)",
                boxShadow:
                  "0 4px 16px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.3)",
                border: "1px solid rgba(59,130,246,0.4)",
              }
            : undefined
        }
      />
      {isFocused && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        />
      )}
      {label && (
        <label
          htmlFor={id}
          className={`absolute left-3 pointer-events-none transition-all duration-200 ${
            shouldFloat
              ? "top-0 transform -translate-y-1/2 text-xs text-gray-600 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full px-1.5"
              : "top-1/2 transform -translate-y-1/2 text-sm text-gray-600"
          }`}
        >
          {label}
        </label>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default Input;
