import React from "react";
import LoadingSpinner from "./LoadingSpinner";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

function Button({
  variant = "primary",
  size = "md",
  children,
  onClick,
  disabled = false,
  loading = false,
  type = "button",
  className = "",
}: ButtonProps) {
  const baseClasses =
    "font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-black text-white hover:bg-neutral-800 focus:ring-neutral-500",
    secondary:
      "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500",
    outline:
      "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-500",
    ghost:
      "bg-transparent text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm rounded-md",
    md: "px-4 py-2 text-sm rounded-md",
    lg: "px-6 py-3 text-base rounded-lg",
  };

  const isDisabled = disabled || loading;
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={classes}
    >
      <div className="flex items-center justify-center gap-2">
        {loading && <LoadingSpinner size="sm" color="white" />}
        {children}
      </div>
    </button>
  );
}

export default Button;
