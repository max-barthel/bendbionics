/**
 * Tahoe Glass Utility Functions
 *
 * This file provides utility functions for applying Tahoe glass styling
 * with dynamic effects and consistent patterns.
 */

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
  if (!isFocused) return {};

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
  if (!isHovered) return {};

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
 * Combine multiple style classes with proper spacing
 */
export function combineStyles(...styles: (string | undefined | null)[]): string {
  return styles.filter(Boolean).join(' ');
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
  if (!responsiveOverrides) return baseStyles;

  const responsiveClasses = Object.entries(responsiveOverrides)
    .map(([breakpoint, styles]) => {
      if (!styles) return '';
      return `${breakpoint === 'sm' ? '' : `${breakpoint}:`}${styles}`;
    })
    .filter(Boolean)
    .join(' ');

  return combineStyles(baseStyles, responsiveClasses);
}
