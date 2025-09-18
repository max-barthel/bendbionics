/**
 * Design Tokens for Soft Robot App
 *
 * This file contains all the design tokens for the Tahoe glass design system.
 * It consolidates all the duplicate styling patterns found across components.
 */

// Tahoe Glass Effect Tokens
export const tahoeGlass = {
    // Base glass effect - the signature Tahoe style
    base: "bg-white/20 backdrop-blur-xl border border-white/30",

    // Enhanced glass effect with stronger opacity
    enhanced: "bg-white/30 backdrop-blur-xl border border-white/40",

    // Subtle glass effect for overlays
    subtle: "bg-white/10 backdrop-blur-xl border border-white/20",

    // Strong glass effect for emphasis
    strong: "bg-white/40 backdrop-blur-xl border border-white/50",
} as const;

// Shadow Tokens
export const shadows = {
    // Standard shadow for glass elements
    glass: "shadow-2xl",

    // Enhanced shadow for hover states
    glassHover: "hover:shadow-2xl",

    // Subtle shadow for overlays
    subtle: "shadow-sm",

    // Enhanced subtle shadow
    subtleHover: "hover:shadow-md",
} as const;

// Border Radius Tokens
export const borderRadius = {
    // Full rounded corners (most common)
    full: "rounded-full",

    // Large rounded corners
    large: "rounded-xl",

    // Medium rounded corners
    medium: "rounded-lg",

    // Small rounded corners
    small: "rounded-md",
} as const;

// Transition Tokens
export const transitions = {
    // Standard transition for all interactive elements
    standard: "transition-all duration-300",

    // Fast transition for quick feedback
    fast: "transition-all duration-200",

    // Slow transition for smooth animations
    slow: "transition-all duration-500",
} as const;

// Focus States
export const focusStates = {
    // Standard focus ring
    standard: "focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-opacity-50",

    // White focus ring for glass elements
    white: "focus:outline-none focus:ring-2 focus:ring-white/50",

    // Blue focus ring for inputs
    blue: "focus:outline-none focus:ring-2 focus:ring-blue-400/50",
} as const;

// Hover States
export const hoverStates = {
    // Standard glass hover
    glass: "hover:bg-white/30 hover:shadow-2xl",

    // Subtle hover for inputs
    subtle: "hover:bg-white/10 hover:shadow-lg",

    // Scale hover for buttons
    scale: "hover:scale-105",

    // Combined glass and scale hover
    glassScale: "hover:bg-white/30 hover:shadow-2xl hover:scale-105",
} as const;

// Disabled States
export const disabledStates = {
    // Standard disabled state
    standard: "disabled:opacity-50 disabled:cursor-not-allowed",
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
    blueFocus: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.15) 100%)",

    // Enhanced blue gradient
    blueFocusEnhanced: "linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.25) 100%)",

    // White gradient for glass overlays
    whiteOverlay: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",

    // Enhanced white gradient
    whiteOverlayEnhanced: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)",
} as const;

// Box Shadow Values (for inline styles)
export const boxShadows = {
    // Blue focus shadow
    blueFocus: "0 4px 16px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.3)",

    // Glass shadow
    glass: "0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",

    // Enhanced glass shadow
    glassEnhanced: "0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
} as const;

// Border Values (for inline styles)
export const borders = {
    // Blue focus border
    blueFocus: "1px solid rgba(59,130,246,0.4)",

    // Blue focus border (subtle)
    blueFocusSubtle: "1px solid rgba(59,130,246,0.3)",
} as const;

// Type definitions for better TypeScript support
export type TahoeGlassVariant = keyof typeof tahoeGlass;
export type ShadowVariant = keyof typeof shadows;
export type BorderRadiusVariant = keyof typeof borderRadius;
export type TransitionVariant = keyof typeof transitions;
export type FocusStateVariant = keyof typeof focusStates;
export type HoverStateVariant = keyof typeof hoverStates;
export type StyleCombinationVariant = keyof typeof styleCombinations;
