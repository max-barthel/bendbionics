import Button from './Button';

interface ToggleButtonProps {
  readonly isOpen?: boolean;
  readonly direction?: 'up-down' | 'left-right';
  readonly className?: string;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly 'aria-label'?: string;
}

/**
 * ToggleButton - Reusable toggle button for panels
 *
 * @deprecated Use Button with variant="toggle" instead.
 * This component is kept for backward compatibility.
 */
export function ToggleButton({
  isOpen = false,
  direction = 'up-down',
  className = '',
  onClick,
  disabled,
  type,
  'aria-label': ariaLabel,
}: Readonly<ToggleButtonProps>) {
  return (
    <Button
      variant="toggle"
      isOpen={isOpen}
      direction={direction}
      className={className}
      {...(onClick && { onClick })}
      {...(disabled !== undefined && { disabled })}
      {...(type && { type })}
      {...(ariaLabel && { 'aria-label': ariaLabel })}
    />
  );
}
