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
    "font-medium transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-white/20 backdrop-blur-xl border border-white/30 text-gray-800 hover:bg-white/30 hover:shadow-2xl focus:ring-white/50 shadow-2xl",
    secondary:
      "bg-white/20 backdrop-blur-xl border border-white/30 text-gray-800 hover:bg-white/30 hover:shadow-2xl focus:ring-white/50 shadow-2xl",
    outline:
      "bg-white/20 backdrop-blur-xl border border-white/30 text-gray-800 hover:bg-white/30 hover:shadow-2xl focus:ring-white/50 shadow-2xl",
    ghost:
      "bg-white/20 backdrop-blur-xl border border-white/30 text-gray-800 hover:bg-white/30 hover:shadow-2xl focus:ring-white/50 shadow-2xl",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm rounded-full",
    md: "px-4 py-2 text-sm rounded-full",
    lg: "px-6 py-3 text-base rounded-full",
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
