import { type ComponentSize } from '@/styles/design-tokens';
import type { ReactNode } from 'react';
import Button from './Button';

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
 * @deprecated Use Button with variant="icon" and iconVariant prop instead.
 * This component is kept for backward compatibility.
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
  return (
    <Button
      variant="icon"
      iconVariant={variant}
      size={size}
      {...(onClick && { onClick })}
      disabled={disabled}
      type={type}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </Button>
  );
}
