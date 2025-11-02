import { combineStyles } from '@/styles/tahoe-utils';
import type { ReactNode } from 'react';

interface AuthFormContainerProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * AuthFormContainer - Reusable container for authentication forms
 *
 * Extracted from LoginForm and RegisterForm to eliminate duplicate styling
 * and ensure consistent auth form appearance using design tokens.
 */
export function AuthFormContainer({
  children,
  className = '',
}: Readonly<AuthFormContainerProps>) {
  // Using consistent auth form container styling
  // Note: Auth forms use white background rather than glass effect for readability
  const baseClasses =
    'w-full max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-2xl shadow-sm';
  const classes = combineStyles(baseClasses, className);

  return <div className={classes}>{children}</div>;
}
