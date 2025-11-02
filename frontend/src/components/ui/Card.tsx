import React from 'react';
import { shadows } from '@/styles/design-tokens';
import { cn } from '@/styles/tahoe-utils';
import TahoeGlass from './TahoeGlass';

type CardProps = {
  readonly children: React.ReactNode;
  readonly className?: string; // allows to override styles
};

function Card({ children, className = '' }: CardProps) {
  const classes = cn('p-8', shadows.glass, className);

  return (
    <TahoeGlass data-testid="card" className={classes} variant="enhanced" size="lg">
      {children}
    </TahoeGlass>
  );
}

export default Card;
