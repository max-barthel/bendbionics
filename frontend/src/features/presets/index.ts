/**
 * Presets Feature
 *
 * This module exports all components, hooks, and types related to preset management.
 * This includes preset loading, saving, and configuration management.
 */

// Components
export { PresetManager } from './components/presets/PresetManager';

// Hooks
export { useConfigurationLoader } from './hooks/useConfigurationLoader';

// Re-export types from hooks
export type { ConfigurationLoaderOptions } from './hooks/useConfigurationLoader';
