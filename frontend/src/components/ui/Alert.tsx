import React from 'react';

interface AlertProps {
  readonly children: React.ReactNode;
  readonly variant?: 'success' | 'warning' | 'error' | 'info';
  readonly className?: string;
}

function Alert({ children, variant = 'info', className = '' }: Readonly<AlertProps>) {
  const baseClasses = 'p-4 rounded-full border-l-4';

  const variantClasses = {
    success: 'bg-green-50 border-green-400 text-green-800',
    warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
    error: 'bg-red-50 border-red-400 text-red-800',
    info: 'bg-blue-50 border-blue-400 text-blue-800',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return <div className={classes}>{children}</div>;
};

export default Alert;
