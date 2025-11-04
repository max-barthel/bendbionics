import { messageVariants } from '@/styles/design-tokens';
import React from 'react';

interface FormMessageProps {
  readonly message: string;
  readonly type: 'error' | 'success';
  readonly variant?: 'standard' | 'glass';
  readonly showIcon?: boolean;
  readonly className?: string;
  readonly children?: React.ReactNode;
}

/**
 * FormMessage - Reusable component for displaying form error and success messages
 *
 * Consolidates duplicate error/success message patterns across auth forms and other components.
 * Uses design tokens for consistent styling.
 */
export function FormMessage({
  message,
  type,
  variant = 'standard',
  showIcon = type === 'error',
  className = '',
  children,
}: FormMessageProps) {
  const getBaseClasses = () => {
    if (type === 'error') {
      return variant === 'glass' ? messageVariants.errorGlass : messageVariants.error;
    }
    return variant === 'glass'
      ? messageVariants.successShadow
      : messageVariants.success;
  };

  const baseClasses = getBaseClasses();

  const messageTextClass = messageVariants.messageText;

  if (showIcon && type === 'error') {
    return (
      <div className={`${baseClasses} ${className}`}>
        <div className="flex">
          <div className={messageVariants.errorIcon}>
            <svg
              className={messageVariants.errorIconSvg}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className={messageTextClass}>{message}</p>
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} ${className}`}>
      <p className={messageTextClass}>{message}</p>
      {children}
    </div>
  );
}
