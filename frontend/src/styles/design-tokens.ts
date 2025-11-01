/**
 * Design Tokens for BendBionics
 *
 * This file contains all the design tokens for the Tahoe glass design system.
 * It consolidates all the duplicate styling patterns found across components.
 */

// Tahoe Glass Effect Tokens
export const tahoeGlass = {
  // Base glass effect - the signature Tahoe style (transparent frosted glass)
  base: 'bg-white/2 backdrop-blur-sm border border-white/5',

  // Enhanced glass effect with stronger opacity
  enhanced: 'bg-white/5 backdrop-blur-md border border-white/10',

  // Subtle glass effect for overlays
  subtle: 'bg-white/1 backdrop-blur-sm border border-white/3',

  // Strong glass effect for emphasis
  strong: 'bg-white/10 backdrop-blur-lg border border-white/15',
} as const;

// Shadow Tokens
export const shadows = {
  // Standard shadow for glass elements
  glass: 'shadow-2xl',

  // Enhanced shadow for hover states
  glassHover: 'hover:shadow-2xl',

  // Subtle shadow for overlays
  subtle: 'shadow-sm',

  // Enhanced subtle shadow
  subtleHover: 'hover:shadow-md',
} as const;

// Border Radius Tokens
export const borderRadius = {
  // Full rounded corners (most common)
  full: 'rounded-full',

  // Large rounded corners
  large: 'rounded-xl',

  // Medium rounded corners
  medium: 'rounded-lg',

  // Small rounded corners
  small: 'rounded-md',
} as const;

// Transition Tokens
export const transitions = {
  // Standard transition for all interactive elements
  standard: 'transition-all duration-300',

  // Fast transition for quick feedback
  fast: 'transition-all duration-200',

  // Slow transition for smooth animations
  slow: 'transition-all duration-500',
} as const;

// Focus States
export const focusStates = {
  // Standard focus ring
  standard:
    'focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-opacity-50',

  // White focus ring for glass elements
  white: 'focus:outline-none focus:ring-2 focus:ring-white/50',

  // Blue focus ring for inputs
  blue: 'focus:outline-none focus:ring-2 focus:ring-blue-400/50',
} as const;

// Hover States
export const hoverStates = {
  // Standard glass hover (transparent frosted glass)
  glass: 'hover:bg-white/5 hover:shadow-2xl',

  // Subtle hover for inputs
  subtle: 'hover:bg-white/3 hover:shadow-lg',

  // Scale hover for buttons
  scale: 'hover:scale-105',

  // Combined glass and scale hover
  glassScale: 'hover:bg-white/5 hover:shadow-2xl hover:scale-105',
} as const;

// Disabled States
export const disabledStates = {
  // Standard disabled state
  standard: 'disabled:opacity-50 disabled:cursor-not-allowed',
} as const;

// Pre-composed Style Combinations
export const styleCombinations = {
  // Standard Tahoe glass button
  tahoeButton: `${tahoeGlass.base} ${shadows.glass} ${borderRadius.full} ${transitions.standard} ${focusStates.white} ${hoverStates.glass} ${disabledStates.standard}`,

  // Tahoe glass input
  tahoeInput: `${tahoeGlass.base} ${borderRadius.full} ${transitions.standard} ${focusStates.blue} ${disabledStates.standard}`,

  // Tahoe glass card/container
  tahoeCard: `${tahoeGlass.base} ${shadows.glass} ${borderRadius.large} ${transitions.standard}`,

  // Tahoe glass overlay
  tahoeOverlay: `${tahoeGlass.subtle} ${shadows.subtle} ${borderRadius.medium} ${transitions.standard}`,

  // Tahoe glass slider
  tahoeSlider: `${tahoeGlass.base} ${borderRadius.full} ${transitions.standard} ${focusStates.standard}`,
} as const;

// Color Gradients (for dynamic styling)
export const gradients = {
  // Blue gradient for focus states
  blueFocus:
    'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.15) 100%)',

  // Enhanced blue gradient
  blueFocusEnhanced:
    'linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.25) 100%)',

  // White gradient for glass overlays
  whiteOverlay:
    'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',

  // Enhanced white gradient
  whiteOverlayEnhanced:
    'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)',
} as const;

// Box Shadow Values (for inline styles)
export const boxShadows = {
  // Blue focus shadow
  blueFocus: '0 4px 16px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',

  // Glass shadow
  glass: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',

  // Enhanced glass shadow
  glassEnhanced: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
} as const;

