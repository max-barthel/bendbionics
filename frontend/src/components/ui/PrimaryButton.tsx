import { buttonVariants } from '@/styles/design-tokens';
import { combineStyles } from '@/styles/tahoe-utils';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * PrimaryButton - Reusable primary button with blue gradient styling
 *
 * Extracted from SignInButton, RobotSetupTab, and other components
 * to eliminate hardcoded style duplication.
 */
export function PrimaryButton({
  children,
  className = '',
  ...restProps
}: Readonly<PrimaryButtonProps>) {
  const classes = combineStyles(buttonVariants.primary, className);

  return (
    <button className={classes} {...restProps}>
      {children}
      <div className="absolute inset-0 rounded-full pointer-events-none z-0 bg-gradient-to-br from-white/10 to-white/5 shadow-inner" />
    </button>
  );
}
