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

type ButtonType = 'button' | 'submit' | 'reset';
type IconVariant = 'glass' | 'outline' | 'solid';
type ToggleDirection = 'up-down' | 'left-right';

interface BaseButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'size' | 'onClick' | 'disabled' | 'type' | 'className'
  > {
  readonly size?: ComponentSize;
  readonly children?: React.ReactNode;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly type?: ButtonType;
  readonly className?: string;
  readonly 'aria-label'?: string;
}

interface IconButtonProps extends BaseButtonProps {
  readonly variant: 'icon';
  readonly iconVariant?: IconVariant;
}

interface ToggleButtonProps extends BaseButtonProps {
  readonly variant: 'toggle';
  readonly isOpen?: boolean;
  readonly direction?: ToggleDirection;
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

// Helper function to render primary button
function renderPrimaryButton({
  children,
  onClick,
  isDisabled,
  type,
  className,
  ariaLabel,
  ...restProps
}: {
  children?: React.ReactNode;
  onClick?: (() => void) | undefined;
  isDisabled: boolean;
  type: ButtonType;
  className: string;
  ariaLabel?: string | undefined;
  [key: string]: unknown;
}) {
  const classes = cn(buttonVariants.primary, className);
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={classes}
      aria-label={ariaLabel}
      {...restProps}
    >
      {children}
      <div className="absolute inset-0 rounded-full pointer-events-none z-0 bg-linear-to-br from-white/10 to-white/5 shadow-inner" />
    </button>
  );
}

// Helper function to get icon variant classes
function getIconVariantClasses(iconVariant: IconVariant): string {
  if (iconVariant === 'glass') {
    const glassClasses = getTahoeGlassPreset('enhancedButton');
    return cn(glassClasses, 'hover:scale-105');
  }
  if (iconVariant === 'outline') {
    return buttonVariants.outline;
  }
  return buttonVariants.solid;
}

// Helper function to render icon button
function renderIconButton({
  children,
  onClick,
  isDisabled,
  type,
  size,
  className,
  ariaLabel,
  iconVariant,
  ...restProps
}: {
  children?: React.ReactNode;
  onClick?: (() => void) | undefined;
  isDisabled: boolean;
  type: ButtonType;
  size: ComponentSize;
  className: string;
  ariaLabel?: string | undefined;
  iconVariant?: IconVariant | undefined;
  disabled?: boolean | undefined;
  [key: string]: unknown;
}) {
  const variantClasses = getIconVariantClasses(iconVariant ?? 'glass');
  const classes = cn(
    variantClasses,
    iconButtonSizeClasses[size],
    isDisabled ? 'opacity-50 cursor-not-allowed' : '',
    className
  );

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={classes}
      aria-label={ariaLabel}
      {...restProps}
    >
      {children}
    </button>
  );
}

// Helper function to get arrow path for toggle button
function getToggleArrowPath(isOpen: boolean, direction: ToggleDirection): string {
  if (direction === 'up-down') {
    return isOpen ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7';
  }
  return isOpen ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7';
}

// Helper function to render toggle button
function renderToggleButton({
  onClick,
  isDisabled,
  type,
  className,
  ariaLabel,
  isOpen = false,
  direction = 'up-down',
  ...restProps
}: {
  onClick?: (() => void) | undefined;
  isDisabled: boolean;
  type: ButtonType;
  className: string;
  ariaLabel?: string | undefined;
  isOpen?: boolean | undefined;
  direction?: ToggleDirection | undefined;
  [key: string]: unknown;
}) {
  const classes = cn(toggleButtonVariants.panelToggle, className);
  const arrowPath = getToggleArrowPath(isOpen, direction);

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

// Helper function to render close button
function renderCloseButton({
  onClick,
  isDisabled,
  type,
  size,
  className,
  ariaLabel,
  ...restProps
}: {
  onClick?: (() => void) | undefined;
  isDisabled: boolean;
  type: ButtonType;
  size: ComponentSize;
  className: string;
  ariaLabel?: string | undefined;
  [key: string]: unknown;
}) {
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
      {...restProps}
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

// Helper function to render default button
function renderDefaultButton({
  children,
  onClick,
  isDisabled,
  loading,
  type,
  size,
  className,
  ariaLabel,
  ...restProps
}: {
  children?: React.ReactNode;
  onClick?: (() => void) | undefined;
  isDisabled: boolean;
  loading: boolean;
  type: ButtonType;
  size: ComponentSize;
  className: string;
  ariaLabel?: string | undefined;
  [key: string]: unknown;
}) {
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
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={classes}
      aria-label={ariaLabel}
      {...restProps}
    >
      <div className="flex items-center justify-center gap-2">
        {loading && <LoadingSpinner size="sm" color="white" />}
        {children}
      </div>
    </button>
  );
}

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

  if (variant === 'primary') {
    return renderPrimaryButton({
      children,
      onClick,
      isDisabled,
      type,
      className,
      ariaLabel,
      ...restProps,
    });
  }

  if (variant === 'icon') {
    const iconVariant =
      ('iconVariant' in restProps ? restProps.iconVariant : 'glass') ?? 'glass';
    return renderIconButton({
      children,
      onClick,
      isDisabled,
      type,
      size,
      className,
      ariaLabel,
      iconVariant,
      disabled,
      ...restProps,
    });
  }

  if (variant === 'toggle') {
    const {
      isOpen = false,
      direction = 'up-down',
      ...toggleRestProps
    } = restProps as ToggleButtonProps;
    return renderToggleButton({
      onClick,
      isDisabled,
      type,
      className,
      ariaLabel,
      isOpen,
      direction,
      ...toggleRestProps,
    });
  }

  if (variant === 'close') {
    return renderCloseButton({
      onClick,
      isDisabled,
      type,
      size,
      className,
      ariaLabel,
      ...restProps,
    });
  }

  return renderDefaultButton({
    children,
    onClick,
    isDisabled,
    loading,
    type,
    size,
    className,
    ariaLabel,
    ...restProps,
  });
}

export default Button;
