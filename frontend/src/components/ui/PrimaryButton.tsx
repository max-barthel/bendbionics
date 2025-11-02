import Button from './Button';

interface PrimaryButtonProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly 'aria-label'?: string;
}

/**
 * PrimaryButton - Reusable primary button with blue gradient styling
 *
 * @deprecated Use Button with variant="primary" instead.
 * This component is kept for backward compatibility.
 */
export function PrimaryButton({
  children,
  className = '',
  onClick,
  disabled,
  type,
  'aria-label': ariaLabel,
}: Readonly<PrimaryButtonProps>) {
  return (
    <Button
      variant="primary"
      className={className}
      {...(onClick && { onClick })}
      {...(disabled !== undefined && { disabled })}
      {...(type && { type })}
      {...(ariaLabel && { 'aria-label': ariaLabel })}
    >
      {children}
    </Button>
  );
}
