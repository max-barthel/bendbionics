import React from "react";

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
  min,
  max,
  step,
}: InputProps) {
  const baseClasses =
    "border rounded-xl bg-neutral-100 text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400 transition disabled:opacity-50";

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-[15px]",
    lg: "px-6 py-4 text-base",
  };

  const errorClasses = error
    ? "border-red-300 focus:ring-red-400"
    : "border-neutral-300";
  const classes = `${baseClasses} ${sizeClasses[size]} ${errorClasses} ${className}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (type === "number") {
      const parsed = parseFloat(val);
      onChange(isNaN(parsed) ? "" : parsed);
    } else {
      onChange(val);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-neutral-700 mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`w-full ${classes}`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default Input;
