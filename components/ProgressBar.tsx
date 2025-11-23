
import React from 'react';

interface ProgressBarProps {
  percentage: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
  const getBarColor = (p: number) => {
    if (p < 40) return 'bg-red-500';
    if (p < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const colorClass = getBarColor(percentage);

  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
      <div
        className={`${colorClass} h-2.5 rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};
