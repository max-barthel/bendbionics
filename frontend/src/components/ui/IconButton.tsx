import type { ReactNode } from 'react';
import { combineStyles, getTahoeGlassStyles } from '@/styles/tahoe-utils';

interface IconButtonProps {
  readonly onClick?: () => void;
  readonly children: ReactNode;
  readonly 'aria-label': string;
  readonly variant?: 'glass' | 'outline' | 'solid';
  readonly size?: 'sm' | 'md' | 'lg';
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
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  let variantClasses = '';
  if (variant === 'glass') {
    const glassClasses = getTahoeGlassStyles(
      'enhanced', // glass variant
      'glass', // shadow variant
      'full', // border radius
      'standard', // transition
      'white', // focus state
      'glass' // hover state
    );
    variantClasses = combineStyles(glassClasses, 'hover:scale-105');
  } else if (variant === 'outline') {
    variantClasses = combineStyles(
      'border border-gray-300 bg-white/80 backdrop-blur-sm hover:bg-white/90',
      'rounded-full transition-all duration-300 hover:scale-105'
    );
  } else {
    // solid variant
    variantClasses = combineStyles(
      'bg-gradient-to-br from-blue-500/25 to-indigo-500/25',
      'backdrop-blur-xl border border-blue-400/30 shadow-lg',
      'hover:scale-105 rounded-full transition-all duration-300',
      'shadow-blue-500/20'
    );
  }

  const classes = combineStyles(
    variantClasses,
    sizeClasses[size],
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
