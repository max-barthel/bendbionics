/**
 * Shared Feature
 *
 * This module exports all shared components, hooks, and types that are used across
 * multiple features. This includes error handling, common UI components, and utilities.
 */

// Components
export { default as AngleControlPanel } from './components/AngleControlPanel';
export { default as CollapsibleSection } from './components/CollapsibleSection';
export { ErrorBoundary } from './components/ErrorBoundary';
export { ErrorDisplay } from './components/ErrorDisplay';
export { default as NumberInput } from './components/NumberInput';

// Hooks
export { useErrorHandler } from './hooks/useErrorHandler';
export { useLocalPresets, useLocalStorage, useRobotSettings } from './hooks/useLocalStorage';
export { useRetryAPI } from './hooks/useRetryAPI';
export { useUnifiedErrorHandler } from './hooks/useUnifiedErrorHandler';

// Re-export types from hooks
export type { RetryOptions } from './hooks/useRetryAPI';
export type { ErrorState, ErrorType, UseUnifiedErrorHandlerOptions } from './hooks/useUnifiedErrorHandler';

