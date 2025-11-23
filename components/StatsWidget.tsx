
import React from 'react';
import { Card } from './Card';
import { BookOpenIcon, SunIcon } from './icons';
import type { DashboardStats } from '../types';

export function StatsWidget({ wordsStudied, studyStreak }: DashboardStats) {
  return (
    <div className="mb-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="!p-3">
          <div className="flex flex-col items-center justify-center text-center">
            <BookOpenIcon className="w-6 h-6 mb-1 text-red-500" />
            <p className="text-2xl font-bold">{wordsStudied}</p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Words Studied</p>
          </div>
        </Card>
        <Card className="!p-3">
          <div className="flex flex-col items-center justify-center text-center">
            <SunIcon className="w-6 h-6 mb-1 text-yellow-500" />
            <p className="text-2xl font-bold">{studyStreak}</p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Day Streak</p>
          </div>
        </Card>
      </div>
    </div>
  );
}