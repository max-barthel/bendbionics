import React from 'react';
import { combineStyles, getTahoeGlassStyles } from '@/styles/tahoe-utils';

type TahoeGlassVariant = 'base' | 'enhanced' | 'subtle' | 'strong';
type TahoeGlassSize = 'sm' | 'md' | 'lg' | 'xl';

interface TahoeGlassProps extends React.HTMLAttributes<HTMLElement> {
  readonly variant?: TahoeGlassVariant;
  readonly size?: TahoeGlassSize;
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
  // Get Tahoe glass styling based on variant
  const tahoeGlassClasses = getTahoeGlassStyles(
    variant, // glass variant
    'glass', // shadow variant
    'large', // border radius
    'standard', // transition
    'white', // focus state
    'glass' // hover state
  );

  // Size-based padding
  const sizeClasses = {
    sm: 'px-2 py-1',
    md: 'px-4 py-2',
    lg: 'px-6 py-3',
    xl: 'px-8 py-4',
  };

  const classes = combineStyles(
    tahoeGlassClasses,
    sizeClasses[size],
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
