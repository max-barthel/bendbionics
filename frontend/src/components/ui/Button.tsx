import React from 'react';
import { combineStyles, getTahoeGlassStyles } from '../../styles/tahoe-utils';
import LoadingSpinner from './LoadingSpinner';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly children: React.ReactNode;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly className?: string;
}

function Button({
  variant: _variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
}: ButtonProps) {
  // Check if custom text color is provided
  const hasCustomTextColor = className.includes('text-');

  // Base classes for all buttons - only include text-gray-800 if no custom color
  const baseClasses = hasCustomTextColor ? 'font-medium' : 'font-medium text-gray-800';

  // All variants use the same Tahoe glass styling (as per original design)
  const tahoeGlassClasses = getTahoeGlassStyles(
    'base', // glass variant
    'glass', // shadow variant
    'full', // border radius
    'standard', // transition
    'white', // focus state
    'glass' // hover state
  );

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const isDisabled = disabled || loading;
  const classes = combineStyles(
    baseClasses,
    tahoeGlassClasses,
    sizeClasses[size],
    className
  );

  return (
    <button type={type} onClick={onClick} disabled={isDisabled} className={classes}>
      <div className="flex items-center justify-center gap-2">
        {loading && <LoadingSpinner size="sm" color="white" />}
        {children}
      </div>
    </button>
  );
}

export default Button;
