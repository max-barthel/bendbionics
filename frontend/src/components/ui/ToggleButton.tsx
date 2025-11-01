import { toggleButtonVariants } from '../../styles/design-tokens';
import { combineStyles } from '../../styles/tahoe-utils';

interface ToggleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly isOpen?: boolean;
  readonly direction?: 'up-down' | 'left-right';
  readonly className?: string;
}

/**
 * ToggleButton - Reusable toggle button for panels
 *
 * Extracted from TendonResultsPanel and other components
 * to eliminate hardcoded style duplication.
 */
export function ToggleButton({
  isOpen = false,
  direction = 'up-down',
  className = '',
  ...restProps
}: Readonly<ToggleButtonProps>) {
  const classes = combineStyles(toggleButtonVariants.panelToggle, className);

  // Determine arrow direction based on isOpen and direction prop
  let arrowPath: string;
  if (direction === 'up-down') {
    arrowPath = isOpen ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'; // Up (close) or Down (open)
  } else {
    arrowPath = isOpen ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'; // Left (close) or Right (open)
  }

  return (
    <button className={classes} {...restProps}>
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
