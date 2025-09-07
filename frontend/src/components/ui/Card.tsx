import React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string; // allows to override styles
};

function Card({ children, className = "" }: CardProps) {
  return (
    <div
      data-testid="card"
      className={`p-8 bg-white rounded-full shadow-lg border border-neutral-200 ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
