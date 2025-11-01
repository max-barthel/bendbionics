import { buttonSizeClasses, type ComponentSize } from '@/styles/design-tokens';
import { combineStyles, getTahoeGlassStyles } from '@/styles/tahoe-utils';
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps {
  readonly size?: ComponentSize;
  readonly children: React.ReactNode;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly className?: string;
}

/**
 * Button - Generic button component with Tahoe glass styling
 *
 * For primary actions with blue gradient, use PrimaryButton.
 * For icon-only buttons, use IconButton.
 * For close buttons in modals, use CloseButton.
 */
function Button({
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

  const isDisabled = disabled || loading;
  const classes = combineStyles(
    baseClasses,
    tahoeGlassClasses,
    buttonSizeClasses[size],
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
