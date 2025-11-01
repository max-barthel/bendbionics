/**
 * Robot Configuration Feature
 *
 * This module exports all components, hooks, and types related to robot configuration.
 * This includes forms, tabs, controls, and state management for robot parameters.
 */

// Components
export { default as ArrayInputGroup } from './components/ArrayInputGroup';
export { default as FormTabs } from './components/FormTabs';
export { default as RobotForm } from './components/RobotForm';
export { default as SubmitButton } from './components/SubmitButton';

// Form Components
export { FormActions } from './components/forms/FormActions';
export { FormErrorDisplay } from './components/forms/FormErrorDisplay';
export { FormHeader } from './components/forms/FormHeader';
export { RobotStructureInfo } from './components/forms/RobotStructureInfo';

// Tab Components
export { ControlTab } from './components/tabs/ControlTab';
export { RobotSetupTab } from './components/tabs/RobotSetupTab';

// Hooks
export { useFormSubmission } from './hooks/useFormSubmission';
export { useRobotState } from './hooks/useRobotState';

// Re-export types from hooks
export type {
  FormSubmissionResult,
  UseFormSubmissionOptions,
} from './hooks/useFormSubmission';
// RobotState is now in @/types/robot, re-export for backwards compatibility
export type { RobotState } from '@/types/robot';
