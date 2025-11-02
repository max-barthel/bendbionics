/**
 * UI Components Index
 *
 * Centralized exports for all UI components, organized by category.
 * All components use named exports for better tree-shaking.
 */

// ========================================
// Buttons & Interactive Elements
// ========================================
export { default as Button } from './Button';
export { PrimaryButton } from './PrimaryButton';
export { IconButton } from './IconButton';
export { ToggleButton } from './ToggleButton';
export { CloseButton } from './CloseButton';

// ========================================
// Form Controls & Inputs
// ========================================
export { default as Input } from './Input';
export { default as NumberInput } from './NumberInput';
export { TahoeNumberInput } from './TahoeNumberInput';
export { default as SliderInput } from './SliderInput';
export { FormField } from './FormField';
export { FloatingLabel, useFloatingLabel } from './FloatingLabel';
export { UnitSelector } from './UnitSelector';

// ========================================
// Layout & Containers
// ========================================
export { default as Card } from './Card';
export { PanelContainer } from './PanelContainer';
export { Modal } from './Modal';
export { default as Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table';
export { TabPanel, Tabs } from './Tabs';

// ========================================
// Feedback & Status
// ========================================
export { default as Alert } from './Alert';
export { default as Badge } from './Badge';
export { FormMessage } from './FormMessage';
export { default as Notification } from './Notification';
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as LoadingOverlay } from './LoadingOverlay';
export { default as ProgressIndicator } from './ProgressIndicator';
export { default as SkeletonLoader } from './SkeletonLoader';

// ========================================
// Typography & Text
// ========================================
export { default as Typography } from './Typography';
export { SubsectionTitle } from './SubsectionTitle';

// ========================================
// Special Components
// ========================================
export { default as TahoeGlass } from './TahoeGlass';
