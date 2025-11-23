
import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'lg';
  children: React.ReactNode;
};

export function Button({ children, variant = 'primary', size = 'md', ...props }: ButtonProps): React.ReactNode {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] active:brightness-95';

  const variantStyles = {
    primary: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    secondary: 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 focus:ring-red-500',
  };

  const sizeStyles = {
    md: 'px-3 py-1.5 text-sm sm:px-4 sm:py-2',
    lg: 'px-4 py-2 text-base sm:px-6 sm:py-3',
  };

  const className = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${props.className || ''}`;

  return (
    <button {...props} className={className}>
      {children}
    </button>
  );
}