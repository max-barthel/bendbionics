import { useCallback } from 'react';
import { useToggle } from './useToggle';

/**
 * Options for useModal hook
 */
export interface UseModalOptions {
  /**
   * Initial open state
   * @default false
   */
  readonly initialOpen?: boolean;

  /**
   * Callback invoked when modal opens
   */
  readonly onOpen?: () => void;

  /**
   * Callback invoked when modal closes
   */
  readonly onClose?: () => void;
}

/**
 * Return type for useModal hook
 */
export interface UseModalReturn {
  /**
   * Whether the modal is currently open
   */
  readonly isOpen: boolean;

  /**
   * Open the modal
   */
  readonly open: () => void;

  /**
   * Close the modal
   */
  readonly close: () => void;

  /**
   * Toggle the modal open/closed
   */
  readonly toggle: () => void;
}

/**
 * Hook for managing modal state (open/close)
 *
 * Extends useToggle with modal-specific semantics (open/close instead of true/false)
 * and optional callbacks for open/close events.
 *
 * @example
 * ```tsx
 * const modal = useModal({
 *   onOpen: () => console.log('Modal opened'),
 *   onClose: () => console.log('Modal closed'),
 * });
 *
 * <Modal isOpen={modal.isOpen} onClose={modal.close}>
 *   ...
 * </Modal>
 * ```
 */
export function useModal(options: UseModalOptions = {}): UseModalReturn {
  const { initialOpen = false, onOpen, onClose } = options;

  const toggleState = useToggle(initialOpen);

  const open = useCallback(() => {
    toggleState.setTrue();
    onOpen?.();
  }, [toggleState, onOpen]);

  const close = useCallback(() => {
    toggleState.setFalse();
    onClose?.();
  }, [toggleState, onClose]);

  return {
    isOpen: toggleState.value,
    open,
    close,
    toggle: toggleState.toggle,
  };
}
