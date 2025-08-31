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
    "font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500/50 shadow-lg hover:shadow-xl",
    secondary:
      "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 hover:from-gray-200 hover:to-gray-300 focus:ring-gray-500/50 shadow-sm hover:shadow-md",
    outline:
      "border border-gray-300/60 bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md focus:ring-gray-500/50 shadow-sm",
    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100/50 focus:ring-gray-500/50",
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
