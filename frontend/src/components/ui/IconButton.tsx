import {
  buttonVariants,
  iconButtonSizeClasses,
  type ComponentSize,
} from '@/styles/design-tokens';
import { combineStyles, getTahoeGlassPreset } from '@/styles/tahoe-utils';
import type { ReactNode } from 'react';

interface IconButtonProps {
  readonly onClick?: () => void;
  readonly children: ReactNode;
  readonly 'aria-label': string;
  readonly variant?: 'glass' | 'outline' | 'solid';
  readonly size?: ComponentSize;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly type?: 'button' | 'submit' | 'reset';
}

/**
 * IconButton - Reusable icon button component with Tahoe glass styling
 *
 * Eliminates duplicate icon button patterns (sidebar toggle, user menu buttons, etc.)
 */
export function IconButton({
  onClick,
  children,
  'aria-label': ariaLabel,
  variant = 'glass',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
}: Readonly<IconButtonProps>) {
  let variantClasses = '';
  if (variant === 'glass') {
    const glassClasses = getTahoeGlassPreset('enhancedButton');
    variantClasses = combineStyles(glassClasses, 'hover:scale-105');
  } else if (variant === 'outline') {
    variantClasses = buttonVariants.outline;
  } else {
    // solid variant
    variantClasses = buttonVariants.solid;
  }

  const classes = combineStyles(
    variantClasses,
    iconButtonSizeClasses[size],
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className
  );

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
