/**
 * Features Index
 *
 * This module provides a centralized export point for all application features.
 * Import from here to get access to any feature's components, hooks, or types.
 */

// Re-export all items from each feature
export {
    ArrayInputGroup, FormTabs,
    // Robot Configuration
    RobotForm, SubmitButton, useFormSubmission, useRobotState
} from './robot-config';

export {
    TendonConfigPanel,
    TendonResultsPanel,
    // Visualization
    Visualizer3D
} from './visualization';

export {
    // Presets
    PresetManager,
    useConfigurationLoader
} from './presets';

export {
    AngleControlPanel, CollapsibleSection,
    // Shared
    ErrorBoundary,
    ErrorDisplay, NumberInput, useErrorHandler, useLocalStorage,
    useRetryAPI, useUnifiedErrorHandler
} from './shared';

