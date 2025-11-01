import { CloseIcon, ErrorIcon } from '@/components/icons';
import { errorAlertVariants } from '@/styles/design-tokens';
import { combineStyles } from '@/styles/tahoe-utils';
import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onClose: () => void;
}

/**
 * ErrorDisplay - Simple error display component with Tahoe glass styling
 *
 * Uses design tokens for consistent error styling across the app.
 * For more complex error displays with types, use FormErrorDisplay.
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onClose }) => {
  const serverErrorStyles = errorAlertVariants.server;

  return (
    <div
      className={combineStyles(
        'mx-6 mt-4 flex-shrink-0',
        errorAlertVariants.containerBase,
        serverErrorStyles.container
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ErrorIcon className={`h-5 w-5 ${serverErrorStyles.icon}`} />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close error message"
          className={combineStyles(
            errorAlertVariants.buttonBase,
            serverErrorStyles.button
          )}
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
