import React from 'react';

type CardProps = {
  readonly children: React.ReactNode;
  readonly className?: string; // allows to override styles
};

function Card({ children, className = '' }: CardProps) {
  return (
    <div
      data-testid="card"
      className={`p-8 bg-white rounded-xl shadow-lg border border-neutral-200 ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
