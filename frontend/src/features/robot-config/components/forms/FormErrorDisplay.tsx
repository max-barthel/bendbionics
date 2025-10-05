type ErrorType = 'network' | 'validation' | 'server' | 'auth' | 'unknown';

interface ErrorState {
  type: ErrorType;
  message: string;
  visible: boolean;
}

/**
 * FormErrorDisplay - Displays form errors with appropriate styling and icons
 *
 * This component provides consistent error display across all forms with:
 * - Color-coded error types (validation, network, server, unknown)
 * - Appropriate icons for each error type
 * - Dismissible error messages
 */
export function FormErrorDisplay({
  error,
  onClose,
}: {
  readonly error: ErrorState;
  readonly onClose: () => void;
}) {
  if (!error.visible) {
    return null;
  }

  const getErrorStyles = (type: ErrorType) => {
    switch (type) {
      case 'validation':
        return {
          container: 'bg-amber-50 border-amber-400 text-amber-800',
          icon: 'text-amber-400',
          button: 'text-amber-500 hover:bg-amber-100 focus:ring-amber-500',
        };
      case 'network':
        return {
          container: 'bg-blue-50 border-blue-400 text-blue-800',
          icon: 'text-blue-400',
          button: 'text-blue-500 hover:bg-blue-100 focus:ring-blue-500',
        };
      case 'server':
        return {
          container: 'bg-red-50 border-red-400 text-red-800',
          icon: 'text-red-400',
          button: 'text-red-500 hover:bg-red-100 focus:ring-red-500',
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-400 text-gray-800',
          icon: 'text-gray-400',
          button: 'text-gray-500 hover:bg-gray-100 focus:ring-gray-500',
        };
    }
  };

  const getErrorIcon = (type: ErrorType) => {
    switch (type) {
      case 'validation':
        return (
          <svg
            className="h-5 w-5 text-amber-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'network':
        return (
          <svg
            className="h-5 w-5 text-blue-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'server':
        return (
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="h-5 w-5 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const styles = getErrorStyles(error.type);

  return (
    <div className={`p-4 rounded-lg border-l-4 ${styles.container}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">{getErrorIcon(error.type)}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{error.message}</p>
        </div>
        <div className="ml-auto pl-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close error message"
            title="Close error message"
            className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
