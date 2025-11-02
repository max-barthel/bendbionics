import { type ComponentSize } from '@/styles/design-tokens';
import Button from './Button';

interface CloseButtonProps {
  readonly onClick: () => void;
  readonly 'aria-label': string;
  readonly size?: ComponentSize;
  readonly className?: string;
}

/**
 * CloseButton - Reusable close button component with Tahoe glass styling
 *
 * @deprecated Use Button with variant="close" instead.
 * This component is kept for backward compatibility.
 */
export function CloseButton({
  onClick,
  'aria-label': ariaLabel,
  size = 'md',
  className = '',
}: CloseButtonProps) {
  return (
    <Button
      variant="close"
      onClick={onClick}
      aria-label={ariaLabel}
      size={size}
      className={className}
    />
  );
}
