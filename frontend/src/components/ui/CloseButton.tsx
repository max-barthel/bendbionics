import { combineStyles, getTahoeGlassStyles } from '../../styles/tahoe-utils';

interface CloseButtonProps {
  readonly onClick: () => void;
  readonly 'aria-label': string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly className?: string;
}

/**
 * CloseButton - Reusable close button component with Tahoe glass styling
 *
 * Eliminates duplicate close button patterns found across modals
 */
export function CloseButton({
  onClick,
  'aria-label': ariaLabel,
  size = 'md',
  className = '',
}: CloseButtonProps) {
  // Base glass styling for close button
  const glassClasses = getTahoeGlassStyles(
    'enhanced', // glass variant
    'glass', // shadow variant
    'full', // border radius (rounded-full)
    'standard', // transition
    'white', // focus state
    'glass' // hover state
  );

  const sizeClasses = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const classes = combineStyles(
    'absolute top-4 right-4 z-10',
    glassClasses,
    sizeClasses[size],
    'hover:scale-105',
    className
  );

  return (
    <button onClick={onClick} className={classes} aria-label={ariaLabel} type="button">
      <svg
        className={`${iconSizeClasses[size]} text-gray-600 transition-transform duration-300`}
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
