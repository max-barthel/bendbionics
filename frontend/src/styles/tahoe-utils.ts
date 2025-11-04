/**
 * Tahoe Glass Utility Functions
 *
 * This file provides utility functions for applying Tahoe glass styling
 * with dynamic effects and consistent patterns.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  borderRadius,
  borders,
  boxShadows,
  disabledStates,
  focusStates,
  gradients,
  hoverStates,
  shadows,
  styleCombinations,
  tahoeGlass,
  tahoeGlassPresets,
  transitions,
  type BorderRadiusVariant,
  type FocusStateVariant,
  type HoverStateVariant,
  type ShadowVariant,
  type TahoeGlassVariant,
  type TransitionVariant,
} from './design-tokens';

/**
 * Get Tahoe glass styles with optional variants
 */
export function getTahoeGlassStyles(
  glassVariant: TahoeGlassVariant = 'base',
  shadowVariant: ShadowVariant = 'glass',
  borderRadiusVariant: BorderRadiusVariant = 'full',
  transitionVariant: TransitionVariant = 'standard',
  focusVariant: FocusStateVariant = 'white',
  hoverVariant: HoverStateVariant = 'glass',
  includeDisabled: boolean = true
): string {
  const styles: string[] = [
    tahoeGlass[glassVariant],
    shadows[shadowVariant],
    borderRadius[borderRadiusVariant],
    transitions[transitionVariant],
    focusStates[focusVariant],
    hoverStates[hoverVariant],
  ];

  if (includeDisabled) {
    styles.push(disabledStates.standard);
  }

  return styles.join(' ');
}

/**
 * Get Tahoe glass styles using a preset
 * This simplifies common style combinations used across components
 */
export function getTahoeGlassPreset(
  preset: keyof typeof tahoeGlassPresets,
  glassVariantOverride?: TahoeGlassVariant,
  includeDisabled: boolean = true
): string {
  const presetConfig = tahoeGlassPresets[preset];

  // Handle container preset which doesn't have a fixed glassVariant
  if (preset === 'container') {
    if (!glassVariantOverride) {
      throw new Error(
        "Container preset requires a glassVariantOverride parameter since it doesn't have a fixed glass variant"
      );
    }
    return getTahoeGlassStyles(
      glassVariantOverride,
      presetConfig.shadowVariant,
      presetConfig.borderRadiusVariant,
      presetConfig.transitionVariant,
      presetConfig.focusVariant,
      presetConfig.hoverVariant,
      includeDisabled
    );
  }

  // For other presets, use the preset's glassVariant unless overridden
  // TypeScript doesn't narrow the union type, so we use 'in' to check
  const glassVariant =
    glassVariantOverride ||
    ('glassVariant' in presetConfig ? presetConfig.glassVariant : 'base');

  return getTahoeGlassStyles(
    glassVariant,
    presetConfig.shadowVariant,
    presetConfig.borderRadiusVariant,
    presetConfig.transitionVariant,
    presetConfig.focusVariant,
    presetConfig.hoverVariant,
    includeDisabled
  );
}

/**
 * Get pre-composed style combination
 */
export function getStyleCombination(
  combination: keyof typeof styleCombinations
): string {
  return styleCombinations[combination];
}

/**
 * Get dynamic focus styles for inline styling
 */
export function getFocusStyles(isFocused: boolean, variant: 'blue' | 'white' = 'blue') {
  if (!isFocused) {
    return {};
  }

  if (variant === 'blue') {
    return {
      background: gradients.blueFocus,
      boxShadow: boxShadows.blueFocus,
      border: borders.blueFocus,
    };
  }

  return {
    background: gradients.whiteOverlay,
    boxShadow: boxShadows.glass,
  };
}

/**
 * Get dynamic hover styles for inline styling
 */
export function getHoverStyles(isHovered: boolean) {
  if (!isHovered) {
    return {};
  }

  return {
    background: gradients.whiteOverlayEnhanced,
    boxShadow: boxShadows.glassEnhanced,
  };
}

/**
 * Get slider progress styles
 */
export function getSliderProgressStyles(
  progress: number,
  isAngle: boolean = false,
  min: number = 0,
  max: number = 100
) {
  const baseStyles = {
    background:
      'linear-gradient(135deg, rgba(59,130,246,0.8) 0%, rgba(99,102,241,0.8) 100%)',
    boxShadow: '0 2px 8px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
  };

  if (isAngle) {
    // For angles: center at 0, extend left for negative, right for positive
    return {
      ...baseStyles,
      left: progress < 0 ? `${50 + (progress / Math.abs(min)) * 50}%` : '50%',
      width:
        progress < 0
          ? `${Math.abs(progress / min) * 50}%`
          : `${(progress / max) * 50}%`,
    };
  }

  // For regular sliders: start from left
  return {
    ...baseStyles,
    width: `${Math.max(0, Math.min(100, ((progress - min) / (max - min)) * 100))}%`,
  };
}

/**
 * Get label styles for floating labels
 */
export function getFloatingLabelStyles(shouldFloat: boolean) {
  if (shouldFloat) {
    return `${tahoeGlass.base} ${borderRadius.full} px-1.5`;
  }
  return '';
}

/**
 * Combine multiple style classes with proper Tailwind class merging
 *
 * Uses clsx for conditional classes and tailwind-merge to intelligently
 * merge conflicting Tailwind classes (e.g., last class wins).
 *
 * @example
 * cn('px-2 py-1', 'px-4') // Returns 'py-1 px-4' (px-4 overrides px-2)
 * cn('bg-red-500', className && 'bg-blue-500') // Conditionally applies class
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * @deprecated Use `cn` instead. This function is kept for backward compatibility.
 * Combines multiple style classes with proper spacing (legacy implementation).
 */
// NOSONAR - Intentionally deprecated signature for backward compatibility during migration to cn()
export function combineStyles(...styles: (string | undefined | null)[]): string {
  return cn(...styles);
}

/**
 * Get responsive styles based on screen size
 */
export function getResponsiveStyles(
  baseStyles: string,
  responsiveOverrides?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  }
): string {
  if (!responsiveOverrides) {
    return baseStyles;
  }

  const responsiveClasses = Object.entries(responsiveOverrides)
    .map(([breakpoint, styles]) => {
      if (!styles) {
        return '';
      }
      const prefix = breakpoint === 'sm' ? '' : `${breakpoint}:`;
      return `${prefix}${styles}`;
    })
    .filter(Boolean)
    .join(' ');

  return combineStyles(baseStyles, responsiveClasses);
}
