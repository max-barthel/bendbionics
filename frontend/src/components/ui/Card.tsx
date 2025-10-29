import React from 'react';
import TahoeGlass from './TahoeGlass';

type CardProps = {
  readonly children: React.ReactNode;
  readonly className?: string; // allows to override styles
};

function Card({ children, className = '' }: CardProps) {
  return (
    <TahoeGlass
      data-testid="card"
      className={`p-8 shadow-2xl shadow-black/20 ${className}`}
      variant="enhanced"
      size="lg"
    >
      {children}
    </TahoeGlass>
  );
}

export default Card;
