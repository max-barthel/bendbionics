import {
  modalSizeClasses,
  modalVariants,
  type ExtendedComponentSize,
} from '@/styles/design-tokens';
import { cn } from '@/styles/tahoe-utils';
import type { ReactNode } from 'react';
import Button from './Button';

interface ModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly title?: string;
  readonly size?: ExtendedComponentSize;
  readonly showCloseButton?: boolean;
  readonly className?: string;
  readonly contentClassName?: string;
}

/**
 * Modal - Reusable modal component with Tahoe glass styling
 *
 * Eliminates duplicate modal overlay patterns found across the app.
 * Standard pattern: fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4
 */
export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  showCloseButton = true,
  className = '',
  contentClassName = '',
}: Readonly<ModalProps>) {
  if (!isOpen) {
    return null;
  }

  const backdropClasses = cn(modalVariants.backdrop, className);

  const contentClasses = cn(
    modalVariants.content,
    modalSizeClasses[size],
    contentClassName
  );

  return (
    <div className={backdropClasses}>
      <div className={contentClasses}>
        {showCloseButton && (
          <Button variant="close" onClick={onClose} aria-label="Close modal" />
        )}
        {title && (
          <div className="p-6 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          </div>
        )}
        <div
          className={
            title
              ? 'p-6 overflow-y-auto max-h-[calc(80vh-80px)]'
              : 'p-6 overflow-y-auto max-h-[80vh]'
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
