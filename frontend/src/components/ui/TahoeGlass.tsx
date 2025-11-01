import {
  containerSizeClasses,
  type ExtendedComponentSize,
  type TahoeGlassVariant,
} from '@/styles/design-tokens';
import { combineStyles, getTahoeGlassPreset } from '@/styles/tahoe-utils';
import React from 'react';

interface TahoeGlassProps extends React.HTMLAttributes<HTMLElement> {
  readonly variant?: TahoeGlassVariant;
  readonly size?: ExtendedComponentSize;
  readonly children: React.ReactNode;
  readonly as?: keyof React.JSX.IntrinsicElements;
}

/**
 * TahoeGlass - A reusable component for Tahoe glass effect elements
 *
 * This component provides consistent Tahoe glass styling across the application.
 * It consolidates all the duplicate glass effect patterns into a single component.
 */
function TahoeGlass({
  variant = 'base',
  size = 'md',
  children,
  className = '',
  style = {},
  onClick,
  as: Component = 'div',
  ...restProps
}: TahoeGlassProps) {
  // Get Tahoe glass styling based on variant using container preset
  const tahoeGlassClasses = getTahoeGlassPreset('container', variant);

  const classes = combineStyles(
    tahoeGlassClasses,
    containerSizeClasses[size],
    onClick ? 'cursor-pointer' : '',
    className
  );

  return React.createElement(
    Component,
    { ...restProps, className: classes, style, onClick },
    children
  );
}

export default TahoeGlass;
