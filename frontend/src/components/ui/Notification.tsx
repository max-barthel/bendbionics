import React from 'react';

// Constants
const DEFAULT_NOTIFICATION_DURATION = 5000;

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  type: NotificationType;
  title: string;
  message?: string;
  isVisible: boolean;
  onClose: () => void;
  autoHide?: boolean;
  duration?: number;
}

// Helper function to get notification type classes
function getNotificationClasses(type: NotificationType) {
  const classes = {
    success: {
      type: 'bg-green-50 border-green-400 text-green-800',
      icon: 'text-green-400',
      close: 'text-green-500 hover:bg-green-100 focus:ring-green-500',
    },
    error: {
      type: 'bg-red-50 border-red-400 text-red-800',
      icon: 'text-red-400',
      close: 'text-red-500 hover:bg-red-100 focus:ring-red-500',
    },
    warning: {
      type: 'bg-yellow-50 border-yellow-400 text-yellow-800',
      icon: 'text-yellow-400',
      close: 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-500',
    },
    info: {
      type: 'bg-blue-50 border-blue-400 text-blue-800',
      icon: 'text-blue-400',
      close: 'text-blue-500 hover:bg-blue-100 focus:ring-blue-500',
    },
  };
  return {
    typeClass: classes[type].type,
    iconClass: classes[type].icon,
    closeButtonClass: classes[type].close,
  };
}

// Success icon component
function SuccessIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// Error icon component
function ErrorIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// Warning icon component
function WarningIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// Info icon component
function InfoIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// Helper function to get the appropriate icon
function getNotificationIcon(type: NotificationType): React.ReactElement {
  switch (type) {
    case 'success':
      return <SuccessIcon />;
    case 'error':
      return <ErrorIcon />;
    case 'warning':
      return <WarningIcon />;
    case 'info':
      return <InfoIcon />;
    default:
      return <InfoIcon />;
  }
}

// Close button component
function CloseButton({
  onClose,
  closeButtonClass,
}: {
  readonly onClose: () => void;
  readonly closeButtonClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClose}
      className={`inline-flex rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${closeButtonClass}`}
      aria-label="Close notification"
    >
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}

function Notification({
  type,
  title,
  message,
  isVisible,
  onClose,
  autoHide = true,
  duration = DEFAULT_NOTIFICATION_DURATION,
}: Readonly<NotificationProps>) {
  React.useEffect(() => {
    if (isVisible && autoHide) {
      const timer = setTimeout(() => onClose(), duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, autoHide, duration, onClose]);

  if (!isVisible) {
    return null;
  }

  const { typeClass, iconClass, closeButtonClass } = getNotificationClasses(type);

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-full border-l-4 shadow-lg max-w-sm ${typeClass}`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className={iconClass}>{getNotificationIcon(type)}</div>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          {message && <p className="mt-1 text-sm opacity-90">{message}</p>}
        </div>
        <div className="ml-auto pl-3">
          <CloseButton onClose={onClose} closeButtonClass={closeButtonClass} />
        </div>
      </div>
    </div>
  );
}

export default Notification;
