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
    "border rounded-lg bg-white/90 backdrop-blur-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md";

  const sizeClasses = {
    sm: "px-2 py-2 text-sm",
    md: "px-3 py-2.5 text-sm",
    lg: "px-4 py-3 text-base",
  };

  const errorClasses = error
    ? "border-red-300 focus:ring-red-400/50"
    : "border-neutral-300/60";
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
      />
      {label && (
        <label
          htmlFor={id}
          className={`absolute left-3 pointer-events-none transition-all duration-200 ${
            shouldFloat
              ? "top-0 transform -translate-y-1/2 text-xs text-neutral-500 bg-white/90 backdrop-blur-sm px-1.5"
              : "top-1/2 transform -translate-y-1/2 text-sm text-neutral-500"
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
