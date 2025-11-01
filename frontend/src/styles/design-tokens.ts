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

  // Outline button variant (white background with border)
  outline:
    'border border-gray-300 bg-white/80 backdrop-blur-sm hover:bg-white/90 rounded-full transition-all duration-300 hover:scale-105',

  // Solid button variant (blue gradient)
  solid:
    'bg-gradient-to-br from-blue-500/25 to-indigo-500/25 backdrop-blur-xl border border-blue-400/30 shadow-lg hover:scale-105 rounded-full transition-all duration-300 shadow-blue-500/20',
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

// Modal Variants
export const modalVariants = {
  // Modal backdrop overlay
  backdrop:
    'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4',

  // Modal content container (standard white)
  content:
    'bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-h-[80vh] overflow-hidden relative',

  // Modal content with Tahoe glass effect
  contentGlass: 'bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl',
} as const;

// Slider Variants
export const sliderVariants = {
  // Slider track base styles
  track:
    'w-full h-2 appearance-none cursor-pointer rounded-full bg-white/20 backdrop-blur-xl border-2 border-white/40 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400/50',

  // Webkit slider thumb base (common styles)
  thumbBase:
    'appearance-none h-5 w-5 rounded-full cursor-pointer border-2 border-white/50 transition-all duration-300 hover:scale-110 bg-gradient-to-br from-blue-500/90 to-indigo-600/90 shadow-lg shadow-blue-500/30',

  // Webkit slider thumb pseudo-selector classes
  webkitThumb:
    '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/50 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-300 [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-blue-500/90 [&::-webkit-slider-thumb]:to-indigo-600/90 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-blue-500/30',

  // Mozilla slider thumb pseudo-selector classes
  mozThumb:
    '[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/50 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:bg-gradient-to-br [&::-moz-range-thumb]:from-blue-500/90 [&::-moz-range-thumb]:to-indigo-600/90',

  // Combined slider input styles (track + webkit + moz)
  input:
    'w-full h-2 appearance-none cursor-pointer rounded-full bg-white/20 backdrop-blur-xl border-2 border-white/40 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400/50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/50 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-300 [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-blue-500/90 [&::-webkit-slider-thumb]:to-indigo-600/90 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-blue-500/30 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/50 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:bg-gradient-to-br [&::-moz-range-thumb]:from-blue-500/90 [&::-moz-range-thumb]:to-indigo-600/90',
} as const;

// Tab Variants
export const tabVariants = {
  // Tab container (similar to unit selector)
  container:
    'flex bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/20 rounded-full p-1 shadow-2xl shadow-black/5 gap-1',

  // Active tab button
  buttonActive:
    'relative w-24 h-8 flex items-center justify-center flex-1 text-xs font-medium rounded-full transition-colors duration-200 border-2 bg-blue-500/20 text-gray-900 border-blue-400/50',

  // Inactive tab button
  buttonInactive:
    'relative w-24 h-8 flex items-center justify-center flex-1 text-xs font-medium rounded-full transition-colors duration-200 border-2 text-gray-600 hover:text-gray-800 hover:bg-white/20 border-transparent',

  // Active tab inner gradient overlay
  buttonActiveOverlay:
    'absolute inset-0 rounded-full pointer-events-none bg-gradient-to-br from-white/10 to-white/5 shadow-inner',
} as const;

// Error Alert Variants
export const errorAlertVariants = {
  // Validation error (amber/yellow)
  validation: {
    container: 'bg-amber-50 border-amber-400 text-amber-800',
    icon: 'text-amber-400',
    button: 'text-amber-500 hover:bg-amber-100 focus:ring-amber-500',
  },

  // Network error (blue)
  network: {
    container: 'bg-blue-50 border-blue-400 text-blue-800',
    icon: 'text-blue-400',
    button: 'text-blue-500 hover:bg-blue-100 focus:ring-blue-500',
  },

  // Server error (red)
  server: {
    container: 'bg-red-50 border-red-400 text-red-800',
    icon: 'text-red-400',
    button: 'text-red-500 hover:bg-red-100 focus:ring-red-500',
  },

  // Unknown/Generic error (gray)
  unknown: {
    container: 'bg-gray-50 border-gray-400 text-gray-800',
    icon: 'text-gray-400',
    button: 'text-gray-500 hover:bg-gray-100 focus:ring-gray-500',
  },

  // Error alert container base
  containerBase: 'p-4 rounded-lg border-l-4',

  // Error alert button base
  buttonBase:
    'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',

  // Error alert with Tahoe glass effect (for Profile component)
  tahoeGlass: {
    red: 'bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl',
  },
} as const;

// Form Message Variants (for FormMessage component)
export const messageVariants = {
  // Standard error message
  error: 'mb-4 p-3 bg-red-50 border border-red-200 rounded-md',

  // Error message with Tahoe glass effect
  errorGlass: 'mb-4 p-3 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl',

  // Standard success message
  success: 'mb-4 p-3 bg-green-50 border border-green-200 rounded-md',

  // Success message with Tahoe glass effect (called successShadow in component)
  successShadow: 'mb-4 p-3 bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-xl',

  // Message text styling
  messageText: 'text-sm font-medium',

  // Error icon container
  errorIcon: 'flex-shrink-0',

  // Error icon SVG styling
  errorIconSvg: 'h-5 w-5 text-red-400',
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
export type ModalVariant = keyof typeof modalVariants;
export type SliderVariant = keyof typeof sliderVariants;
export type TabVariant = keyof typeof tabVariants;
export type ErrorAlertVariant = keyof typeof errorAlertVariants;
export type MessageVariant = keyof typeof messageVariants;
