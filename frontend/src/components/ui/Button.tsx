import {
  buttonSizeClasses,
  buttonVariants,
  closeButtonSizeClasses,
  iconButtonSizeClasses,
  iconSizeClasses,
  toggleButtonVariants,
  type ComponentSize,
} from '@/styles/design-tokens';
import { cn, getTahoeGlassPreset } from '@/styles/tahoe-utils';
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface BaseButtonProps {
  readonly size?: ComponentSize;
  readonly children?: React.ReactNode;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly className?: string;
  readonly 'aria-label'?: string;
}

interface IconButtonProps extends BaseButtonProps {
  readonly variant: 'icon';
  readonly iconVariant?: 'glass' | 'outline' | 'solid';
}

interface ToggleButtonProps extends BaseButtonProps {
  readonly variant: 'toggle';
  readonly isOpen?: boolean;
  readonly direction?: 'up-down' | 'left-right';
}

interface CloseButtonProps extends BaseButtonProps {
  readonly variant: 'close';
}

interface PrimaryButtonProps extends BaseButtonProps {
  readonly variant?: 'primary';
}

interface DefaultButtonProps extends BaseButtonProps {
  readonly variant?: 'default';
}

type ButtonProps =
  | IconButtonProps
  | ToggleButtonProps
  | CloseButtonProps
  | PrimaryButtonProps
  | DefaultButtonProps;

/**
 * Button - Unified button component with variant system
 *
 * Supports multiple variants:
 * - 'default': Standard Tahoe glass button
 * - 'primary': Blue gradient button for primary actions
 * - 'icon': Icon-only button with glass/outline/solid variants
 * - 'toggle': Toggle button with arrow indicator
 * - 'close': Close button for modals with positioning
 */
function Button({
  variant = 'default',
  size = 'md',
  children,
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  'aria-label': ariaLabel,
  ...restProps
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // Handle variant-specific logic
  if (variant === 'primary') {
    const classes = cn(buttonVariants.primary, className);
    return (
      <button type={type} onClick={onClick} disabled={isDisabled} className={classes}>
        {children}
        <div className="absolute inset-0 rounded-full pointer-events-none z-0 bg-gradient-to-br from-white/10 to-white/5 shadow-inner" />
      </button>
    );
  }

  if (variant === 'icon') {
    const iconVariant =
      ('iconVariant' in restProps ? restProps.iconVariant : 'glass') ?? 'glass';
    let variantClasses = '';
    if (iconVariant === 'glass') {
      const glassClasses = getTahoeGlassPreset('enhancedButton');
      variantClasses = cn(glassClasses, 'hover:scale-105');
    } else if (iconVariant === 'outline') {
      variantClasses = buttonVariants.outline;
    } else {
      variantClasses = buttonVariants.solid;
    }

    const classes = cn(
      variantClasses,
      iconButtonSizeClasses[size],
      disabled ? 'opacity-50 cursor-not-allowed' : '',
      className
    );

    return (
      <button
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        className={classes}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    );
  }

  if (variant === 'toggle') {
    const { isOpen = false, direction = 'up-down' } = restProps as ToggleButtonProps;
    const classes = cn(toggleButtonVariants.panelToggle, className);

    // Determine arrow direction
    let arrowPath: string;
    if (direction === 'up-down') {
      arrowPath = isOpen ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7';
    } else {
      arrowPath = isOpen ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7';
    }

    return (
      <button
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        className={classes}
        aria-label={ariaLabel}
        {...restProps}
      >
        <svg
          className={toggleButtonVariants.panelToggleIcon}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={arrowPath}
          />
        </svg>
      </button>
    );
  }

  if (variant === 'close') {
    const glassClasses = getTahoeGlassPreset('enhancedButton');
    const classes = cn(
      'absolute top-4 right-4 z-10',
      glassClasses,
      closeButtonSizeClasses[size],
      'hover:scale-105',
      className
    );

    return (
      <button
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        className={classes}
        aria-label={ariaLabel ?? 'Close'}
      >
        <svg
          className={cn(
            iconSizeClasses[size],
            'text-gray-600 transition-transform duration-300'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    );
  }

  // Default variant
  const hasCustomTextColor = className.includes('text-');
  const baseClasses = hasCustomTextColor ? 'font-medium' : 'font-medium text-gray-800';
  const tahoeGlassClasses = getTahoeGlassPreset('button');
  const classes = cn(
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
