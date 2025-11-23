
import React, { useState, useEffect } from 'react';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { getWordsForReview, getDashboardStats } from './services/statsService';
import { SparklesIcon } from './components/icons';
import { StatsWidget } from './components/StatsWidget';
import type { HanziWord, DashboardStats } from './types';

interface HomePageProps {
  defaultLevel: number;
  onStart: (level: number) => void;
  onViewStats: () => void;
  onStartSmartReview: () => void;
}

export default function HomePage({ defaultLevel, onStart, onViewStats, onStartSmartReview }: HomePageProps): React.ReactNode {
  const [selectedLevel, setSelectedLevel] = useState(defaultLevel);
  const [reviewWords, setReviewWords] = useState<HanziWord[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({ wordsStudied: 0, studyStreak: 0 });
  const levels = [1, 2, 3, 4, 5, 6];

  useEffect(() => {
    const handleFocus = () => {
      setReviewWords(getWordsForReview());
      setDashboardStats(getDashboardStats());
    };
    
    window.addEventListener('focus', handleFocus);
    handleFocus();

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto text-center">
        <header className="mb-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500">Hanzi Drawer</h1>
            <p className="mt-2 text-base text-slate-500 dark:text-slate-400">Select your HSK level or start a smart review.</p>
        </header>

        <StatsWidget wordsStudied={dashboardStats.wordsStudied} studyStreak={dashboardStats.studyStreak} />

        <Card>
            <Button onClick={onStartSmartReview} size="lg" className="w-full mb-4" disabled={reviewWords.length === 0}>
                <SparklesIcon className="w-5 h-5 mr-2" />
                Smart Review ({reviewWords.length} words)
            </Button>
            
            <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-300 dark:border-slate-600" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-slate-800/50 px-2 text-sm text-slate-500 dark:text-slate-400">OR</span>
                </div>
            </div>

            <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Choose a Level</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
                {levels.map(level => (
                    <Button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        variant={selectedLevel === level ? 'primary' : 'secondary'}
                        size="md"
                    >
                        HSK {level}
                    </Button>
                ))}
            </div>
            <Button onClick={() => onStart(selectedLevel)} size="lg" className="w-full">
                Start HSK {selectedLevel}
            </Button>
            <Button onClick={onViewStats} variant="secondary" className="w-full mt-3">
                My Progress
            </Button>
        </Card>
    </div>
  );
}