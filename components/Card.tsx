
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps): React.ReactNode {
  return (
    <div className={`bg-white dark:bg-slate-800/50 rounded-xl shadow-md p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}