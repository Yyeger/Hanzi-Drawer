
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { HomeIcon } from './components/icons';
import { ProgressBar } from './components/ProgressBar';
import { getAllStatsWithDetails } from './services/statsService';
import type { WordStat } from './types';

interface StatsPageProps {
  onGoHome: () => void;
}

type SortKey = 'precision' | 'hskLevel' | 'pinyin';

const getMeaningFontSize = (meaning: string): string => {
    const len = meaning.length;
    if (len > 35) return 'text-base';
    if (len > 20) return 'text-lg';
    return 'text-xl';
};


export default function StatsPage({ onGoHome }: StatsPageProps): React.ReactNode {
  const [stats, setStats] = useState<WordStat[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('precision');

  useEffect(() => {
    setStats(getAllStatsWithDetails());
  }, []);

  const sortedStats = useMemo(() => {
    return [...stats].sort((a, b) => {
      switch (sortKey) {
        case 'precision':
          if (a.precision === b.precision) {
            return b.attempts - a.attempts; // if same %, sort by most practiced
          }
          return a.precision - b.precision;
        case 'hskLevel':
           if (a.hskLevel === b.hskLevel) {
            return a.pinyin.localeCompare(b.pinyin);
          }
          return a.hskLevel - b.hskLevel;
        case 'pinyin':
          return a.pinyin.localeCompare(b.pinyin);
        default:
          return 0;
      }
    });
  }, [stats, sortKey]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500">My Progress</h1>
        <Button onClick={onGoHome} variant="secondary">
          <HomeIcon className="w-5 h-5 sm:mr-2" /><span className="hidden sm:inline">Home</span>
        </Button>
      </header>

      <Card>
        {stats.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-xl text-slate-500 dark:text-slate-400">No stats yet!</p>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Start drawing to track your progress.</p>
          </div>
        ) : (
          <>
            <div className="p-4 flex flex-wrap justify-center gap-2 border-b border-slate-200 dark:border-slate-700 mb-4">
              <span className="self-center font-semibold mr-2">Sort by:</span>
              <Button size="md" variant={sortKey === 'precision' ? 'primary' : 'secondary'} onClick={() => setSortKey('precision')}>Accuracy</Button>
              <Button size="md" variant={sortKey === 'hskLevel' ? 'primary' : 'secondary'} onClick={() => setSortKey('hskLevel')}>HSK Level</Button>
              <Button size="md" variant={sortKey === 'pinyin' ? 'primary' : 'secondary'} onClick={() => setSortKey('pinyin')}>Pinyin</Button>
            </div>
            <ul className="space-y-4 p-4 max-h-[60vh] overflow-y-auto">
              {sortedStats.map(stat => (
                <li key={stat.hanzi} className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg flex flex-col sm:flex-row items-center gap-4">
                  <div className="text-6xl font-bold w-20 text-center">{stat.hanzi}</div>
                  <div className="flex-1 w-full text-center sm:text-left">
                    <p className={`${getMeaningFontSize(stat.meaning)} font-semibold capitalize`}>{stat.meaning}</p>
                    <p className="font-mono text-red-500">{stat.pinyin}</p>
                  </div>
                  <div className="flex-1 w-full">
                     <div className="flex justify-between items-baseline mb-1">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Attempts: {stat.attempts}</span>
                        <span className="font-bold text-lg">{stat.precision.toFixed(0)}%</span>
                     </div>
                     <ProgressBar percentage={stat.precision} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