// Border Values (for inline styles)
export const borders = {
  // Blue focus border
  blueFocus: '1px solid rgba(59,130,246,0.4)',

  // Blue focus border (subtle)
  blueFocusSubtle: '1px solid rgba(59,130,246,0.3)',
} as const;

// Button Variants
export const buttonVariants = {
  // Primary button with blue gradient (extracted from SignInButton, RobotSetupTab, etc.)
  primary:
    'flex items-center gap-2 backdrop-blur-xl border border-blue-400/30 shadow-lg transition-all duration-300 hover:scale-105 rounded-full bg-gradient-to-br from-blue-500/25 to-indigo-500/25 shadow-blue-500/20',

  // Primary button text style
  primaryText: 'text-sm font-medium text-gray-900',
} as const;

// Toggle Button Variants
export const toggleButtonVariants = {
  // Standard toggle button for panels (extracted from TendonResultsPanel)
  panelToggle:
    'bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-1.5 shadow-2xl hover:bg-white/10 hover:shadow-2xl transition-all duration-300 ease-in-out z-50 hover:scale-105',

  // Toggle button icon style
  panelToggleIcon: 'w-4 h-4 text-gray-600 transition-transform duration-300',
} as const;

// Panel/Container Variants
export const panelVariants = {
  // Standard panel container (for TendonResultsPanel, etc.)
  container:
    'bg-white/2 backdrop-blur-sm border border-white/5 rounded-tl-2xl shadow-2xl shadow-black/10',

  // Segment selector container (from AngleControlPanel)
  segmentSelector:
    'bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-2xl shadow-black/5',

  // Selected segment button
  segmentSelected:
    'bg-gradient-to-br from-blue-500/25 to-indigo-500/25 text-gray-900 shadow-lg border border-blue-400/30 shadow-blue-500/10',

  // Unselected segment button
  segmentUnselected: 'text-gray-600 hover:text-gray-800 hover:bg-white/20',
} as const;

// Table Cell Variants
export const tableCellVariants = {
  // Standard table header cell
  header:
    'px-3 py-2 text-center text-sm font-medium text-gray-700 bg-white/10 border border-white/20',

  // Standard table body cell
  body: 'px-3 py-2 text-sm text-center text-gray-600 bg-white/5 border border-white/20',

  // Table header cell with border radius (first column)
  headerFirst:
    'px-3 py-2 text-center text-sm font-medium text-gray-700 bg-white/10 border border-white/20 rounded-tl-lg',

  // Table body cell with border radius (first column, bottom)
  bodyFirst:
    'px-3 py-2 text-sm font-medium text-gray-700 bg-white/10 border border-white/20 rounded-bl-lg',

  // Bold/Total row cell
  total:
    'px-3 py-2 text-sm font-bold text-center text-gray-800 bg-white/15 border border-white/20',

  // Bold/Total row cell (header)
  totalHeader:
    'px-3 py-2 text-sm font-bold text-gray-800 bg-white/15 border border-white/20',
} as const;

// Unit Selector Variants
export const unitSelectorVariants = {
  // Container for unit selector buttons
  container: 'flex bg-white/10 border border-white/20 rounded-full p-1 shadow-lg gap-1',

  // Selected unit button
  buttonSelected:
    'relative flex-1 h-7 px-3 flex items-center justify-center text-xs font-medium rounded-full transition-colors duration-200 border-2 bg-blue-500/30 text-gray-900 border-blue-400/50',

  // Unselected unit button
  buttonUnselected:
    'relative flex-1 h-7 px-3 flex items-center justify-center text-xs font-medium rounded-full transition-colors duration-200 border-2 text-gray-600 hover:text-gray-800 hover:bg-white/30 border-transparent',

  // Selected button inner gradient overlay
  buttonSelectedOverlay:
    'absolute inset-0 rounded-full pointer-events-none bg-gradient-to-br from-white/10 to-white/5 shadow-inner',
} as const;

// Type definitions for better TypeScript support
export type TahoeGlassVariant = keyof typeof tahoeGlass;
export type ShadowVariant = keyof typeof shadows;
export type BorderRadiusVariant = keyof typeof borderRadius;
export type TransitionVariant = keyof typeof transitions;
export type FocusStateVariant = keyof typeof focusStates;
export type HoverStateVariant = keyof typeof hoverStates;
export type StyleCombinationVariant = keyof typeof styleCombinations;
export type ButtonVariant = keyof typeof buttonVariants;
export type ToggleButtonVariant = keyof typeof toggleButtonVariants;
export type PanelVariant = keyof typeof panelVariants;
export type TableCellVariant = keyof typeof tableCellVariants;
export type UnitSelectorVariant = keyof typeof unitSelectorVariants;
