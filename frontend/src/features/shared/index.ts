/**
 * Shared Feature
 *
 * This module exports all shared components, hooks, and types that are used across
 * multiple features. This includes error handling, common UI components, and utilities.
 */

// Components
export { AngleControlPanel } from './components/AngleControlPanel';
export { CollapsibleSection } from './components/CollapsibleSection';
export { ErrorDisplay } from './components/ErrorDisplay';

// Hooks
export {
  useLocalPresets,
  useLocalStorage,
  useRobotSettings,
} from './hooks/useLocalStorage';
export { useRetryAPI } from './hooks/useRetryAPI';
export { useUnifiedErrorHandler } from './hooks/useUnifiedErrorHandler';
export { useAsyncOperation } from './hooks/useAsyncOperation';

// Re-export types from hooks
export type {
  ErrorState,
  ErrorType,
  UseUnifiedErrorHandlerOptions,
} from './hooks/useUnifiedErrorHandler';
export type {
  UseAsyncOperationOptions,
  UseAsyncOperationReturn,
} from './hooks/useAsyncOperation';
